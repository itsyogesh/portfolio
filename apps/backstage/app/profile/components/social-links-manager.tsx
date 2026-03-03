'use client';

import { Badge } from '@packages/base/components/ui/badge';
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
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const platforms = [
  'github',
  'twitter',
  'linkedin',
  'website',
  'youtube',
  'email',
  'other',
];

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  position: number;
};

type SocialLinksManagerProps = {
  socials: SocialLink[];
};

export function SocialLinksManager({ socials }: SocialLinksManagerProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this social link?')) return;
    setIsDeleting(id);

    try {
      const res = await fetch(`/api/profile/socials/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Failed to delete social link');
        return;
      }

      toast.success('Social link deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete social link');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/50">
        {socials.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            No social links yet. Add one to get started.
          </p>
        ) : (
          <div className="divide-y divide-border/30">
            {socials.map((social) => (
              <div
                key={social.id}
                className="flex items-center gap-3 py-2 px-4 hover:bg-muted/30 transition-colors"
              >
                <Badge variant="outline" className="text-[10px] capitalize">
                  {social.platform}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{social.url}</p>
                  {social.label && (
                    <p className="text-xs text-muted-foreground">
                      {social.label}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  #{social.position}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <SocialLinkDialog
                    social={social}
                    trigger={
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(social.id)}
                    disabled={isDeleting === social.id}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Delete"
                  >
                    {isDeleting === social.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SocialLinkDialog
        trigger={
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Social Link
          </Button>
        }
      />
    </div>
  );
}

type SocialLinkDialogProps = {
  social?: SocialLink;
  trigger: React.ReactNode;
};

function SocialLinkDialog({ social, trigger }: SocialLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState(social?.platform ?? 'github');
  const [url, setUrl] = useState(social?.url ?? '');
  const [label, setLabel] = useState(social?.label ?? '');
  const [position, setPosition] = useState(String(social?.position ?? 0));

  const isEditing = !!social;

  const resetForm = () => {
    if (!isEditing) {
      setPlatform('github');
      setUrl('');
      setLabel('');
      setPosition('0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        platform,
        url,
        label,
        position: Number.parseInt(position, 10) || 0,
      };

      const res = isEditing
        ? await fetch(`/api/profile/socials/${social.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/profile/socials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save social link');
        return;
      }

      toast.success(isEditing ? 'Social link updated' : 'Social link added');
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save social link');
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
            {isEditing ? 'Edit Social Link' : 'Add Social Link'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the social link details below.'
              : 'Add a new social link to your profile.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="capitalize">{p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="social-url">URL</Label>
            <Input
              id="social-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="social-label">Label</Label>
              <Input
                id="social-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Display label"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-position">Position</Label>
              <Input
                id="social-position"
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
