import { signInIntro } from "./sign-in-intro";

describe("signInIntro", () => {
  it("names both providers when both have keys", () => {
    expect(signInIntro(["google", "github"])).toBe(
      "Pakai akun Google atau GitHub. Tidak perlu membuat password.",
    );
  });

  it("names only the configured provider", () => {
    expect(signInIntro(["github"])).toBe(
      "Pakai akun GitHub. Tidak perlu membuat password.",
    );
    expect(signInIntro(["google"])).toBe(
      "Pakai akun Google. Tidak perlu membuat password.",
    );
  });

  it("points to the demo account when no provider has keys", () => {
    expect(signInIntro([])).toBe(
      "Coba Kleingeld dengan akun demo. Tidak perlu membuat akun.",
    );
  });
});
