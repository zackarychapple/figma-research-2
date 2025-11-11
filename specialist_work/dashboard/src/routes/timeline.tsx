import { createFileRoute, Link } from '@tanstack/react-router';
import { snapshotLoader } from '@/lib/data-loader';
import { formatPercent } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const Route = createFileRoute('/timeline')({
  component: TimelinePage,
  loader: () => {
    const versions = snapshotLoader.getAllVersions();

    // Prepare chart data
    const chartData = versions
      .slice()
      .reverse() // Oldest first for timeline
      .map((v) => {
        const benchmarkScores: Record<string, number> = {};
        if (v.snapshot.preferred_models[0]) {
          Object.entries(v.snapshot.preferred_models[0].benchmarks).forEach(
            ([name, score]) => {
              benchmarkScores[name] = score * 100; // Convert to percentage
            }
          );
        }

        return {
          version: v.metadata.version,
          date: v.metadata.date.toLocaleDateString(),
          overall: v.metadata.avgScore * 100,
          ...benchmarkScores
        };
      });

    return { versions, chartData };
  }
});

function TimelinePage() {
  const { versions, chartData } = Route.useLoaderData();

  // Get all benchmark names
  const benchmarkNames = new Set<string>();
  versions.forEach((v) => {
    if (v.snapshot.preferred_models[0]) {
      Object.keys(v.snapshot.preferred_models[0].benchmarks).forEach((name) =>
        benchmarkNames.add(name)
      );
    }
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Score Timeline</h1>
        <p className="text-muted-foreground mt-1">
          Visualize performance trends across versions
        </p>
      </div>

      {/* Score Chart */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Score Progression</h2>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="version" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelStyle={{ color: 'black' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#000000"
                strokeWidth={2}
                name="Overall"
                dot={{ r: 4 }}
              />
              {Array.from(benchmarkNames).map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={name.replace(/-/g, ' ')}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Version Cards Timeline */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Version History</h2>
        <div className="space-y-4">
          {versions.map((version, index) => {
            const prevVersion = versions[index + 1];
            const scoreDelta = prevVersion
              ? version.metadata.avgScore - prevVersion.metadata.avgScore
              : 0;

            return (
              <div key={version.metadata.version} className="relative">
                {/* Timeline line */}
                {index < versions.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                      ${
                        scoreDelta > 0.001
                          ? 'bg-green-100 text-green-700'
                          : scoreDelta < -0.001
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {Math.round(version.metadata.avgScore * 100)}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to="/versions/$version"
                          params={{ version: version.metadata.version }}
                          className="font-mono font-semibold text-lg hover:underline"
                        >
                          {version.metadata.version}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {version.metadata.date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPercent(version.metadata.avgScore, 0)}
                        </div>
                        {Math.abs(scoreDelta) > 0.001 && (
                          <div
                            className={`text-sm font-medium ${
                              scoreDelta > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {scoreDelta > 0 ? '+' : ''}
                            {formatPercent(scoreDelta, 1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Benchmark scores */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {version.snapshot.preferred_models[0] &&
                        Object.entries(version.snapshot.preferred_models[0].benchmarks).map(
                          ([name, score]) => (
                            <div
                              key={name}
                              className="text-xs px-2 py-1 bg-muted rounded flex items-center gap-1"
                            >
                              <span className="text-muted-foreground capitalize">
                                {name.replace(/-/g, ' ')}:
                              </span>
                              <span className="font-medium">{formatPercent(score, 0)}</span>
                            </div>
                          )
                        )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/versions/$version"
                        params={{ version: version.metadata.version }}
                        className="text-xs text-primary hover:underline"
                      >
                        View Details
                      </Link>
                      {prevVersion && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Link
                            to="/compare"
                            search={{
                              from: prevVersion.metadata.version,
                              to: version.metadata.version
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Compare with previous
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
