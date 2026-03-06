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
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

type Education = {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  logoUrl: string | null;
  url: string | null;
  gpa: string | null;
  courses: string[];
  position: number;
};

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

export function EducationForm({
  education,
  trigger,
}: {
  education?: Education;
  trigger: ReactNode;
}) {
  const isEditing = !!education;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [institution, setInstitution] = useState(
    education?.institution ?? ''
  );
  const [degree, setDegree] = useState(education?.degree ?? '');
  const [field, setField] = useState(education?.field ?? '');
  const [description, setDescription] = useState(
    education?.description ?? ''
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(education?.startDate ?? null)
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(education?.endDate ?? null)
  );
  const [logoUrl, setLogoUrl] = useState(education?.logoUrl ?? '');
  const [url, setUrl] = useState(education?.url ?? '');
  const [gpa, setGpa] = useState(education?.gpa ?? '');
  const [coursesInput, setCoursesInput] = useState(
    education?.courses?.join(', ') ?? ''
  );

  const resetForm = () => {
    if (!isEditing) {
      setInstitution('');
      setDegree('');
      setField('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setLogoUrl('');
      setUrl('');
      setGpa('');
      setCoursesInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const coursesArray = coursesInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        institution,
        degree,
        field,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        logoUrl,
        url,
        gpa,
        courses: coursesArray,
      };

      const res = isEditing
        ? await fetch(`/api/education/${education.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/education', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success(
        isEditing ? 'Education updated' : 'Education entry added'
      );
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save education entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!education) return;
    if (!confirm('Delete this education entry?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/education/${education.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Failed to delete education entry');
        return;
      }

      toast.success('Education entry deleted');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete education entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Education' : 'Add Education'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the education entry details.'
              : 'Add a new education entry.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edu-institution">Institution</Label>
            <Input
              id="edu-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University of California"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edu-degree">Degree</Label>
              <Input
                id="edu-degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="Bachelor of Science"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-field">Field of Study</Label>
              <Input
                id="edu-field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="Computer Science"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edu-description">Description</Label>
            <Textarea
              id="edu-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notable achievements, activities..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edu-startDate">Start Date</Label>
              <Input
                id="edu-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-endDate">End Date</Label>
              <Input
                id="edu-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edu-logoUrl">Logo URL</Label>
              <Input
                id="edu-logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-url">Institution URL</Label>
              <Input
                id="edu-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://university.edu"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edu-gpa">GPA / Score</Label>
              <Input
                id="edu-gpa"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="3.8 / 4.0"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edu-courses">Courses (comma-separated)</Label>
              <Input
                id="edu-courses"
                value={coursesInput}
                onChange={(e) => setCoursesInput(e.target.value)}
                placeholder="Data Structures, Algorithms..."
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Education'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
