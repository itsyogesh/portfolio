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
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

const fluencyLevels = ['native', 'fluent', 'professional', 'elementary'] as const;

type Language = {
  id: string;
  name: string;
  fluency: string | null;
  position: number;
};

export function LanguageForm({
  language,
  trigger,
}: {
  language?: Language;
  trigger: ReactNode;
}) {
  const isEditing = !!language;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(language?.name ?? '');
  const [fluency, setFluency] = useState(language?.fluency ?? '');

  const resetForm = () => {
    if (!isEditing) {
      setName('');
      setFluency('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name,
        fluency: fluency && fluency !== 'none' ? fluency : null,
      };

      const res = isEditing
        ? await fetch(`/api/languages/${language.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/languages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(isEditing ? 'Language updated' : 'Language added');
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save language');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!language) return;
    if (!confirm('Delete this language?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/languages/${language.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Failed to delete language');
        return;
      }

      toast.success('Language deleted');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete language');
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
            {isEditing ? 'Edit Language' : 'Add Language'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the language details.'
              : 'Add a language you speak.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lang-name">Language</Label>
            <Input
              id="lang-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="English"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fluency</Label>
            <Select value={fluency} onValueChange={setFluency}>
              <SelectTrigger>
                <SelectValue placeholder="Select fluency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Not specified</span>
                </SelectItem>
                {fluencyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    <span className="capitalize">{level}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                'Add Language'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
