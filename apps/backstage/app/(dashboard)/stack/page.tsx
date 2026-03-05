import { database } from '@packages/db';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../api/_lib/auth';
import { CategoryForm } from './components/category-form';
import { StackCategoryCard } from './components/stack-category-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stack',
  description: 'Manage tech stack categories and items',
};

export default async function StackPage() {
  await requireAdminPage();

  const categories = await database.stackCategory.findMany({
    orderBy: { position: 'asc' },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">Stack</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'},{' '}
            {categories.reduce((sum, c) => sum + c.items.length, 0)} items total
          </p>
        </div>
        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <StackCategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
