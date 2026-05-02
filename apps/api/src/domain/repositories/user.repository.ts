import type { User } from "@/domain/entities/user/user.entity.js";

export type UserRepository = {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  listTop(by: "RATE" | "WINS" | "BEST_SCORE", limit: number): Promise<User[]>;
};
