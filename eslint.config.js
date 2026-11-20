export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "output/**",
      ".local/**",
      "src/release.js",
      "release-manifest.js",
    ],
  },
  {
    files: [
      "src/**/*.js",
      "desktop/**/*.js",
      "desktop/*.cjs",
      "scripts/**/*.js",
      "test/**/*.js",
      "browser-checks/**/*.js",
    ],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-unused-vars": [
        "error",
        {
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
