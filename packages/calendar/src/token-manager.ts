import { database } from '@packages/db';
import { decrypt, encrypt } from './encryption';
import { InvalidGrantError, refreshAccessToken } from './google-auth';

/** Refresh 5 minutes before expiry to avoid edge-case failures. */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Get a valid (decrypted) access token for a GoogleAccount.
 * Automatically refreshes if expired, re-encrypts new token, and updates DB.
 * On invalid_grant, marks account as "revoked".
 */
export async function getValidAccessToken(
  googleAccountId: string
): Promise<string> {
  const account = await database.googleAccount.findUniqueOrThrow({
    where: { id: googleAccountId },
  });

  if (account.status === 'revoked') {
    throw new InvalidGrantError(
      `Google account ${account.googleEmail} is revoked. Re-connect required.`
    );
  }

  const now = Date.now();
  const expiresAt = account.accessTokenExpiresAt.getTime();

  // Token is still valid
  if (expiresAt - EXPIRY_BUFFER_MS > now) {
    return decrypt(account.encryptedAccessToken);
  }

  // Token expired — refresh it
  try {
    const refreshToken = decrypt(account.encryptedRefreshToken);
    const { access_token, expires_in } =
      await refreshAccessToken(refreshToken);

    const newExpiresAt = new Date(Date.now() + expires_in * 1000);

    await database.googleAccount.update({
      where: { id: googleAccountId },
      data: {
        encryptedAccessToken: encrypt(access_token),
        accessTokenExpiresAt: newExpiresAt,
        status: 'active',
      },
    });

    return access_token;
  } catch (error) {
    if (error instanceof InvalidGrantError) {
      await database.googleAccount.update({
        where: { id: googleAccountId },
        data: { status: 'revoked' },
      });
      throw error;
    }
    await database.googleAccount.update({
      where: { id: googleAccountId },
      data: { status: 'error' },
    });
    throw error;
  }
}
