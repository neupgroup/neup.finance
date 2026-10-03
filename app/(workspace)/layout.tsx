import { SidebarProvider, Sidebar, SidebarTrigger } from '@neup/components/ui/sidebar';
import { Header, HeaderBrand } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="min-h-0">
      <div className="app-frame w-full bg-background text-foreground">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background shadow">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <HeaderBrand />
            </div>
            <Header />
          </div>
        </header>
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          <Sidebar className="hidden h-[calc(100vh-4rem)] flex-col border-r border-sidebar-border p-2 lg:top-16 lg:flex">
            <MainNav />
          </Sidebar>
          <main className="px-4 pt-3 md:px-6 md:pt-4 lg:px-8 lg:pt-5">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
