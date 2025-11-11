import { createFileRoute } from '@tanstack/react-router';
import { snapshotLoader } from '@/lib/data-loader';
import { computeVersionDiff } from '@/lib/diff-engine';
import { formatPercent, formatDelta } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface CompareSearch {
  from?: string;
  to?: string;
}

export const Route = createFileRoute('/compare')({
  component: ComparePage,
  validateSearch: (search: Record<string, unknown>): CompareSearch => {
    return {
      from: search.from as string | undefined,
      to: search.to as string | undefined
    };
  },
  loaderDeps: ({ search }) => ({ from: search.from, to: search.to }),
  loader: ({ deps: { from, to } }) => {
    const versions = snapshotLoader.getAllVersions();

    if (!from || !to) {
      return {
        versions,
        fromVersion: null,
        toVersion: null,
        diff: null
      };
    }

    const fromVersion = snapshotLoader.getVersion(from);
    const toVersion = snapshotLoader.getVersion(to);

    if (!fromVersion || !toVersion) {
      return {
        versions,
        fromVersion: null,
        toVersion: null,
        diff: null
      };
    }

    const diff = computeVersionDiff(fromVersion.snapshot, toVersion.snapshot);

    return {
      versions,
      fromVersion,
      toVersion,
      diff
    };
  }
});

function ComparePage() {
  const { versions, fromVersion, toVersion, diff } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleCompare = (from: string, to: string) => {
    navigate({ search: { from, to } });
  };

  if (!diff || !fromVersion || !toVersion) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Compare Versions</h1>
          <p className="text-muted-foreground mt-1">
            Select two versions to compare their configurations and scores
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg p-4">
            <label className="text-sm font-medium mb-2 block">From Version</label>
            <select
              className="w-full border rounded p-2"
              value={search.from || ''}
              onChange={(e) => handleCompare(e.target.value, search.to || '')}
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v.metadata.version} value={v.metadata.version}>
                  {v.metadata.version}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded-lg p-4">
            <label className="text-sm font-medium mb-2 block">To Version</label>
            <select
              className="w-full border rounded p-2"
              value={search.to || ''}
              onChange={(e) => handleCompare(search.from || '', e.target.value)}
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v.metadata.version} value={v.metadata.version}>
                  {v.metadata.version}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const overallDelta = diff.score_changes.overall;
  const hasImprovement = overallDelta.direction === 'up';
  const hasRegression = overallDelta.direction === 'down';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compare Versions</h1>
        <p className="text-muted-foreground mt-1">
          Comparing {fromVersion.metadata.version} → {toVersion.metadata.version}
        </p>
      </div>

      {/* Summary Card */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Overall Score Change</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatPercent(overallDelta.to, 0)}
              </span>
              <div className="flex items-center gap-1">
                {hasImprovement && (
                  <>
                    <ArrowUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-600">
                      {formatDelta(overallDelta.absolute_change)}
                    </span>
                  </>
                )}
                {hasRegression && (
                  <>
                    <ArrowDown className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-600">
                      {formatDelta(overallDelta.absolute_change)}
                    </span>
                  </>
                )}
                {!hasImprovement && !hasRegression && (
                  <>
                    <Minus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">No change</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Configuration Changes</div>
            <div className="text-2xl font-bold">{diff.summary.total_changes}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {diff.config_changes.added.length} added, {diff.config_changes.removed.length}{' '}
              removed, {diff.config_changes.modified.length} modified
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <div className="text-2xl font-bold capitalize">{diff.summary.score_direction}</div>
          </div>
        </div>

        {diff.summary.significant_changes.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Significant Changes</div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {diff.summary.significant_changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Benchmark Scores */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Benchmark Score Changes</h2>
        <div className="space-y-2">
          {Object.entries(diff.score_changes.benchmarks).map(([name, delta]) => {
            const improved = delta.direction === 'up';
            const regressed = delta.direction === 'down';

            return (
              <div key={name} className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium capitalize">{name.replace(/-/g, ' ')}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {formatPercent(delta.from, 0)} → {formatPercent(delta.to, 0)}
                  </span>
                  <div className="flex items-center gap-1 min-w-[100px] justify-end">
                    {improved && (
                      <>
                        <ArrowUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formatDelta(delta.absolute_change)}
                        </span>
                      </>
                    )}
                    {regressed && (
                      <>
                        <ArrowDown className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-600">
                          {formatDelta(delta.absolute_change)}
                        </span>
                      </>
                    )}
                    {!improved && !regressed && (
                      <>
                        <Minus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">—</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Changes */}
      {diff.summary.total_changes > 0 && (
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Configuration Changes</h2>

          {diff.config_changes.added.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-600 mb-2">
                Added ({diff.config_changes.added.length})
              </div>
              <div className="space-y-1">
                {diff.config_changes.added.map((path, i) => (
                  <div key={i} className="text-sm font-mono bg-green-50 p-2 rounded">
                    + {path}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.config_changes.removed.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-600 mb-2">
                Removed ({diff.config_changes.removed.length})
              </div>
              <div className="space-y-1">
                {diff.config_changes.removed.map((path, i) => (
                  <div key={i} className="text-sm font-mono bg-red-50 p-2 rounded">
                    - {path}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.config_changes.modified.length > 0 && (
            <div>
              <div className="text-sm font-medium text-yellow-600 mb-2">
                Modified ({diff.config_changes.modified.length})
              </div>
              <div className="space-y-2">
                {diff.config_changes.modified.map((change, i) => (
                  <div key={i} className="text-sm border rounded p-2">
                    <div className="font-mono text-muted-foreground mb-1">{change.path}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-50 p-2 rounded">
                        <div className="text-red-600 font-medium mb-1">Old</div>
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(change.old_value, null, 2)}
                        </pre>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-green-600 font-medium mb-1">New</div>
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(change.new_value, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
