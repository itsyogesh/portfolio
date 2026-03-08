'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@packages/base/components/ui/breadcrumb';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/calendar': 'Calendar',
  '/calendar/event-types': 'Event Types',
  '/calendar/bookings': 'Bookings',
  '/writing': 'Writing',
  '/bookmarks': 'Bookmarks',
  '/stars': 'Stars',
  '/profile': 'Profile',
  '/experience': 'Experience',
  '/education': 'Education',
  '/accolades': 'Accolades',
  '/stack': 'Stack',
  '/languages': 'Languages',
  '/timeline': 'Timeline',
  '/settings/connections': 'Connections',
};

export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const title = pageTitles[pathname];

  if (!title || pathname === '/') {
    return (
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbPage>itsyogesh.fyi</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Build breadcrumb segments for nested routes
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = pageTitles[href] || segments[i];
    crumbs.push({ label, href });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">itsyogesh.fyi</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.href}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </span>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
