export function EmptyState() {
  return (
    <div className="flex aspect-square w-full max-w-[560px] flex-col items-center justify-center justify-self-center rounded-full border-2 border-dashed border-felt-edge">
      <p className="font-display text-xl font-semibold text-ivory-muted">
        No tickets on the table
      </p>
      <p className="mt-2 max-w-[24ch] text-center text-sm text-ivory-muted">
        Loosen the filters to put something on the wheel.
      </p>
    </div>
  )
}
