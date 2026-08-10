export const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE || "artiory_auth";

export function getAuthCookieName() {
  return process.env.NEXT_PUBLIC_AUTH_COOKIE || "artiory_auth";
}

export function setAuth(token: string) {
  document.cookie = `${getAuthCookieName()}=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function getAuthToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieName = getAuthCookieName();
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const match = cookies.find((c) => c.startsWith(`${cookieName}=`));

  if (match) {
    return match.split("=").slice(1).join("=");
  }

  return process.env.NEXT_PUBLIC_API_TOKEN || null;
}

export function clearAuth() {
  const cookieName = getAuthCookieName();
  document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function validateCredentials(email: string, password: string) {
  return (
    email === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
    password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  );
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";