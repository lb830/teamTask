import "server-only";
export function appUrl() {
  const value = process.env.APP_URL;
  if (!value)
    throw new Error("APP_URL is required to send authentication links.");
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("APP_URL must use HTTPS in production.");
  return url.origin;
}
