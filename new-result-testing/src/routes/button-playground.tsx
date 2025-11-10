import { createFileRoute } from '@tanstack/react-router'
import { ButtonPlayground } from '../components/ButtonPlayground'

export const Route = createFileRoute('/button-playground')({
  component: ButtonPlayground,
})
