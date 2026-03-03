'use client';

import { cn } from '@packages/base/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Writing', href: '/writing' },
  { name: 'Bookmarks', href: '/bookmarks' },
  { name: 'Stack', href: '/stack' },
];

export const Header = ({ profileName }: { profileName: string }) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
        >
          {profileName.toLowerCase()}
        </Link>

        <nav className="flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors rounded-md',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ml-2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 block dark:hidden" />
          </button>
        </nav>
      </div>
    </header>
  );
};
