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
  const name = profile?.name || 'Yogesh Kumar';
  const socials = profile?.socials || [];

  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <p className="text-sm text-muted-foreground">{name}</p>
        <div className="flex items-center gap-4">
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
