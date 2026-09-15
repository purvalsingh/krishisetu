import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { prisma } from "./db";

const COOKIE = "krishisetu_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export type Session = { userId: string; role: Role; name: string };

export async function createSession(session: Session) {
  const token = await new SignJWT(session as unknown as Record<string, string>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.userId), role: payload.role as Role, name: String(payload.name) };
  } catch {
    return null;
  }
}

/** Route guard. Redirects to the sign-in page rather than throwing at the user. */
export async function requireRole<T extends Role>(...roles: T[]): Promise<Session & { role: T }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role as T)) redirect(homeFor(session.role));
  return session as Session & { role: T };
}

export const homeFor = (role: Role) =>
  ({ FARMER: "/farmer", TRANSPORTER: "/transporter", CUSTOMER: "/market", ADMIN: "/admin" })[role];

export async function signIn(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { ok: false as const, error: "No account found for that mobile number" };
  if (!(await bcrypt.compare(password, user.passwordHash)))
    return { ok: false as const, error: "Incorrect password" };
  await createSession({ userId: user.id, role: user.role, name: user.name });
  return { ok: true as const, role: user.role };
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
