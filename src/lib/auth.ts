import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Roles } from "./constants";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
    userId: string;
    email: string;
    rol: Roles;
    nombre: string;
    exp?: number;
}

export async function signToken(payload: Omit<SessionPayload, "exp">) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export async function setSession(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

export async function getSessionFromRequest(req: NextRequest) {
    const token = req.cookies.get("session")?.value;
    if (!token) return null;
    return await verifyToken(token);
}
