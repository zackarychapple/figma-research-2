import { createFileRoute } from '@tanstack/react-router'
import { TestCard } from '../TestComponents'

export const Route = createFileRoute('/card')({
  component: TestCard,
})
