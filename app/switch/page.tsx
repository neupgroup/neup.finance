'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader, Plus } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Logo } from '@/components/icons';
import { ensureAccount } from '@/core/hooks/api';

type Project = { id: string; name: string; roles: string[] };

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
        await ensureAccount();
        const response = await fetch('/bridge/api.v1/projects', { credentials: 'include' });
        if (!response.ok) throw new Error('Could not load projects.');
        const items = await response.json() as Project[];
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
    const url = new URL(destination, window.location.origin);
    url.searchParams.set('project', projectId);
    router.push(`${url.pathname}${url.search}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-2 h-12 w-12" />
          <CardTitle>Choose a project</CardTitle>
          <CardDescription>Select the project you want to work on.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin" /></div> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!isLoading && !error && projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet. Create your first project.</p> : null}
          {projects.map((project) => (
            <Button key={project.id} variant="outline" className="h-auto w-full justify-between p-4" onClick={() => chooseProject(project.id)}>
              <span className="text-left"><span className="block font-semibold">{project.name}</span><span className="text-xs text-muted-foreground">{project.roles.join(', ')}</span></span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ))}
          <Button className="w-full" variant="secondary" onClick={() => router.push('/switch/new')}><Plus className="mr-2 h-4 w-4" />New project</Button>
        </CardContent>
      </Card>
    </main>
  );
}
