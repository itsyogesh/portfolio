'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { StarListColumn } from './star-list-column';
import { AddListDialog } from './add-list-dialog';
import { SyncButton } from './sync-button';

export type StarListData = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  repoCount: number;
};

export type StarRepoData = {
  id: string;
  githubId: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  topics: string[];
  avatarUrl: string | null;
  position: number;
  listId: string | null;
};

type StarKanbanProps = {
  initialLists: StarListData[];
  initialRepos: StarRepoData[];
};

const UNSORTED_ID = 'unsorted';

export function StarKanban({ initialLists, initialRepos }: StarKanbanProps) {
  const [lists, setLists] = useState<StarListData[]>(initialLists);
  const [repos, setRepos] = useState<StarRepoData[]>(initialRepos);
  const router = useRouter();

  const getReposForColumn = useCallback(
    (columnId: string) => {
      return repos
        .filter((r) =>
          columnId === UNSORTED_ID ? r.listId === null : r.listId === columnId
        )
        .sort((a, b) => a.position - b.position);
    },
    [repos]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;

      if (!destination) return;

      // Same position, no change
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;
      const destListId = destColumnId === UNSORTED_ID ? null : destColumnId;

      // Get the repos in source and destination columns
      const sourceRepos = getReposForColumn(sourceColumnId);
      const destRepos =
        sourceColumnId === destColumnId
          ? sourceRepos
          : getReposForColumn(destColumnId);

      // Remove the dragged repo from source
      const [movedRepo] = sourceRepos.splice(source.index, 1);
      if (!movedRepo) return;

      // Save previous state for rollback
      const previousRepos = [...repos];

      // Insert into destination
      if (sourceColumnId === destColumnId) {
        // Same column reorder
        sourceRepos.splice(destination.index, 0, movedRepo);
        const updatedItems = sourceRepos.map((r, idx) => ({
          ...r,
          position: idx,
        }));

        // Optimistic update
        setRepos((prev) =>
          prev.map((r) => {
            const updated = updatedItems.find((u) => u.id === r.id);
            return updated ? { ...r, position: updated.position } : r;
          })
        );

        // API call
        try {
          const res = await fetch('/api/stars/repos/reorder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: updatedItems.map((r) => ({
                id: r.id,
                position: r.position,
                listId: r.listId,
              })),
            }),
          });
          if (!res.ok) throw new Error('Failed to reorder');
        } catch {
          setRepos(previousRepos);
          toast.error('Failed to reorder repos');
        }
      } else {
        // Cross-column move
        destRepos.splice(destination.index, 0, {
          ...movedRepo,
          listId: destListId,
        });

        // Update positions in both columns
        const updatedSourceItems = sourceRepos.map((r, idx) => ({
          ...r,
          position: idx,
        }));
        const updatedDestItems = destRepos.map((r, idx) => ({
          ...r,
          position: idx,
          listId: destListId,
        }));

        const allUpdatedItems = [...updatedSourceItems, ...updatedDestItems];

        // Optimistic update
        setRepos((prev) =>
          prev.map((r) => {
            const updated = allUpdatedItems.find((u) => u.id === r.id);
            return updated
              ? { ...r, position: updated.position, listId: updated.listId }
              : r;
          })
        );

        // API call
        try {
          const res = await fetch('/api/stars/repos/reorder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: allUpdatedItems.map((r) => ({
                id: r.id,
                position: r.position,
                listId: r.listId,
              })),
            }),
          });
          if (!res.ok) throw new Error('Failed to move repo');
        } catch {
          setRepos(previousRepos);
          toast.error('Failed to move repo');
        }
      }
    },
    [repos, getReposForColumn]
  );

  const handleListCreated = (newList: StarListData) => {
    setLists((prev) => [...prev, newList]);
    router.refresh();
  };

  const handleListUpdated = (updatedList: Partial<StarListData> & { id: string }) => {
    setLists((prev) =>
      prev.map((l) => (l.id === updatedList.id ? { ...l, ...updatedList } : l))
    );
  };

  const handleListDeleted = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    // Move repos back to unsorted
    setRepos((prev) =>
      prev.map((r) => (r.listId === listId ? { ...r, listId: null } : r))
    );
    router.refresh();
  };

  const unsortedRepos = getReposForColumn(UNSORTED_ID);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-1">Stars</h1>
          <p className="text-sm text-muted-foreground">
            {repos.length} starred repos across {lists.length + 1} lists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton />
          <AddListDialog onCreated={handleListCreated} />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2">
          {/* Unsorted column */}
          <StarListColumn
            columnId={UNSORTED_ID}
            name="Unsorted"
            repos={unsortedRepos}
            repoCount={unsortedRepos.length}
          />

          {/* Custom list columns */}
          {lists.map((list) => {
            const listRepos = getReposForColumn(list.id);
            return (
              <StarListColumn
                key={list.id}
                columnId={list.id}
                name={list.name}
                description={list.description}
                color={list.color}
                repos={listRepos}
                repoCount={listRepos.length}
                isCustomList
                onUpdate={handleListUpdated}
                onDelete={handleListDeleted}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
