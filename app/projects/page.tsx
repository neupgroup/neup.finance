import Link from 'next/link';
import { ArrowRight, Building2, ContactRound, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';

const projectSections = [
  {
    title: 'Project profile',
    description: 'View and manage your project details.',
    href: '/projects/profile',
    icon: ContactRound,
  },
  {
    title: 'Teams',
    description: 'View the teams in your project.',
    href: '/projects/teams',
    icon: Users,
  },
];

// Show the projects area and its available sections.
export default function ProjectsHomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Manage your project profile and teams.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projectSections.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Project workspace</CardTitle>
          </div>
          <CardDescription>Project information and membership tools will be available here.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
