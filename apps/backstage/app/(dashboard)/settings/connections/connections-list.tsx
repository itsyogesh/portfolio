'use client';

import { useState } from 'react';
import { Button } from '@packages/base/components/ui/button';
import { Badge } from '@packages/base/components/ui/badge';
import { signIn } from '@packages/auth/client';
import { toast } from 'sonner';
import { Github, Link2, Unlink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectedAccount {
  id: string;
  providerId: string;
  accountId: string;
  scope: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: <Github className="size-5" />,
    description: 'Connect your GitHub account to enable repository access and OAuth login.',
  },
];

interface ConnectionsListProps {
  accounts: ConnectedAccount[];
}

export function ConnectionsList({ accounts }: ConnectionsListProps) {
  const router = useRouter();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  function getConnectedAccount(providerId: string) {
    return accounts.find((a) => a.providerId === providerId);
  }

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    try {
      if (providerId === 'github') {
        await signIn.social({
          provider: 'github',
          callbackURL: '/settings/connections',
        });
      }
    } catch {
      toast.error(`Failed to connect ${providerId}`);
      setConnectingId(null);
    }
  }

  async function handleDisconnect(accountId: string, providerName: string) {
    if (
      !confirm(
        `Are you sure you want to disconnect your ${providerName} account?`
      )
    ) {
      return;
    }

    setDisconnectingId(accountId);
    try {
      const response = await fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success(`${providerName} account disconnected`);
      router.refresh();
    } catch {
      toast.error(`Failed to disconnect ${providerName}`);
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {accounts.length} connected {accounts.length === 1 ? 'account' : 'accounts'}
      </p>

      <div className="divide-y divide-border rounded-lg border">
        {PROVIDERS.map((provider) => {
          const connected = getConnectedAccount(provider.id);

          return (
            <div
              key={provider.id}
              className="flex items-center gap-4 px-4 py-4"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                {provider.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm">{provider.name}</span>
                  {connected ? (
                    <Badge variant="success">
                      <Link2 className="size-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not connected</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {provider.description}
                </p>
                {connected && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Account ID: {connected.accountId}
                    {connected.scope && (
                      <span className="ml-2">
                        Scopes: {connected.scope}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDisconnect(connected.id, provider.name)
                    }
                    disabled={disconnectingId === connected.id}
                  >
                    <Unlink className="size-4 mr-1" />
                    {disconnectingId === connected.id
                      ? 'Disconnecting...'
                      : 'Disconnect'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(provider.id)}
                    disabled={connectingId === provider.id}
                  >
                    {provider.icon}
                    <span className="ml-1">
                      {connectingId === provider.id
                        ? 'Connecting...'
                        : 'Connect'}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="text-sm font-medium mb-2">All Connected Accounts</h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>
                  <span className="font-medium text-foreground">
                    {account.providerId}
                  </span>{' '}
                  ({account.accountId})
                </span>
                <span>
                  Connected{' '}
                  {new Date(account.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
