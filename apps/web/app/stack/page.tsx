import { database } from '@packages/db';
import { createMetadata } from '@packages/seo/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = createMetadata({
  title: 'Stack',
  description: 'The tools, languages, and infrastructure I use to build products.',
});

const StackPage = async () => {
  const categories = await database.stackCategory.findMany({
    include: { items: { orderBy: { position: 'asc' } } },
    orderBy: { position: 'asc' },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Stack</h1>
        <p className="text-muted-foreground">
          Tools, languages, and infrastructure I use to build things.
        </p>
      </section>

      {categories.map((category) => (
        <section key={category.id} className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {category.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {category.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default StackPage;
