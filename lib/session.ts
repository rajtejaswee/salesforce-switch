import { cookies } from "next/headers";
  import crypto from "crypto";

  const COOKIE_NAME = "sf_session";
  const ALGO = "aes-256-gcm";
  
  export type Session = {
    accessToken: string;
    instanceUrl: string;
    username: string;
    orgName: string;
  };
  
  function getKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET not set");
    return Buffer.from(secret, "hex");
  }
  
  function encrypt(data: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
    const ct = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString("base64");
  }
  
  function decrypt(payload: string) {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  }

  export async function setSession(session: Session) {
    const value = encrypt(JSON.stringify(session));
    const jar = await cookies();
    jar.set(COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } 

  export async function getSession(): Promise<Session | null> {
    const jar = await cookies();
    const c = jar.get(COOKIE_NAME);
    if (!c) return null;
    try {
      return JSON.parse(decrypt(c.value)) as Session;
    } catch {
      return null;
    }
  }

  export async function clearSession() { 
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
  }