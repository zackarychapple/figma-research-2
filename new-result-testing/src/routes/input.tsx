import { createFileRoute } from '@tanstack/react-router'
import { TestInput } from '../TestComponents'

export const Route = createFileRoute('/input')({
  component: TestInput,
})
