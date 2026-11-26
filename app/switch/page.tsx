'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, FolderKanban, Inbox, PlusCircle } from 'lucide-react';
import { Skeleton } from '@neup/components/ui/skeleton';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { getAccessibleProjects } from '@/core/hooks/api';
import { withAppBasePathInUrl, withoutAppBasePath } from '@/core/helpers/app-path';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

type Project = { id: string; name: string; roles: string[] };

// Return the requested destination with the selected project in its query string.
function buildProjectDestination(destination: string, projectId: string, origin: string) {
  const url = new URL(destination, origin);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return new URL('/', origin);
  }
  url.searchParams.delete('redirectsTo');
  url.searchParams.set('project', projectId);
  return url;
}

export default function SwitchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const items = await getAccessibleProjects();
        if (active) setProjects(items);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load projects.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadProjects();
    return () => { active = false; };
  }, []);

  const chooseProject = (projectId: string) => {
    const destination = searchParams.get('redirectsTo') || searchParams.get('returnTo') || '/';
    let url: URL;
    try {
      url = buildProjectDestination(destination, projectId, window.location.origin);
    } catch {
      url = buildProjectDestination('/', projectId, window.location.origin);
    }

    if (url.origin !== window.location.origin) {
      window.location.assign(withAppBasePathInUrl(url).toString());
      return;
    }

    router.push(`${withoutAppBasePath(url.pathname)}${url.search}${url.hash}`);
  };
  const selectedProjectId = searchParams.get('project');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-sm text-muted-foreground">Choose a project to open or create a new one.</p>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg border">
        {error ? <p role="alert" className="p-4 text-sm text-destructive">{error}</p> : null}
        {isLoading ? (
          <div className="divide-y">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={stackedCardClassName(item, 4, 'flex items-center justify-between p-4')}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            <LinkButton
              href={`/switch/new${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
              variant="text"
              alignment="left"
              className={stackedCardClassName(0, projects.length + 1, 'flex h-auto w-full items-center justify-between p-4 text-left')}
            >
              <span className="flex items-center gap-4">
                <span className="rounded-full bg-muted p-2"><PlusCircle className="h-5 w-5 text-muted-foreground" /></span>
                <span><span className="block font-semibold">Create Project</span><span className="text-sm text-muted-foreground">Add a new project to organize your work.</span></span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </LinkButton>

            {projects.length > 0 ? projects.map((project, index) => {
              const isSelected = project.id === selectedProjectId;
              return (
                <Button
                  key={project.id}
                  type="button"
                  variant="text"
                  alignment="left"
                  aria-current={isSelected ? 'true' : undefined}
                  className={stackedCardClassName(index + 1, projects.length + 1, `flex h-auto w-full items-center justify-between p-4 text-left ${isSelected ? 'bg-primary/20 hover:bg-primary/30' : ''}`)}
                  onClick={() => chooseProject(project.id)}
                >
                  <span className="flex items-center gap-4">
                    <span className={`rounded-full p-2 ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}><FolderKanban className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} /></span>
                    <span><span className="block font-semibold">{project.name}</span><span className="text-sm text-muted-foreground">{project.roles.join(', ')}</span></span>
                  </span>
                  {isSelected
                    ? <span className="flex items-center gap-1 text-sm font-medium text-primary"><Check className="h-5 w-5" />Selected</span>
                    : <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </Button>
              );
            }) : (
              <StackedEmptyStateRow
                icon={Inbox}
                title="No projects found"
                description="Create your first project from the card above."
                className={stackedCardClassName(1, 2, 'bg-card')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
