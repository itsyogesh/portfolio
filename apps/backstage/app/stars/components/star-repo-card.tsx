'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Badge } from '@packages/base/components/ui/badge';
import { Star, ExternalLink } from 'lucide-react';
import type { StarRepoData } from './star-kanban';

type StarRepoCardProps = {
  repo: StarRepoData;
  index: number;
};

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}

export function StarRepoCard({ repo, index }: StarRepoCardProps) {
  return (
    <Draggable draggableId={repo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-md border border-border/40 bg-background p-2.5 transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-1 ring-ring/20' : 'hover:border-border/80'
          }`}
        >
          {/* Repo name and link */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate">
                {repo.fullName.split('/')[1]}
              </p>
              <p className="text-[10px] text-muted-foreground/60 truncate">
                {repo.fullName.split('/')[0]}
              </p>
            </div>
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Description */}
          {repo.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {repo.description}
            </p>
          )}

          {/* Footer: language + stars */}
          <div className="flex items-center gap-2 mt-2">
            {repo.language && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {repo.language}
              </Badge>
            )}
            <div className="flex items-center gap-0.5 text-muted-foreground ml-auto">
              <Star className="h-3 w-3" />
              <span className="text-[10px] tabular-nums">
                {formatStarCount(repo.stargazersCount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
