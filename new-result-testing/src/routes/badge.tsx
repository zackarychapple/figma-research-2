import { createFileRoute } from '@tanstack/react-router'
import { TestBadge } from '../TestComponents'

export const Route = createFileRoute('/badge')({
  component: TestBadge,
})
