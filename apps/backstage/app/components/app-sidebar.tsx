'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@packages/base/components/ui/sidebar';
import {
  BookOpen,
  Bookmark,
  Briefcase,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Layers,
  Clock,
  Globe,
  Star,
  Trophy,
  User,
  PenTool,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Projects', href: '/projects', icon: FolderKanban },
      { title: 'Calendar', href: '/calendar', icon: CalendarDays },
      { title: 'Writing', href: '/writing', icon: PenTool },
      { title: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
      { title: 'Stars', href: '/stars', icon: Star },
    ],
  },
  {
    label: 'Profile',
    items: [
      { title: 'Profile', href: '/profile', icon: User },
      { title: 'Experience', href: '/experience', icon: Briefcase },
      { title: 'Education', href: '/education', icon: GraduationCap },
      { title: 'Accolades', href: '/accolades', icon: Trophy },
      { title: 'Stack', href: '/stack', icon: Layers },
      { title: 'Languages', href: '/languages', icon: Globe },
      { title: 'Timeline', href: '/timeline', icon: Clock },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'Connections', href: '/settings/connections', icon: Link2 },
    ],
  },
];

export function AppSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold text-sm tracking-tight">
            Backstage
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href ||
                            pathname.startsWith(`${item.href}/`)
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {userEmail && (
            <SidebarMenuItem>
              <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                {userEmail}
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/api/auth/sign-out">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
