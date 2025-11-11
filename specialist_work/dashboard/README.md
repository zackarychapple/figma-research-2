# Agent Specialist Dashboard

A React-based dashboard for tracking and comparing agent specialist versions, their configurations, and performance scores over time.

## Features

- **Version List**: Browse all agent specialist versions with scores and changes
- **Version Details**: View complete configuration and benchmark scores for any version
- **Version Comparison**: Compare two versions side-by-side with diff visualization
- **Timeline View**: Visualize score progression over time with interactive charts
- **Diff Engine**: Automatic detection of configuration changes between versions
- **Score Tracking**: Track improvements and regressions across benchmarks

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Rsbuild** - Fast build tool
- **TanStack Router** - Type-safe routing
- **Recharts** - Data visualization
- **Tailwind CSS v4** - Styling
- **jsondiffpatch** - Diff computation
- **JSON5** - Configuration parsing
- **semver** - Version sorting

## Getting Started

### Installation

```bash
cd specialist_work/dashboard
pnpm install
```

### Development

```bash
pnpm dev
```

The dashboard will open at `http://localhost:3001`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── charts/         # Chart components
│   │   ├── version/        # Version-related components
│   │   └── diff/           # Diff visualization components
│   ├── lib/                # Utility functions
│   │   ├── data-loader.ts  # Load agent specialist snapshots
│   │   ├── diff-engine.ts  # Compute version diffs
│   │   └── utils.ts        # General utilities
│   ├── types/              # TypeScript type definitions
│   │   ├── snapshot.ts     # Agent specialist types
│   │   └── diff.ts         # Diff types
│   ├── routes/             # TanStack Router routes
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Version list page
│   │   ├── versions.$version.tsx  # Version detail page
│   │   ├── compare.tsx     # Comparison page
│   │   └── timeline.tsx    # Timeline page
│   ├── App.tsx             # App root component
│   ├── index.tsx           # Entry point
│   ├── index.css           # Global styles
│   └── router.tsx          # Router configuration
├── public/                 # Static assets
├── package.json
├── tsconfig.json
└── rsbuild.config.ts
```

## Pages

### Version List (`/`)

The landing page displays a table of all agent specialist versions with:
- Version number
- Date created
- Overall score
- Score change from previous version
- Quick actions (View Details, Compare)

### Version Detail (`/versions/:version`)

Detailed view of a single version showing:
- Performance scores (overall and per-benchmark)
- Metadata (name, license, availability)
- Persona (purpose, values, attributes, tech stack)
- Capabilities (tags, descriptions, considerations)

### Compare (`/compare?from=X&to=Y`)

Side-by-side comparison of two versions with:
- Summary of changes
- Overall score change
- Benchmark score changes
- Configuration changes (added, removed, modified)
- Visual diff highlighting

### Timeline (`/timeline`)

Chronological view with:
- Line chart showing score progression
- Visual timeline of all versions
- Score trends for each benchmark
- Quick access to details and comparisons

## Data Format

The dashboard expects agent specialist snapshots in JSON5 format with the following structure:

```typescript
interface AgentSpecialistSnapshot {
  schema_version: string;
  name: string;
  displayName: string;
  version: string; // semver format
  from: string; // base template

  persona: {
    purpose: string;
    values: string[];
    attributes: string[];
    tech_stack: string[];
  };

  capabilities: {
    tags: string[];
    descriptions: Record<string, string>;
    considerations: string[];
  };

  benchmarks: {
    test_suites: Array<{
      name: string;
      path: string;
      type: string;
    }>;
    scoring: {
      methodology: string;
      update_frequency: string;
    };
  };

  preferred_models: Array<{
    model: string;
    weight: number;
    benchmarks: Record<string, number>;
  }>;

  timestamp: number;
  license: string;
  availability: string;
}
```

## Sample Data

The dashboard currently includes sample data for development and demonstration purposes. In production, this would be replaced with:

1. File system loader to read JSON5 snapshot files
2. API integration to fetch snapshots from a backend
3. Real-time updates when new benchmarks complete

## Customization

### Adding New Routes

1. Create a new file in `src/routes/`
2. Export a route using `createFileRoute`
3. The route will be automatically included in the route tree

### Adding New Visualizations

1. Create components in `src/components/charts/`
2. Use Recharts for data visualization
3. Import and use in route components

### Styling

The dashboard uses Tailwind CSS v4 with a custom theme. Modify `src/index.css` to customize:
- Colors
- Border radius
- Spacing
- Typography

## Development Notes

### Type Safety

All routes and navigation are fully type-safe thanks to TanStack Router's automatic type generation.

### Route Generation

TanStack Router automatically generates `routeTree.gen.ts` based on files in the `src/routes/` directory.

### Performance

- Routes use loaders for data fetching
- Navigation is preloaded on intent
- Charts are lazily rendered

## Future Enhancements

- [ ] Add filters and search to version list
- [ ] Export comparison reports as PDF/JSON
- [ ] Radar chart for multi-dimensional comparison
- [ ] Dark mode toggle
- [ ] Real-time updates via WebSocket
- [ ] Multi-specialist comparison
- [ ] Historical data import
- [ ] Cost analysis per version
- [ ] Performance metrics tracking

## License

MIT

## Contributing

This dashboard is part of the agent specialist development workflow. To contribute:

1. Ensure TypeScript types are properly defined
2. Follow the existing code structure
3. Add tests for new features
4. Update documentation

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
