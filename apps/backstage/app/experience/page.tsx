import { requireAdminPage } from '../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { OrgForm } from './components/org-form';
import { WorkForm } from './components/work-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Experience',
  description: 'Manage organizations and work experience',
};

const workTypeLabels: Record<string, string> = {
  fulltime: 'Full-time',
  contract: 'Contract',
  freelance: 'Freelance',
  founder: 'Founder',
};

function formatDate(date: Date | null): string {
  if (!date) return 'Present';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default async function ExperiencePage() {
  await requireAdminPage();

  const organizations = await database.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      workExperiences: {
        orderBy: { position: 'asc' },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">
            Experience
          </h1>
          <p className="text-sm text-muted-foreground">
            {organizations.length} organization
            {organizations.length !== 1 ? 's' : ''},{' '}
            {organizations.reduce(
              (sum, org) => sum + org.workExperiences.length,
              0
            )}{' '}
            roles total
          </p>
        </div>
        <OrgForm
          trigger={<Button size="sm">Add Organization</Button>}
        />
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No organizations yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {org.logoUrl && (
                    <img
                      src={org.logoUrl}
                      alt={`${org.name} logo`}
                      className="h-10 w-10 rounded-md object-contain shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary">
                        {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                      </Badge>
                      {org.location && (
                        <span className="text-xs text-muted-foreground">
                          {org.location}
                        </span>
                      )}
                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <WorkForm
                    organizationId={org.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        Add Role
                      </Button>
                    }
                  />
                  <OrgForm
                    org={{
                      id: org.id,
                      name: org.name,
                      description: org.description,
                      logoUrl: org.logoUrl,
                      website: org.website,
                      location: org.location,
                      type: org.type,
                    }}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              {org.description && (
                <CardContent className="pt-0 pb-2">
                  <p className="text-sm text-muted-foreground">
                    {org.description}
                  </p>
                </CardContent>
              )}
              {org.workExperiences.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {org.workExperiences.map((work) => (
                      <div
                        key={work.id}
                        className="flex items-start justify-between gap-4 rounded-md border border-border/50 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">
                              {work.title}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {workTypeLabels[work.type] ?? work.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(work.startDate)} &mdash;{' '}
                            {formatDate(work.endDate)}
                          </p>
                          {work.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {work.description}
                            </p>
                          )}
                        </div>
                        <WorkForm
                          organizationId={org.id}
                          work={{
                            id: work.id,
                            title: work.title,
                            description: work.description,
                            startDate: work.startDate.toISOString(),
                            endDate: work.endDate?.toISOString() ?? null,
                            type: work.type,
                            position: work.position,
                            organizationId: work.organizationId,
                          }}
                          trigger={
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
