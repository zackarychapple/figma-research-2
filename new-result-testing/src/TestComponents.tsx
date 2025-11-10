/**
 * Test page for ShadCN components
 * Renders actual ShadCN components for screenshot comparison
 */

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

export function TestButton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Button>Button</Button>
    </div>
  )
}

export function TestBadge() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Badge variant="destructive">New</Badge>
    </div>
  )
}

export function TestCard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card component with some content</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export function TestInput() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Input
        type="text"
        placeholder="Enter text..."
        className="w-[240px]"
      />
    </div>
  )
}

export function TestDialog() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed with this action?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Export all components as a single object
export const TestComponents = {
  Button: TestButton,
  Badge: TestBadge,
  Card: TestCard,
  Input: TestInput,
  Dialog: TestDialog,
}
