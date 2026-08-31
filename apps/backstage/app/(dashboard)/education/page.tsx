import { requireAdminPage } from '../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { EducationForm } from './components/education-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Education',
  description: 'Manage education entries',
};

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default async function EducationPage() {
  await requireAdminPage();

  const educationEntries = await database.education.findMany({
    orderBy: { position: 'asc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-2">
            Education
          </h1>
          <p className="text-sm text-muted-foreground">
            {educationEntries.length} entr
            {educationEntries.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <EducationForm
          trigger={<Button size="sm">Add Education</Button>}
        />
      </div>

      {educationEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No education entries yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {educationEntries.map((edu) => (
            <Card key={edu.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {edu.logoUrl && (
                    <img
                      src={edu.logoUrl}
                      alt={`${edu.institution} logo`}
                      className="h-10 w-10 rounded-md object-contain shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <CardTitle className="text-lg">
                      {edu.institution}
                    </CardTitle>
                    {(edu.degree || edu.field) && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                      </p>
                    )}
                    {(edu.startDate || edu.endDate) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(edu.startDate)}
                        {edu.startDate && edu.endDate ? ' \u2014 ' : ''}
                        {formatDate(edu.endDate)}
                      </p>
                    )}
                  </div>
                </div>
                <EducationForm
                  education={{
                    id: edu.id,
                    institution: edu.institution,
                    degree: edu.degree,
                    field: edu.field,
                    description: edu.description,
                    startDate: edu.startDate?.toISOString() ?? null,
                    endDate: edu.endDate?.toISOString() ?? null,
                    logoUrl: edu.logoUrl,
                    url: edu.url,
                    gpa: edu.gpa,
                    courses: edu.courses,
                    position: edu.position,
                  }}
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  }
                />
              </CardHeader>
              {edu.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {edu.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
