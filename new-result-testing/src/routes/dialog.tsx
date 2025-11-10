import { createFileRoute } from '@tanstack/react-router'
import { TestDialog } from '../TestComponents'

export const Route = createFileRoute('/dialog')({
  component: TestDialog,
})
