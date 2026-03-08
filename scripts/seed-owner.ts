import 'dotenv/config';

/**
 * Seeds the owner account via Better Auth API.
 * Run once after setting up auth: pnpm seed:owner
 *
 * Set these env vars before running:
 *   OWNER_EMAIL=your@email.com
 *   OWNER_PASSWORD=your-secure-password
 *   OWNER_NAME="Your Name"
 *   APP_URL=http://localhost:4001  (or production URL)
 */
async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME || 'Admin';
  const appUrl = process.env.APP_URL || 'http://localhost:4001';

  if (!email || !password) {
    console.error(
      'Set OWNER_EMAIL and OWNER_PASSWORD environment variables first.'
    );
    process.exit(1);
  }

  console.log(`Creating owner account: ${email} at ${appUrl}`);

  const response = await fetch(`${appUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': appUrl },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Sign-up failed (${response.status}): ${text}`);
    process.exit(1);
  }

  const data = await response.json();
  console.log('Owner account created:', data.user?.email || data);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
