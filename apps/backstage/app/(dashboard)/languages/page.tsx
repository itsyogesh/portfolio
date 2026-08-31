import { requireAdminPage } from '../../api/_lib/auth';
import { database } from '@packages/db';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import { Pencil, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { LanguageForm } from './components/language-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Languages',
  description: 'Manage languages',
};

export default async function LanguagesPage() {
  await requireAdminPage();

  const languages = await database.language.findMany({
    orderBy: { position: 'asc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">
            Languages
          </h1>
          <p className="text-sm text-muted-foreground">
            {languages.length} language{languages.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <LanguageForm
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Language
            </Button>
          }
        />
      </div>

      {languages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No languages yet. Add your first language to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{lang.name}</span>
                {lang.fluency && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {lang.fluency}
                  </Badge>
                )}
              </div>
              <LanguageForm
                language={{
                  id: lang.id,
                  name: lang.name,
                  fluency: lang.fluency,
                  position: lang.position,
                }}
                trigger={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
