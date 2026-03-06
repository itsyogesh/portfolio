'use client';

import { Button } from '@packages/base/components/ui/button';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type ProfileData = {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  website: string | null;
  resumeUrl: string | null;
  email: string | null;
  phone: string | null;
} | null;

type ProfileFormProps = {
  profile: ProfileData;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [headline, setHeadline] = useState(profile?.headline ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [resumeUrl, setResumeUrl] = useState(profile?.resumeUrl ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          headline,
          bio,
          avatarUrl,
          location,
          website,
          resumeUrl,
          email,
          phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save profile');
        return;
      }

      toast.success('Profile saved');
      router.refresh();
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border/50 p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Name *</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-headline">Headline</Label>
          <Input
            id="profile-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Software Engineer, Designer, etc."
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio about yourself..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-avatarUrl">Avatar URL</Label>
          <Input
            id="profile-avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-location">Location</Label>
          <Input
            id="profile-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-website">Website</Label>
          <Input
            id="profile-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-resumeUrl">Resume URL</Label>
          <Input
            id="profile-resumeUrl"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://..."
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Phone</Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </form>
  );
}
