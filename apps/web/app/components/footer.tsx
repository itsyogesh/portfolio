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

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Writing', href: '/writing' },
];

const library = [
  { name: 'Stack', href: '/stack' },
  { name: 'Stars', href: '/stars' },
  { name: 'Bookmarks', href: '/bookmarks' },
];

export const Footer = async () => {
  const profile = await getProfile();
  const name = profile?.name || 'Portfolio';
  const socials = profile?.socials || [];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto max-w-3xl px-6 pt-12 pb-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Identity */}
          <div className="max-w-xs space-y-3">
            <Link
              href="/"
              className="font-display text-xl tracking-tight text-foreground hover:opacity-70 transition-opacity"
            >
              {name}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I make digital things — from Delhi, since 2013.
            </p>
            <div className="flex items-center gap-4 pt-1">
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

          {/* Link columns */}
          <div className="flex gap-16 sm:gap-20">
            {[
              { heading: 'Pages', items: navigation },
              { heading: 'Library', items: library },
            ].map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  {group.heading}
                </h2>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-6">
          <p className="text-xs text-muted-foreground/70">
            © {year} {name}
          </p>
          <p className="text-xs text-muted-foreground/70">New Delhi, India</p>
        </div>
      </div>

      {/* Ghost wordmark, cropped at the page edge */}
      <div className="overflow-hidden" aria-hidden="true">
        <p className="-mb-[0.26em] select-none whitespace-nowrap text-center font-display leading-none tracking-tight text-[clamp(64px,15vw,210px)] text-[color-mix(in_srgb,currentColor_7%,transparent)]">
          {name}
        </p>
      </div>
    </footer>
  );
};
