'use client';

import { Button } from '@packages/base/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@packages/base/components/ui/dialog';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

const orgTypes = ['company', 'nonprofit', 'community', 'freelance'] as const;

type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  location: string | null;
  type: string;
  industry: string | null;
};

export function OrgForm({
  org,
  trigger,
}: {
  org?: Organization;
  trigger: ReactNode;
}) {
  const isEditing = !!org;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(org?.name ?? '');
  const [slug, setSlug] = useState(org?.slug ?? '');
  const [description, setDescription] = useState(org?.description ?? '');
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl ?? '');
  const [website, setWebsite] = useState(org?.website ?? '');
  const [location, setLocation] = useState(org?.location ?? '');
  const [type, setType] = useState(org?.type ?? 'company');
  const [industry, setIndustry] = useState(org?.industry ?? '');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const resetForm = () => {
    if (!isEditing) {
      setName('');
      setSlug('');
      setDescription('');
      setLogoUrl('');
      setWebsite('');
      setLocation('');
      setType('company');
      setIndustry('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = { name, slug, description, logoUrl, website, location, type, industry };

      const res = isEditing
        ? await fetch(`/api/organizations/${org.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/organizations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(isEditing ? 'Organization updated' : 'Organization added');
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!org) return;
    if (!confirm('Delete this organization and all its work experiences?'))
      return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Failed to delete organization');
        return;
      }

      toast.success('Organization deleted');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Organization' : 'Add Organization'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the organization details.'
              : 'Add a new organization to your experience.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corp"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this organization do?"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-logoUrl">Logo URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="org-logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isLoading}
                  className="flex-1"
                />
                {logoUrl.trim() && (
                  <img
                    src={logoUrl.trim()}
                    alt="Logo preview"
                    className="h-8 w-8 shrink-0 rounded object-contain border border-border/50"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-location">Location</Label>
              <Input
                id="org-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orgTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-industry">Industry</Label>
            <Input
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Technology, Healthcare, Finance..."
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
