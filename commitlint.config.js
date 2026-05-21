/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "chore", "docs", "test", "perf", "ci", "build", "style", "revert"],
    ],
    "subject-case": [2, "never", ["pascal-case", "upper-case", "start-case"]],
    "header-max-length": [2, "always", 100],
  },
};

export default config;
