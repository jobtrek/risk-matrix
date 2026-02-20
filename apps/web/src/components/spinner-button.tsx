import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerButton({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="secondary" className="!px-4" size="sm">
        <Spinner data-icon="inline-start" />
        {text ? text : "Loading..."}
      </Button>
    </div>
  )
}
