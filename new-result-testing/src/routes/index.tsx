import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-8 p-8">
      <h1 className="text-2xl font-bold">ShadCN Component Test Suite</h1>
      <div className="flex flex-col gap-4">
        <Link to="/button" className="text-blue-600 hover:underline">
          Button Test
        </Link>
        <Link to="/badge" className="text-blue-600 hover:underline">
          Badge Test
        </Link>
        <Link to="/card" className="text-blue-600 hover:underline">
          Card Test
        </Link>
        <Link to="/input" className="text-blue-600 hover:underline">
          Input Test
        </Link>
        <Link to="/dialog" className="text-blue-600 hover:underline">
          Dialog Test
        </Link>
        <Link to="/button-playground" className="text-green-600 hover:underline font-semibold">
          Button Playground (Generated from Figma)
        </Link>
        <Link to="/dora-metrics" className="text-purple-600 hover:underline font-semibold">
          DORA Metrics Dashboard (From Figma Design)
        </Link>
      </div>
    </div>
  )
}
