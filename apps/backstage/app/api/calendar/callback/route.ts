import { database } from '@packages/db';
import { encrypt, exchangeCodeForTokens, getUserInfo } from '@packages/calendar';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/calendar?error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/calendar?error=missing_params', request.url)
    );
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.delete('google_oauth_state');

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL('/calendar?error=invalid_state', request.url)
    );
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const userInfo = await getUserInfo(tokens.access_token);

    const encryptedAccessToken = encrypt(tokens.access_token);
    const accessTokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    );

    // Only encrypt refresh token if Google returned one (re-auth may not)
    const updateData: Record<string, unknown> = {
      googleEmail: userInfo.email,
      displayName: userInfo.name,
      encryptedAccessToken,
      accessTokenExpiresAt,
      scope: tokens.scope,
      status: 'active',
    };
    if (tokens.refresh_token) {
      updateData.encryptedRefreshToken = encrypt(tokens.refresh_token);
    }

    // Check if this is a new account (needs refresh token) or re-auth
    const existingAccount = await database.googleAccount.findUnique({
      where: { googleAccountId: userInfo.id },
    });

    if (!existingAccount && !tokens.refresh_token) {
      // New account without refresh token — can't maintain long-lived access
      return NextResponse.redirect(
        new URL('/calendar?error=no_refresh_token', request.url)
      );
    }

    await database.googleAccount.upsert({
      where: { googleAccountId: userInfo.id },
      update: updateData,
      create: {
        googleEmail: userInfo.email,
        googleAccountId: userInfo.id,
        displayName: userInfo.name,
        encryptedAccessToken,
        encryptedRefreshToken: encrypt(tokens.refresh_token!),
        accessTokenExpiresAt,
        scope: tokens.scope,
      },
    });

    return NextResponse.redirect(
      new URL('/calendar?success=connected', request.url)
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/calendar?error=auth_failed', request.url)
    );
  }
}
