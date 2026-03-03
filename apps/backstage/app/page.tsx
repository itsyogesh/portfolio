import { requireAdminPage } from './api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bookmark,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Layers,
  Clock,
  Star,
  Trophy,
  User,
  PenTool,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Backstage dashboard overview',
};

export default async function DashboardPage() {
  await requireAdminPage();

  const [
    profile,
    projectCount,
    orgCount,
    workCount,
    educationCount,
    accoladeCount,
    stackItemCount,
    timelineCount,
    starCount,
    starListCount,
    bookmarkCount,
    externalWritingCount,
  ] = await Promise.all([
    database.profile.findFirst(),
    database.project.count(),
    database.organization.count(),
    database.workExperience.count(),
    database.education.count(),
    database.accolade.count(),
    database.stackItem.count(),
    database.timelineEntry.count(),
    database.starRepo.count({ where: { isStarred: true } }),
    database.starList.count(),
    database.bookmark.count(),
    database.externalWriting.count(),
  ]);

  const stats = [
    {
      label: 'Profile',
      value: profile ? 'Complete' : 'Not set',
      href: '/profile',
      icon: User,
    },
    {
      label: 'Projects',
      value: projectCount,
      href: '/projects',
      icon: FolderKanban,
    },
    {
      label: 'Organizations',
      value: orgCount,
      href: '/experience',
      icon: Briefcase,
    },
    {
      label: 'Work Experiences',
      value: workCount,
      href: '/experience',
      icon: Briefcase,
    },
    {
      label: 'Education',
      value: educationCount,
      href: '/education',
      icon: GraduationCap,
    },
    {
      label: 'Accolades',
      value: accoladeCount,
      href: '/accolades',
      icon: Trophy,
    },
    {
      label: 'Stack Items',
      value: stackItemCount,
      href: '/stack',
      icon: Layers,
    },
    {
      label: 'Timeline Entries',
      value: timelineCount,
      href: '/timeline',
      icon: Clock,
    },
    {
      label: 'Stars',
      value: `${starCount} repos, ${starListCount} lists`,
      href: '/stars',
      icon: Star,
    },
    {
      label: 'Bookmarks',
      value: bookmarkCount,
      href: '/bookmarks',
      icon: Bookmark,
    },
    {
      label: 'External Writing',
      value: externalWritingCount,
      href: '/writing',
      icon: PenTool,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight mb-2">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your portfolio content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex items-start gap-4 rounded-lg border border-border/50 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="rounded-md border border-border/50 p-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-semibold tracking-tight">
                {stat.value}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
