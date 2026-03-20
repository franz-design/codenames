import type { VariantProps } from 'class-variance-authority'
import { cn } from '@codenames/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-primary-border font-bold hover:bg-primary/90 shadow-[4px_4px_0px_0px_#AEC0E0] relative -top-[2px] -left-[2px] hover:top-0 hover:left-0 hover:shadow-[2px_2px_0px_0px_#AEC0E0] transition-all duration-100',
        red: 'bg-[#DB1C45] text-white border border-[#A11734] font-bold shadow-[4px_4px_0px_0px_#A11734] relative -top-[2px] -left-[2px] hover:top-0 hover:left-0 hover:shadow-[2px_2px_0px_0px_#A11734] transition-all duration-100',
        blue: 'bg-[#6687B7] text-white border border-[#42689F] font-bold shadow-[4px_4px_0px_0px_#42689F] relative -top-[2px] -left-[2px] hover:top-0 hover:left-0 hover:shadow-[2px_2px_0px_0px_#42689F] transition-all duration-100',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-[10px] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-[10px] px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'>
  & VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
