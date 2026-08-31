import { Github, Linkedin, Twitter, Globe, Youtube, Mail } from 'lucide-react';
import Link from 'next/link';
import { getProfile } from '../lib/profile';

const platformIcons: Record<string, typeof Github> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
  youtube: Youtube,
  email: Mail,
};

export const Footer = async () => {
  const profile = await getProfile();
  const name = profile?.name || 'Portfolio';
  const socials = profile?.socials || [];

  const library = [
    { name: 'Stack', href: '/stack' },
    { name: 'Stars', href: '/stars' },
    { name: 'Bookmarks', href: '/bookmarks' },
  ];

  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-8">
        <div className="flex items-center justify-between sm:contents">
          <p className="text-sm text-muted-foreground">{name}</p>
          <nav aria-label="Library" className="flex items-center gap-4 sm:order-none">
            {library.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5 sm:gap-4">
          {socials.map((social) => {
            const Icon = platformIcons[social.platform] || Globe;
            return (
              <Link
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={social.label || social.platform}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
