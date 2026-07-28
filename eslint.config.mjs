import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * GH-Store ESLint — Next.js core-web-vitals + TypeScript + project rules.
 *
 * TypeScript is pinned to 5.9.x because typescript-eslint does not support
 * TypeScript 7 yet (throws on import). Keep this pin until #10940 lands.
 */
const eslintConfig = defineConfig([
  {
    ignores: [
      "**/.next/**",
      "**/.open-next/**",
      "**/.wrangler/**",
      "**/out/**",
      "**/build/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "**/supabase/.temp/**",
      "**/pnpm-lock.yaml",
      "**/.git/**",
    ],
  },

  ...nextVitals,
  ...nextTs,

  {
    name: "gh-store/project-rules",
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      // ── Correctness ──────────────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "smart"],
      "no-duplicate-imports": "off",

      // ── TypeScript ───────────────────────────────────────────────
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",

      // ── React / Next ─────────────────────────────────────────────
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
      "@next/next/no-assign-module-variable": "off",

      // ── Imports ──────────────────────────────────────────────────
      "import/first": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": "warn",
      "import/no-mutable-exports": "error",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          pathGroups: [
            { pattern: "react", group: "external", position: "before" },
            { pattern: "next/**", group: "external", position: "before" },
            { pattern: "@/**", group: "internal", position: "before" },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // shadcn/ui primitives often re-export variants — relax export rule there
  {
    name: "gh-store/ui-primitives",
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Generated / vendor-adjacent database types
  {
    name: "gh-store/generated-types",
    files: ["src/types/database.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Config and scripts (Node)
  {
    name: "gh-store/node-scripts",
    files: ["*.config.{js,mjs,ts,cjs}", "scripts/**/*.{js,mjs,ts,cjs}", "eslint.config.mjs"],
    rules: {
      "no-console": "off",
      "import/no-default-export": "off",
    },
  },
]);

export default eslintConfig;
