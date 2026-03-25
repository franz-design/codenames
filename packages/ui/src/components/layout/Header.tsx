import { cn } from '@codenames/ui/lib/utils'
import * as React from 'react'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}

export function Header({ className, children, left, right, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'relative w-full flex justify-center p-4',
        className,
      )}
      {...props}
    >
      {left != null
        ? (
            <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center">
              {left}
            </div>
          )
        : null}
      {children}
      {right != null ? <div className="absolute right-4 top-4">{right}</div> : null}
    </header>
  )
}
