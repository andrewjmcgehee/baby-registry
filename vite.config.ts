import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	// nitro() gives us a deployable server build; Vercel auto-detects Start + Nitro.
	plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
});

export default config;
