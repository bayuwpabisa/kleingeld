import { socialProviderIds, socialProvidersConfig } from "./auth-providers";

const google = { GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-secret" };
const github = { GITHUB_CLIENT_ID: "gh-id", GITHUB_CLIENT_SECRET: "gh-secret" };

describe("socialProvidersConfig", () => {
  it("offers no provider without keys", () => {
    expect(socialProvidersConfig({})).toStrictEqual({});
  });

  it("offers each provider whose id and secret are both set", () => {
    expect(socialProvidersConfig({ ...google, ...github })).toStrictEqual({
      google: { clientId: "g-id", clientSecret: "g-secret" },
      github: { clientId: "gh-id", clientSecret: "gh-secret" },
    });
  });

  it("skips a provider with only one of its keys or an empty one", () => {
    expect(
      socialProvidersConfig({
        GOOGLE_CLIENT_ID: "g-id",
        GITHUB_CLIENT_ID: "gh-id",
        GITHUB_CLIENT_SECRET: "",
      }),
    ).toStrictEqual({});
    expect(
      socialProvidersConfig({ GOOGLE_CLIENT_SECRET: "g-secret" }),
    ).toStrictEqual({});
  });
});

describe("socialProviderIds", () => {
  it("is empty without keys", () => {
    expect(socialProviderIds({})).toStrictEqual([]);
  });

  it("lists only the configured provider", () => {
    expect(socialProviderIds(google)).toStrictEqual(["google"]);
    expect(socialProviderIds(github)).toStrictEqual(["github"]);
  });

  it("keeps Google before GitHub", () => {
    expect(socialProviderIds({ ...github, ...google })).toStrictEqual([
      "google",
      "github",
    ]);
  });

  it("leaves out a provider that lacks its secret", () => {
    expect(
      socialProviderIds({ ...github, GOOGLE_CLIENT_ID: "g-id" }),
    ).toStrictEqual(["github"]);
  });
});
