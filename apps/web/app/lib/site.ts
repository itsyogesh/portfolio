const LOCAL_SITE_URL = 'http://localhost:4000';

export function getSiteUrl(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : LOCAL_SITE_URL);

  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
}
