'use client';

import { Button } from '@packages/base/components/ui/button';
import { Checkbox } from '@packages/base/components/ui/checkbox';
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

const workTypes = ['fulltime', 'contract', 'freelance', 'founder'] as const;

const workTypeLabels: Record<string, string> = {
  fulltime: 'Full-time',
  contract: 'Contract',
  freelance: 'Freelance',
  founder: 'Founder',
};

type WorkExperience = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  highlights: string[];
  position: number;
  organizationId: string;
};

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

export function WorkForm({
  work,
  organizationId,
  trigger,
}: {
  work?: WorkExperience;
  organizationId: string;
  trigger: ReactNode;
}) {
  const isEditing = !!work;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(work?.title ?? '');
  const [description, setDescription] = useState(work?.description ?? '');
  const [startDate, setStartDate] = useState(
    toDateInputValue(work?.startDate ?? null)
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(work?.endDate ?? null)
  );
  const [isCurrent, setIsCurrent] = useState(
    isEditing ? work.endDate === null : false
  );
  const [type, setType] = useState(work?.type ?? 'fulltime');
  const [highlightsInput, setHighlightsInput] = useState(
    work?.highlights?.join(', ') ?? ''
  );

  const resetForm = () => {
    if (!isEditing) {
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setType('fulltime');
      setHighlightsInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const highlightsArray = highlightsInput
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);

      const payload = {
        title,
        description,
        startDate,
        endDate: isCurrent ? null : endDate || null,
        type,
        highlights: highlightsArray,
      };

      const res = isEditing
        ? await fetch(
            `/api/organizations/${organizationId}/work/${work.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          )
        : await fetch(`/api/organizations/${organizationId}/work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(
        isEditing ? 'Work experience updated' : 'Work experience added'
      );
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save work experience');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!work) return;
    if (!confirm('Delete this work experience?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/work/${work.id}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        toast.error('Failed to delete work experience');
        return;
      }

      toast.success('Work experience deleted');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete work experience');
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
            {isEditing ? 'Edit Work Experience' : 'Add Work Experience'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the work experience details.'
              : 'Add a new role at this organization.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="work-title">Title</Label>
            <Input
              id="work-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Engineer"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work-description">Description</Label>
            <Textarea
              id="work-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you do in this role?"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {workTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="work-startDate">Start Date</Label>
              <Input
                id="work-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="work-endDate">End Date</Label>
              <Input
                id="work-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading || isCurrent}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work-highlights">Highlights (comma-separated)</Label>
            <Input
              id="work-highlights"
              value={highlightsInput}
              onChange={(e) => setHighlightsInput(e.target.value)}
              placeholder="Led team of 5, Shipped v2.0, Reduced latency by 40%"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="work-current"
              checked={isCurrent}
              onCheckedChange={(checked) => {
                setIsCurrent(checked === true);
                if (checked) setEndDate('');
              }}
            />
            <Label htmlFor="work-current" className="text-sm font-normal">
              Current position
            </Label>
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
                'Add Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
