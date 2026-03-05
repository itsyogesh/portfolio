'use client';

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
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectFormDialog } from './project-form';

export type ProjectData = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  status: string;
  category: string | null;
  tech: string[];
  url: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  position: number;
  startDate: string | null;
  endDate: string | null;
};

type ProjectTableProps = {
  projects: ProjectData[];
};

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  building: 'secondary',
  shipped: 'default',
  legacy: 'outline',
  concept: 'outline',
};

export function ProjectTable({ projects }: ProjectTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        toast.error('Failed to delete project');
        return;
      }

      toast.success('Project deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProjectFormDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Project
            </Button>
          }
        />
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No projects yet. Create your first project to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[project.status] || 'outline'}
                    className="text-[10px]"
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.category ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {project.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {project.featured ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {project.tech.slice(0, 3).map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {t}
                      </Badge>
                    ))}
                    {project.tech.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{project.tech.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ProjectFormDialog
                      project={project}
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
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Delete"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
