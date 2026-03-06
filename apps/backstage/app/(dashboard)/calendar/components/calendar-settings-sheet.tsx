'use client';

import { useState } from 'react';
import { AlertCircle, Check, Link2, RefreshCw, Trash2, X } from 'lucide-react';
import type { AccountSerialized } from './calendar-view';

export function CalendarSettingsSheet({
  open,
  onClose,
  accounts: initialAccounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: AccountSerialized[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  if (!open) return null;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/calendar/accounts', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this Google account? All cached events will be removed.')) return;
    setDisconnecting(accountId);
    try {
      const res = await fetch(`/api/calendar/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== accountId));
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSyncCalendars = async (accountId: string) => {
    setSyncing(accountId);
    try {
      const res = await fetch(
        `/api/calendar/accounts/${accountId}/calendars`
      );
      if (res.ok) {
        const calendars = await res.json();
        setAccounts(
          accounts.map((a) =>
            a.id === accountId ? { ...a, calendars } : a
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleVisibility = async (
    accountId: string,
    calendarId: string,
    isVisible: boolean
  ) => {
    try {
      await fetch(
        `/api/calendar/accounts/${accountId}/calendars/${calendarId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVisible }),
        }
      );
      setAccounts(
        accounts.map((a) =>
          a.id === accountId
            ? {
                ...a,
                calendars: a.calendars.map((c) =>
                  c.id === calendarId ? { ...c, isVisible } : c
                ),
              }
            : a
        )
      );
    } catch {
      // ignore
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Check className="h-3 w-3" /> Active
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-3 w-3" /> Revoked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3" /> Error
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="button"
        tabIndex={0}
      />

      {/* Sheet */}
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 className="font-semibold">Calendar Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Connect button */}
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" />
            {connecting ? 'Connecting...' : 'Connect Google Account'}
          </button>

          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No Google accounts connected. Connect one to sync your calendars.
            </p>
          )}

          {/* Account list */}
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-lg border border-border overflow-hidden"
            >
              {/* Account header */}
              <div className="flex items-center gap-3 p-3 bg-muted/30">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: account.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {account.displayName || account.googleEmail}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {account.googleEmail}
                  </div>
                </div>
                {statusBadge(account.status)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                {account.status === 'revoked' && (
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="text-xs text-primary hover:underline"
                  >
                    Re-connect
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSyncCalendars(account.id)}
                  disabled={syncing === account.id}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${syncing === account.id ? 'animate-spin' : ''}`}
                  />
                  Sync calendars
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => handleDisconnect(account.id)}
                  disabled={disconnecting === account.id}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Disconnect
                </button>
              </div>

              {/* Calendar toggles */}
              {account.calendars.length > 0 ? (
                <div className="divide-y divide-border">
                  {account.calendars.map((cal) => (
                    <div
                      key={cal.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={cal.isVisible}
                        onChange={(e) =>
                          handleToggleVisibility(
                            account.id,
                            cal.id,
                            e.target.checked
                          )
                        }
                        className="rounded border-border"
                      />
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: cal.color || account.color,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">
                          {cal.summary}
                          {cal.isPrimary && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              (primary)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">
                          {cal.accessRole}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No calendars synced. Click &quot;Sync calendars&quot; above.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
