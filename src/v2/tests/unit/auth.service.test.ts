import { describe, expect, it } from "bun:test";
import { ValidationError, UnauthorizedError } from "../../shared/errors";
import { AuthService } from "../../modules/auth/auth.service";

describe("AuthService", () => {
  it("throws UnauthorizedError for unknown email on login", async () => {
    const repository = {
      findUserByEmail: async () => null,
      createUser: async () => {
        throw new Error("not used");
      },
    };

    const service = new AuthService(repository as never);

    await expect(
      service.login({ email: "missing@example.com", password: "secret" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws ValidationError when signup email already exists", async () => {
    const repository = {
      findUserByEmail: async () => ({ id: "1", email: "existing@example.com" }),
      createUser: async () => {
        throw new Error("not used");
      },
    };

    const service = new AuthService(repository as never);

    await expect(
      service.signUp({
        userName: "existing",
        email: "existing@example.com",
        passwords: "secret",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
