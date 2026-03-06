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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Switch } from '@packages/base/components/ui/switch';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ProjectData } from './project-table';

const statuses = ['active', 'building', 'shipped', 'legacy', 'concept'];
const categories = [
  'saas',
  'web3',
  'agency',
  'education',
  'consumer',
  'fintech',
  'commerce',
];
const kinds = ['product', 'client', 'oss', 'internal', 'experiment'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

type OrgOption = { id: string; name: string };

type ProjectFormDialogProps = {
  project?: ProjectData;
  organizations: OrgOption[];
  trigger: React.ReactNode;
};

export function ProjectFormDialog({ project, organizations, trigger }: ProjectFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!project;

  const [title, setTitle] = useState(project?.title ?? '');
  const [slug, setSlug] = useState(project?.slug ?? '');
  const [summary, setSummary] = useState(project?.summary ?? '');
  const [content, setContent] = useState(project?.content ?? '');
  const [status, setStatus] = useState(project?.status ?? 'concept');
  const [category, setCategory] = useState(project?.category ?? '');
  const [techInput, setTechInput] = useState(
    project?.tech?.join(', ') ?? ''
  );
  const [url, setUrl] = useState(project?.url ?? '');
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? '');
  const [imageUrl, setImageUrl] = useState(project?.imageUrl ?? '');
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [position, setPosition] = useState(
    String(project?.position ?? 0)
  );
  const [startDate, setStartDate] = useState(project?.startDate ?? '');
  const [endDate, setEndDate] = useState(project?.endDate ?? '');
  const [kind, setKind] = useState(project?.kind ?? '');
  const [role, setRole] = useState(project?.role ?? '');
  const [highlightsInput, setHighlightsInput] = useState(
    project?.highlights?.join(', ') ?? ''
  );
  const [organizationId, setOrganizationId] = useState(
    project?.organizationId ?? ''
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlug(slugify(value));
    }
  };

  const resetForm = () => {
    if (!isEditing) {
      setTitle('');
      setSlug('');
      setSummary('');
      setContent('');
      setStatus('concept');
      setCategory('');
      setTechInput('');
      setUrl('');
      setGithubUrl('');
      setImageUrl('');
      setFeatured(false);
      setPosition('0');
      setStartDate('');
      setEndDate('');
      setKind('');
      setRole('');
      setHighlightsInput('');
      setOrganizationId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const techArray = techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const highlightsArray = highlightsInput
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug,
      summary,
      content,
      status,
      category: category && category !== 'none' ? category : null,
      tech: techArray,
      url,
      githubUrl,
      imageUrl,
      featured,
      position: Number.parseInt(position, 10) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      kind: kind && kind !== 'none' ? kind : null,
      role: role || null,
      highlights: highlightsArray,
      organizationId: organizationId && organizationId !== 'none' ? organizationId : null,
    };

    try {
      const res = isEditing
        ? await fetch(`/api/projects/${project.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save project');
        return;
      }

      toast.success(isEditing ? 'Project updated' : 'Project created');
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Add Project'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project details below.'
              : 'Fill in the details for a new project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-title">Title *</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Awesome Project"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-slug">Slug *</Label>
              <Input
                id="project-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-awesome-project"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-summary">Summary</Label>
            <Textarea
              id="project-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief summary of the project..."
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-content">Content (Markdown)</Label>
            <Textarea
              id="project-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed project description in markdown..."
              rows={5}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="capitalize">{c}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-position">Position</Label>
              <Input
                id="project-position"
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue placeholder="Select kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {kinds.map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="capitalize">{k}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-role">Role</Label>
              <Input
                id="project-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="creator, lead, contributor..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-tech">Tech (comma-separated)</Label>
            <Input
              id="project-tech"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="React, TypeScript, Tailwind CSS"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-highlights">Highlights (comma-separated)</Label>
            <Input
              id="project-highlights"
              value={highlightsInput}
              onChange={(e) => setHighlightsInput(e.target.value)}
              placeholder="10k users, Featured on PH, Open sourced..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-url">Project URL</Label>
              <Input
                id="project-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://myproject.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-githubUrl">GitHub URL</Label>
              <Input
                id="project-githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-imageUrl">Image URL</Label>
            <Input
              id="project-imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-startDate">Start Date</Label>
              <Input
                id="project-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-endDate">End Date</Label>
              <Input
                id="project-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="project-featured"
              checked={featured}
              onCheckedChange={setFeatured}
              disabled={isLoading}
            />
            <Label htmlFor="project-featured">Featured project</Label>
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
