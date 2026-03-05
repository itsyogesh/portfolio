import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@packages/base/components/ui/sidebar';
import { Separator } from '@packages/base/components/ui/separator';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { AppSidebar } from '../components/app-sidebar';
import { getSession } from '../api/_lib/auth';

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  const session = await getSession();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar userEmail={session?.user?.email} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/40 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <span className="text-xs text-muted-foreground">itsyogesh.fyi</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
