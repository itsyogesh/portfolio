import { requireAdminPage } from '../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@packages/base/components/ui/table';
import { AccoladeForm } from './components/accolade-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accolades',
  description: 'Manage accolades, awards, and certifications',
};

const accoladeTypeLabels: Record<string, string> = {
  award: 'Award',
  certification: 'Certification',
  grant: 'Grant',
  hackathon: 'Hackathon',
  publication: 'Publication',
};

const typeOrder = [
  'award',
  'certification',
  'grant',
  'hackathon',
  'publication',
];

function formatDate(date: Date | null): string {
  if (!date) return '\u2014';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default async function AccoladesPage() {
  await requireAdminPage();

  const accolades = await database.accolade.findMany({
    orderBy: { position: 'asc' },
  });

  const grouped = typeOrder.reduce(
    (acc, type) => {
      const items = accolades.filter((a) => a.type === type);
      if (items.length > 0) {
        acc[type] = items;
      }
      return acc;
    },
    {} as Record<string, typeof accolades>
  );

  // Catch any accolades with types not in our predefined list
  const knownTypes = new Set(typeOrder);
  const otherAccolades = accolades.filter((a) => !knownTypes.has(a.type));
  if (otherAccolades.length > 0) {
    grouped['other'] = otherAccolades;
  }

  const groupKeys = Object.keys(grouped);

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">
            Accolades
          </h1>
          <p className="text-sm text-muted-foreground">
            {accolades.length} accolade{accolades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AccoladeForm
          trigger={<Button size="sm">Add Accolade</Button>}
        />
      </div>

      {accolades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No accolades yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map((type) => (
            <div key={type}>
              <h2 className="font-display text-xl mb-3 capitalize">
                {accoladeTypeLabels[type] ?? type}s
              </h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[type].map((accolade) => (
                      <TableRow key={accolade.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {accolade.imageUrl && (
                              <img
                                src={accolade.imageUrl}
                                alt=""
                                className="h-6 w-6 rounded object-contain shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {accolade.url ? (
                                  <a
                                    href={accolade.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {accolade.title}
                                  </a>
                                ) : (
                                  accolade.title
                                )}
                              </p>
                              {accolade.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {accolade.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {accolade.issuer ?? '\u2014'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(accolade.date)}
                        </TableCell>
                        <TableCell>
                          <AccoladeForm
                            accolade={{
                              id: accolade.id,
                              title: accolade.title,
                              issuer: accolade.issuer,
                              type: accolade.type,
                              description: accolade.description,
                              url: accolade.url,
                              date: accolade.date?.toISOString() ?? null,
                              imageUrl: accolade.imageUrl,
                              position: accolade.position,
                            }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
