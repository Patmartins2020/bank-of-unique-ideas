export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  return "http://localhost:3000";
}