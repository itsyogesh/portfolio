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

type StackItemFormProps = {
  categoryId: string;
  item?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    url: string | null;
  };
};

export function StackItemForm({ categoryId, item }: StackItemFormProps) {
  const isEditing = !!item;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [logoUrl, setLogoUrl] = useState(item?.logoUrl ?? '');
  const [url, setUrl] = useState(item?.url ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      setName(item?.name ?? '');
      setDescription(item?.description ?? '');
      setLogoUrl(item?.logoUrl ?? '');
      setUrl(item?.url ?? '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      const apiUrl = isEditing
        ? `/api/stack/items/${item.id}`
        : '/api/stack/items';
      const method = isEditing ? 'PATCH' : 'POST';

      const payload: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        url: url.trim(),
      };

      if (!isEditing) {
        payload.categoryId = categoryId;
      }

      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(isEditing ? 'Item updated' : 'Item created');
      setOpen(false);
      setName('');
      setDescription('');
      setLogoUrl('');
      setUrl('');
      router.refresh();
    } catch {
      toast.error('Failed to save item');
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
          <Button variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the stack item details.'
                : 'Add a new item to this category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. React, Figma, AWS"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the tool or technology"
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-logo-url">Logo URL</Label>
              <Input
                id="item-logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.svg"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-url">Website</Label>
              <Input
                id="item-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
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
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
