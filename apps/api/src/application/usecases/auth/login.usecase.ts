import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import type { User } from "@/domain/entities/user/user.entity.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";
import { verifyPassword } from "@/infrastructure/auth/password.js";
import { signJwt } from "@/infrastructure/auth/jwt.js";

export type LoginInput = { email: string; password: string };
export type LoginOutput = { token: string; user: User };

export function makeLoginUseCase(deps: { userRepo: UserRepository }) {
  return async (input: LoginInput): Promise<Result<LoginOutput>> => {
    const user = await deps.userRepo.findByEmail(input.email);
    if (!user) return err(ERROR_CODES.INVALID_CREDENTIALS, "メールまたはパスワードが違います");
    const okPwd = await verifyPassword(input.password, user.passwordHash);
    if (!okPwd) return err(ERROR_CODES.INVALID_CREDENTIALS, "メールまたはパスワードが違います");
    const token = await signJwt({ sub: user.id, email: user.email });
    return ok({ token, user });
  };
}
