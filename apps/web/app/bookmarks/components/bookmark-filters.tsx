'use client';

import { cn } from '@packages/base/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const categories = [
  'Engineering',
  'Design',
  'Business',
  'Science',
  'Culture',
  'Reading',
  'Other',
];

type BookmarkFiltersProps = {
  categoryCounts: Record<string, number>;
};

export function BookmarkFilters({ categoryCounts }: BookmarkFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  const handleCategory = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`/bookmarks?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleCategory(null)}
        className={cn(
          'text-xs px-3 py-1.5 rounded-full transition-colors',
          !activeCategory
            ? 'bg-foreground text-background'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        )}
      >
        All
      </button>
      {categories.map((cat) => {
        const count = categoryCounts[cat] || 0;
        if (count === 0) return null;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategory(cat)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full transition-colors',
              activeCategory === cat
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}{' '}
            <span className="opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
