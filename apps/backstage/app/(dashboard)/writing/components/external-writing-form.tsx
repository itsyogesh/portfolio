'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Switch } from '@packages/base/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';

interface ExternalWriting {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  summary: string | null;
  tags: string[];
  imageUrl: string | null;
  featured: boolean;
  position: number;
}

const SOURCES = [
  { value: 'substack', label: 'Substack' },
  { value: 'medium', label: 'Medium' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'devto', label: 'Dev.to' },
  { value: 'hashnode', label: 'Hashnode' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' },
];

interface ExternalWritingFormProps {
  writing?: ExternalWriting;
  onSuccess: () => void;
}

export function ExternalWritingForm({
  writing,
  onSuccess,
}: ExternalWritingFormProps) {
  const isEditing = !!writing;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(writing?.title ?? '');
  const [url, setUrl] = useState(writing?.url ?? '');
  const [source, setSource] = useState(writing?.source ?? '');
  const [publishedAt, setPublishedAt] = useState(
    writing?.publishedAt
      ? new Date(writing.publishedAt).toISOString().split('T')[0]
      : ''
  );
  const [summary, setSummary] = useState(writing?.summary ?? '');
  const [tagsInput, setTagsInput] = useState(
    writing?.tags?.join(', ') ?? ''
  );
  const [imageUrl, setImageUrl] = useState(writing?.imageUrl ?? '');
  const [featured, setFeatured] = useState(writing?.featured ?? false);

  function resetForm() {
    if (!isEditing) {
      setTitle('');
      setUrl('');
      setSource('');
      setPublishedAt('');
      setSummary('');
      setTagsInput('');
      setImageUrl('');
      setFeatured(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      toast.error('Title and URL are required');
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      url: url.trim(),
      source: source || null,
      publishedAt: publishedAt || null,
      summary: summary.trim() || null,
      tags,
      imageUrl: imageUrl.trim() || null,
      featured,
    };

    try {
      const endpoint = isEditing
        ? `/api/writing/${writing.id}`
        : '/api/writing';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      toast.success(
        isEditing
          ? 'External writing updated'
          : 'External writing created'
      );
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Add External Writing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit External Writing' : 'Add External Writing'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this external writing entry.'
              : 'Add a link to an article published on another platform.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishedAt">Published Date</Label>
            <Input
              id="publishedAt"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief summary of the article..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="react, nextjs, typescript"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="featured"
              checked={featured}
              onCheckedChange={setFeatured}
            />
            <Label htmlFor="featured">Featured</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : isEditing
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
