import { createFileRoute, Link } from '@tanstack/react-router';
import { snapshotLoader } from '@/lib/data-loader';
import { formatRelativeDate, formatPercent } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: VersionListPage,
  loader: () => {
    return {
      versions: snapshotLoader.getAllVersions()
    };
  }
});

function VersionListPage() {
  const { versions } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-muted-foreground mt-1">
            Track changes and performance across agent specialist versions
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">Version</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Change</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version, index) => {
              const prevVersion = versions[index + 1];
              const scoreDelta = prevVersion
                ? version.metadata.avgScore - prevVersion.metadata.avgScore
                : 0;
              const hasChange = Math.abs(scoreDelta) > 0.001;

              return (
                <tr key={version.metadata.version} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4">
                    <Link
                      to="/versions/$version"
                      params={{ version: version.metadata.version }}
                      className="font-mono font-medium hover:underline"
                    >
                      {version.metadata.version}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatRelativeDate(version.metadata.date)}
                  </td>
                  <td className="p-4">
                    <span className="font-medium">
                      {formatPercent(version.metadata.avgScore, 0)}
                    </span>
                  </td>
                  <td className="p-4">
                    {hasChange ? (
                      <div className="flex items-center gap-1">
                        {scoreDelta > 0 ? (
                          <>
                            <ArrowUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              +{formatPercent(scoreDelta, 1)}
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">
                              {formatPercent(scoreDelta, 1)}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="w-4 h-4" />
                        <span className="text-sm">—</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to="/versions/$version"
                      params={{ version: version.metadata.version }}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                    {prevVersion && (
                      <>
                        {' • '}
                        <Link
                          to="/compare"
                          search={{
                            from: prevVersion.metadata.version,
                            to: version.metadata.version
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Compare
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
