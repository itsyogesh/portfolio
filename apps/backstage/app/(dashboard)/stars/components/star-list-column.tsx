'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@packages/base/components/ui/button';
import { Input } from '@packages/base/components/ui/input';
import { toast } from 'sonner';
import { StarRepoCard } from './star-repo-card';
import type { StarRepoData, StarListData } from './star-kanban';

type StarListColumnProps = {
  columnId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  repos: StarRepoData[];
  repoCount: number;
  isCustomList?: boolean;
  onUpdate?: (list: Partial<StarListData> & { id: string }) => void;
  onDelete?: (listId: string) => void;
};

export function StarListColumn({
  columnId,
  name,
  description,
  color,
  repos,
  repoCount,
  isCustomList = false,
  onUpdate,
  onDelete,
}: StarListColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(color || '');

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/stars/lists/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          color: editColor || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      onUpdate?.({
        id: columnId,
        name: editName,
        color: editColor || null,
      });
      setIsEditing(false);
      toast.success('List updated');
    } catch {
      toast.error('Failed to update list');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? Repos will be moved to Unsorted.`)) return;

    try {
      const res = await fetch(`/api/stars/lists/${columnId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      onDelete?.(columnId);
      toast.success('List deleted');
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const borderColor = color || undefined;

  return (
    <div
      className="min-w-[300px] max-w-[340px] flex-shrink-0 flex flex-col rounded-lg border border-border/50 bg-muted/20"
      style={borderColor ? { borderTopColor: borderColor, borderTopWidth: 3 } : undefined}
    >
      {/* Column header */}
      <div className="px-3 py-3 border-b border-border/30">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="List name"
              className="h-7 text-sm"
            />
            <div className="flex items-center gap-2">
              <Input
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                placeholder="#hex color"
                className="h-7 text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSaveEdit}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(name);
                  setEditColor(color || '');
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {color && (
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              <h3 className="font-medium text-sm truncate">{name}</h3>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {repoCount}
              </span>
            </div>

            {isCustomList && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {description && !isEditing && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[100px] max-h-[calc(100vh-220px)] transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted/40' : ''
            }`}
          >
            {repos.map((repo, index) => (
              <StarRepoCard key={repo.id} repo={repo} index={index} />
            ))}
            {provided.placeholder}

            {repos.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-muted-foreground/50 text-center py-6">
                Drop repos here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
