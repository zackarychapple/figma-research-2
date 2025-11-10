import { createFileRoute } from '@tanstack/react-router'
import { TestButton } from '../TestComponents'

export const Route = createFileRoute('/button')({
  component: TestButton,
})
