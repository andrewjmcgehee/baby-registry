import { readFileSync } from "node:fs";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-only Slack notifier. Posts to a Slack Incoming Webhook when someone
 * reaches the "finish up" pay step. The webhook URL is a secret, so it's read
 * from `SLACK_WEBHOOK_URL` (process env in prod; .env.local fallback in dev)
 * and never reaches the browser. If unset, this no-ops so the pay flow still
 * works before Slack is configured.
 */

let dotenvCache: Record<string, string> | null = null;
function envValue(key: string): string | undefined {
	if (process.env[key]) return process.env[key];
	if (!dotenvCache) {
		dotenvCache = {};
		for (const file of [".env.local", ".env"]) {
			try {
				for (const raw of readFileSync(file, "utf8").split("\n")) {
					const line = raw.trim();
					if (!line || line.startsWith("#")) continue;
					const eq = line.indexOf("=");
					if (eq === -1) continue;
					const k = line.slice(0, eq).trim();
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
					if (!(k in dotenvCache)) dotenvCache[k] = val;
				}
			} catch {
				// file may not exist — ignore
			}
		}
	}
	return dotenvCache[key];
}

export const notifyPayment = createServerFn({ method: "POST" })
	.validator(
		z.object({
			itemName: z.string(),
			amount: z.number(),
			name: z.string().optional(),
			note: z.string().optional(),
			method: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const webhook = envValue("SLACK_WEBHOOK_URL");
		if (!webhook) return { ok: false as const, reason: "no-webhook" };

		const who = data.name?.trim() || "Someone";
		const amount = `$${Math.round(data.amount).toLocaleString("en-US")}`;
		const lines = [
			`🎁 *${who}* is sending ${amount} toward *${data.itemName}* via ${data.method}.`,
		];
		if (data.note?.trim()) lines.push(`💬 "${data.note.trim()}"`);

		try {
			const res = await fetch(webhook, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: lines.join("\n") }),
			});
			return { ok: res.ok };
		} catch {
			return { ok: false as const, reason: "fetch-failed" };
		}
	});
