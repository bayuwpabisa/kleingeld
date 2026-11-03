/** @type {import("@commitlint/types").UserConfig} */
const commitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Warning only: a new scope should be added here, not block the commit.
    "scope-enum": [
      1,
      "always",
      [
        "transactions",
        "budgets",
        "bills",
        "dashboard",
        "auth",
        "ui",
        "db",
        "deps",
      ],
    ],
  },
};

export default commitlintConfig;
