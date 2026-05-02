import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import { createNewUser, type User } from "@/domain/entities/user/user.entity.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";
import { hashPassword } from "@/infrastructure/auth/password.js";
import { signJwt } from "@/infrastructure/auth/jwt.js";
import { nanoid } from "nanoid";

export type SignupInput = { email: string; password: string; nickname: string };
export type AuthOutput = { token: string; user: User };

export function makeSignupUseCase(deps: { userRepo: UserRepository }) {
  return async (input: SignupInput): Promise<Result<AuthOutput>> => {
    const existing = await deps.userRepo.findByEmail(input.email);
    if (existing) return err(ERROR_CODES.EMAIL_ALREADY_USED, "このメールは既に使われています");

    if (input.password.length < 8) {
      return err(ERROR_CODES.VALIDATION_FAILED, "パスワードは 8 文字以上です");
    }
    if (input.nickname.trim().length === 0) {
      return err(ERROR_CODES.VALIDATION_FAILED, "ニックネームは必須です");
    }

    const passwordHash = await hashPassword(input.password);
    const user = createNewUser({
      id: nanoid(),
      email: input.email.toLowerCase(),
      passwordHash,
      nickname: input.nickname,
      now: new Date().toISOString(),
    });
    await deps.userRepo.save(user);
    const token = await signJwt({ sub: user.id, email: user.email });
    return ok({ token, user });
  };
}
