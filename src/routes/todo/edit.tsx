import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/todo/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/todo/edit"!</div>
}
