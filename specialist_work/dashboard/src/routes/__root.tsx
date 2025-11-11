import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold">
                Agent Specialist Dashboard
              </Link>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: 'text-foreground' }}
                >
                  Versions
                </Link>
                <Link
                  to="/timeline"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: 'text-foreground' }}
                >
                  Timeline
                </Link>
                <Link
                  to="/compare"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: 'text-foreground' }}
                >
                  Compare
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
