import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  onValueChange?: (value: string) => void
}

function Input({ className, type, onChange, onValueChange, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className
      )}
      onValueChange={(value, eventDetails) => {
        onValueChange?.(value)
        // Bridge Base UI → native onChange for RHF / existing controlled inputs
        if (onChange) {
          const nativeEvent = eventDetails?.event
          const target =
            (nativeEvent?.target as HTMLInputElement | null) ||
            ({ value } as HTMLInputElement)
          onChange({
            target,
            currentTarget: target,
          } as React.ChangeEvent<HTMLInputElement>)
        }
      }}
      {...props}
    />
  )
}

export { Input }
