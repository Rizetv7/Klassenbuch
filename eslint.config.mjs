import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // We use SVG-from-API + user uploads with plain <img>; next/image isn't
      // a fit for the scrapbook layout and would need remote config.
      "@next/next/no-img-element": "off",
      // German copy uses « » and apostrophes in JSX text freely.
      "react/no-unescaped-entities": "off",
      // We intentionally fetch data in effects (notifications polling, etc.).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
