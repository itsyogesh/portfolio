import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountId } = await params;
  const account = await database.googleAccount.findUnique({
    where: { id: accountId },
    include: { calendars: { orderBy: { summary: 'asc' } } },
  });

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountId } = await params;
  const body = await request.json();

  const account = await database.googleAccount.update({
    where: { id: accountId },
    data: {
      ...(body.displayName !== undefined && { displayName: body.displayName }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });

  return NextResponse.json(account);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountId } = await params;
  await database.googleAccount.delete({ where: { id: accountId } });
  return NextResponse.json({ success: true });
}
