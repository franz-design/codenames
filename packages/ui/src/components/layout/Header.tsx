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
        'top-0 z-50 w-full p-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 p-2 bg-white border rounded-xl shadow-[4px_4px_0px_0px_#AEC0E0]">
        <div className="flex min-w-0 flex-1 items-center justify-center">
          {children}
        </div>
        {right != null ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  )
}
