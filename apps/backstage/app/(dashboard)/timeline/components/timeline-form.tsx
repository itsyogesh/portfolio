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
import { Textarea } from '@packages/base/components/ui/textarea';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type TimelineFormProps = {
  entry?: {
    id: string;
    year: string;
    title: string;
    description: string | null;
  };
};

export function TimelineForm({ entry }: TimelineFormProps) {
  const isEditing = !!entry;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(entry?.year ?? '');
  const [title, setTitle] = useState(entry?.title ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      setYear(entry?.year ?? '');
      setTitle(entry?.title ?? '');
      setDescription(entry?.description ?? '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year.trim() || !title.trim()) return;

    setIsLoading(true);

    try {
      const url = isEditing
        ? `/api/timeline/${entry.id}`
        : '/api/timeline';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: year.trim(),
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(isEditing ? 'Entry updated' : 'Entry created');
      setOpen(false);
      setYear('');
      setTitle('');
      setDescription('');
      router.refresh();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Entry' : 'Add Timeline Entry'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the timeline entry details.'
                : 'Add a new entry to the timeline.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-year">Year</Label>
              <Input
                id="entry-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2024, 2023-2024"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title</Label>
              <Input
                id="entry-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Joined Acme Inc."
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-description">Description</Label>
              <Textarea
                id="entry-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about this milestone"
                disabled={isLoading}
                rows={3}
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
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
