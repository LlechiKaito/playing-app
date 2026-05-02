import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env.js";

const SECRET = new TextEncoder().encode(env.jwtSecret);

export type AuthClaims = { sub: string; email: string };

export async function signJwt(claims: AuthClaims): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.jwtExpiresIn)
    .sign(SECRET);
}

export async function verifyJwt(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
