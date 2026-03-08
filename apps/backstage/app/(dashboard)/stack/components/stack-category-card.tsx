'use client';

import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CategoryForm } from './category-form';
import { StackItemForm } from './stack-item-form';

type StackItem = {
  id: string;
  name: string;
  description: string | null;
  iconSlug: string | null;
  logoUrl: string | null;
  url: string | null;
  position: number;
};

type StackCategoryCardProps = {
  category: {
    id: string;
    name: string;
    position: number;
    items: StackItem[];
  };
};

export function StackCategoryCard({ category }: StackCategoryCardProps) {
  const router = useRouter();

  const deleteCategory = async () => {
    if (
      !confirm(
        `Delete "${category.name}" and all its items? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/stack/categories/${category.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to delete category');
        return;
      }
      toast.success('Category deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const deleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Delete "${itemName}"?`)) return;

    try {
      const res = await fetch(`/api/stack/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to delete item');
        return;
      }
      toast.success('Item deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {category.items.length} item{category.items.length !== 1 && 's'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <CategoryForm category={category} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-500"
            onClick={deleteCategory}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {category.items.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No items yet. Add one below.
          </p>
        )}
        {category.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2 px-3 border border-border/40 rounded-md hover:bg-muted/30 transition-colors"
          >
            {(item.iconSlug || item.logoUrl) && (
              <img
                src={
                  item.iconSlug
                    ? `https://cdn.simpleicons.org/${item.iconSlug}`
                    : item.logoUrl!
                }
                alt={item.name}
                className={`h-6 w-6 rounded object-contain shrink-0${item.iconSlug ? ' dark:invert' : ''}`}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StackItemForm categoryId={category.id} item={item} />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                onClick={() => deleteItem(item.id, item.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <div className="pt-2">
          <StackItemForm categoryId={category.id} />
        </div>
      </CardContent>
    </Card>
  );
}
