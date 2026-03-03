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

const accoladeTypes = [
  'award',
  'certification',
  'grant',
  'hackathon',
  'publication',
] as const;

const accoladeTypeLabels: Record<string, string> = {
  award: 'Award',
  certification: 'Certification',
  grant: 'Grant',
  hackathon: 'Hackathon',
  publication: 'Publication',
};

type Accolade = {
  id: string;
  title: string;
  issuer: string | null;
  type: string;
  description: string | null;
  url: string | null;
  date: string | null;
  imageUrl: string | null;
  position: number;
};

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

export function AccoladeForm({
  accolade,
  trigger,
}: {
  accolade?: Accolade;
  trigger: ReactNode;
}) {
  const isEditing = !!accolade;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(accolade?.title ?? '');
  const [issuer, setIssuer] = useState(accolade?.issuer ?? '');
  const [type, setType] = useState(accolade?.type ?? 'award');
  const [description, setDescription] = useState(
    accolade?.description ?? ''
  );
  const [url, setUrl] = useState(accolade?.url ?? '');
  const [date, setDate] = useState(
    toDateInputValue(accolade?.date ?? null)
  );
  const [imageUrl, setImageUrl] = useState(accolade?.imageUrl ?? '');

  const resetForm = () => {
    if (!isEditing) {
      setTitle('');
      setIssuer('');
      setType('award');
      setDescription('');
      setUrl('');
      setDate('');
      setImageUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        title,
        issuer,
        type,
        description,
        url,
        date: date || null,
        imageUrl,
      };

      const res = isEditing
        ? await fetch(`/api/accolades/${accolade.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/accolades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(isEditing ? 'Accolade updated' : 'Accolade added');
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save accolade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accolade) return;
    if (!confirm('Delete this accolade?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/accolades/${accolade.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Failed to delete accolade');
        return;
      }

      toast.success('Accolade deleted');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete accolade');
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
            {isEditing ? 'Edit Accolade' : 'Add Accolade'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the accolade details.'
              : 'Add a new accolade to your profile.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-title">Title</Label>
            <Input
              id="acc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Best Paper Award"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-issuer">Issuer</Label>
              <Input
                id="acc-issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="IEEE, Google, etc."
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
                  {accoladeTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {accoladeTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-description">Description</Label>
            <Textarea
              id="acc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about this accolade..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-url">URL</Label>
              <Input
                id="acc-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-date">Date</Label>
              <Input
                id="acc-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-imageUrl">Image URL</Label>
            <Input
              id="acc-imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
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
                'Add Accolade'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
