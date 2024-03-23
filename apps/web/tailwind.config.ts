import type { Config } from "tailwindcss";

import web from "@hoarder/tailwind-config/web";

const config = {
  content: web.content,
  presets: [web],
} satisfies Config;

export default config;
