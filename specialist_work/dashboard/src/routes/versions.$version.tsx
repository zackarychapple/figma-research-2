import { createFileRoute, Link } from '@tanstack/react-router';
import { snapshotLoader } from '@/lib/data-loader';
import { formatRelativeDate, formatPercent } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/versions/$version')({
  component: VersionDetailPage,
  loader: ({ params }) => {
    const version = snapshotLoader.getVersion(params.version);
    if (!version) {
      throw new Error('Version not found');
    }
    return { version };
  }
});

function VersionDetailPage() {
  const { version } = Route.useLoaderData();
  const { snapshot, benchmarks, metadata } = version;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-mono">{metadata.version}</h1>
          <p className="text-muted-foreground mt-1">
            {formatRelativeDate(metadata.date)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scores Card */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Performance Scores</h2>
          {benchmarks && (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                <div className="text-3xl font-bold">
                  {formatPercent(benchmarks.aggregate.avg_score, 0)}
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                {snapshot.preferred_models[0] &&
                  Object.entries(snapshot.preferred_models[0].benchmarks).map(
                    ([name, score]) => (
                      <div key={name} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground capitalize">
                          {name.replace(/-/g, ' ')}
                        </span>
                        <span className="font-medium">{formatPercent(score, 0)}</span>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Card */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Metadata</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{snapshot.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-medium">{snapshot.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{snapshot.from}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span className="font-medium">{snapshot.license}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Availability</span>
              <span className="font-medium capitalize">{snapshot.availability}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persona */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Persona</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Purpose</div>
            <p className="text-sm">{snapshot.persona.purpose}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Values</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.persona.values.map((value) => (
                <span
                  key={value}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Attributes</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.persona.attributes.map((attr) => (
                <span
                  key={attr}
                  className="px-2 py-1 bg-accent text-accent-foreground rounded text-sm"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Tech Stack</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.persona.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Capabilities</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.capabilities.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Descriptions</div>
            <div className="space-y-2">
              {Object.entries(snapshot.capabilities.descriptions).map(([key, desc]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {desc}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Considerations
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {snapshot.capabilities.considerations.map((consideration, i) => (
                <li key={i}>{consideration}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
