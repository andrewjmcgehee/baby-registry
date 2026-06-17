import { readFileSync } from "node:fs";
import { createServerFn } from "@tanstack/react-start";
// Aliased: this is a TanStack server helper, not a React hook (avoids the
// `useSession`/use-prefix lint heuristic).
import { useSession as openSession } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Server-only admin module. Everything here runs on the web server (inside
 * `createServerFn` handlers), so the secrets below are never shipped to the
 * browser. The flow is:
 *
 *   browser ──(session cookie)──▶ web server ──(ADMIN_SECRET)──▶ Convex
 *
 * Required server env vars (web app deployment):
 *   ADMIN_USER_HASH  sha256 hex of the admin username
 *   ADMIN_PASS_HASH  sha256 hex of the admin password
 *   SESSION_SECRET   >=32 char random string (encrypts the session cookie)
 *   ADMIN_SECRET     shared secret; must match the Convex deployment's ADMIN_SECRET
 */

type AdminSession = { admin?: boolean };

// --- env access -------------------------------------------------------------
// Prefer the real process env (production hosts inject it there); fall back to
// parsing .env.local / .env so local dev works without exporting anything.
let dotenvCache: Record<string, string> | null = null;
function dotenv(): Record<string, string> {
	if (dotenvCache) return dotenvCache;
	dotenvCache = {};
	for (const file of [".env.local", ".env"]) {
		try {
			for (const raw of readFileSync(file, "utf8").split("\n")) {
				const line = raw.trim();
				if (!line || line.startsWith("#")) continue;
				const eq = line.indexOf("=");
				if (eq === -1) continue;
				const key = line.slice(0, eq).trim();
				let val = line
					.slice(eq + 1)
					.trim()
					.replace(/\s+#.*$/, "");
				if (
					(val.startsWith('"') && val.endsWith('"')) ||
					(val.startsWith("'") && val.endsWith("'"))
				) {
					val = val.slice(1, -1);
				}
				if (!(key in dotenvCache)) dotenvCache[key] = val;
			}
		} catch {
			// file may not exist — ignore
		}
	}
	return dotenvCache;
}

function env(key: string): string | undefined {
	return process.env[key] ?? dotenv()[key];
}

function requireEnv(key: string): string {
	const value = env(key);
	if (!value) throw new Error(`Missing required server env var: ${key}`);
	return value;
}

// --- crypto helpers ---------------------------------------------------------
async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(input),
	);
	return [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

// --- session ----------------------------------------------------------------
function sessionConfig() {
	const password = requireEnv("SESSION_SECRET");
	if (password.length < 32) {
		throw new Error("SESSION_SECRET must be at least 32 characters.");
	}
	return {
		password,
		name: "br_admin",
		maxAge: 60 * 60 * 8, // 8 hours
	};
}

async function isAdmin(): Promise<boolean> {
	const session = await openSession<AdminSession>(sessionConfig());
	return session.data.admin === true;
}

async function requireAdmin(): Promise<void> {
	if (!(await isAdmin())) throw new Error("Unauthorized");
}

// --- Convex client ----------------------------------------------------------
// The Convex URL is a build-time public value (same one the client uses), so we
// read it from import.meta.env — Vite inlines it, so no runtime env var needed.
function convex(): ConvexHttpClient {
	const url = import.meta.env.VITE_CONVEX_URL;
	if (!url) throw new Error("VITE_CONVEX_URL is not set at build time.");
	return new ConvexHttpClient(url);
}

// --- server functions -------------------------------------------------------
export const getAdminStatus = createServerFn({ method: "GET" }).handler(
	async () => ({ authed: await isAdmin() }),
);

export const login = createServerFn({ method: "POST" })
	.validator(
		z.object({ username: z.string().min(1), password: z.string().min(1) }),
	)
	.handler(async ({ data }) => {
		const [userHash, passHash] = await Promise.all([
			sha256Hex(data.username),
			sha256Hex(data.password),
		]);
		const ok =
			timingSafeEqual(userHash, requireEnv("ADMIN_USER_HASH").toLowerCase()) &&
			timingSafeEqual(passHash, requireEnv("ADMIN_PASS_HASH").toLowerCase());

		if (!ok) return { ok: false as const };

		const session = await openSession<AdminSession>(sessionConfig());
		await session.update({ admin: true });
		return { ok: true as const };
	});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	const session = await openSession<AdminSession>(sessionConfig());
	await session.clear();
	return { ok: true };
});

export const listContributions = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireAdmin();
		return await convex().query(api.admin.listContributions, {
			secret: requireEnv("ADMIN_SECRET"),
		});
	},
);

export const deleteContribution = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireAdmin();
		await convex().mutation(api.admin.deleteContribution, {
			secret: requireEnv("ADMIN_SECRET"),
			id: data.id as Id<"contributions">,
		});
		return { ok: true };
	});
