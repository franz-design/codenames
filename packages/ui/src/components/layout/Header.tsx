import { cn } from '@codenames/ui/lib/utils'
import * as React from 'react'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  right?: React.ReactNode
}

export function Header({ className, children, right, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'w-full flex justify-center p-4',
        className,
      )}
      {...props}
    >
      {children}
      {right != null ? <div className="absolute right-4 top-4">{right}</div> : null}
    </header>
  )
}
