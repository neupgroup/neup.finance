'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, FolderKanban, Inbox, PlusCircle } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { Skeleton } from '@neup/components/ui/skeleton';
import { getAccessibleProjects } from '@/core/hooks/api';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

type Project = { id: string; name: string; roles: string[] };

// Show accessible projects and keep the active project query on page navigation.
export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const currentProjectId = searchParams.get('project')?.trim();
  const projectQuery = currentProjectId ? `?project=${encodeURIComponent(currentProjectId)}` : '';
  const newProjectHref = `/switch/new${projectQuery}`;

  useEffect(() => {
    let isActive = true;

    async function loadProjects() {
      try {
        const items = await getAccessibleProjects();
        if (isActive) setProjects(items);
      } catch (cause) {
        if (isActive) setError(cause instanceof Error ? cause.message : 'Could not load projects.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadProjects();
    return () => { isActive = false; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">View and manage the projects available to your account.</p>
        </div>
        <LinkButton href={newProjectHref} preIcon={<PlusCircle className="mr-2 h-4 w-4" />}>Create project</LinkButton>
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="w-full overflow-hidden rounded-lg border">
        {isLoading ? (
          <div className="divide-y">
            {[0, 1, 2].map((item) => (
              <div key={item} className={stackedCardClassName(item, 3, 'flex items-center justify-between p-4')}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : projects.length ? (
          <div className="divide-y">
            {projects.map((project, index) => {
              const isSelected = project.id === currentProjectId;
              return (
                <div key={project.id} className={stackedCardClassName(index, projects.length, 'flex items-center justify-between gap-4 p-4')}>
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`rounded-full p-2 ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                      <FolderKanban className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.roles.join(', ')}</p>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="shrink-0 text-sm font-medium text-primary">Current project</span>
                  ) : (
                    <LinkButton href={`/home?project=${encodeURIComponent(project.id)}`} variant="outlined" size="sm">
                      Open <ArrowRight className="ml-2 h-4 w-4" />
                    </LinkButton>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <StackedEmptyStateRow
            icon={Inbox}
            title="No projects found"
            description="Create a project to start organizing your finance data."
            className={stackedCardClassName(0, 1, 'bg-card')}
          />
        )}
      </div>
    </div>
  );
}
