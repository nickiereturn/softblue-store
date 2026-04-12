import { NextApiRequest } from "next";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123"
  };
}

export function getAdminSessionValue() {
  const { username, password } = getAdminCredentials();
  return Buffer.from(`${username}:${password}`).toString("base64");
}

export function isValidAdminLogin(username: string, password: string) {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

export function isAdminRequest(request: NextRequest) {
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return session === getAdminSessionValue();
}

export function isAdminApiRequest(request: NextApiRequest) {
  return request.cookies[ADMIN_COOKIE_NAME] === getAdminSessionValue();
}
