import { requireAdminPage } from '../../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { ConnectionsList } from './connections-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Manage connected accounts',
};

export default async function ConnectionsPage() {
  const session = await requireAdminPage();

  const accounts = await database.account.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      providerId: true,
      accountId: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serializedAccounts = accounts.map((account) => ({
    id: account.id,
    providerId: account.providerId,
    accountId: account.accountId,
    scope: account.scope,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight mb-2">
          Connections
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your connected accounts and social logins
        </p>
      </div>

      <ConnectionsList accounts={serializedAccounts} />
    </div>
  );
}
