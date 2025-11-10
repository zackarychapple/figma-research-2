import { createFileRoute } from '@tanstack/react-router'
import { DoraMetricsDashboard } from '../components/DoraMetricsDashboard'

export const Route = createFileRoute('/dora-metrics')({
  component: DoraMetricsDashboard,
})
