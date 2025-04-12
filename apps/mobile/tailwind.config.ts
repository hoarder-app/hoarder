import type { Config } from "tailwindcss";

import base from "@karakeep/tailwind-config/native";

const config = {
  content: base.content,
  plugins: [],
  presets: [base, require("nativewind/preset")],
} satisfies Config;

export default config;
