import * as React from 'react'

interface HeaderRightContextValue {
  right: React.ReactNode
  setRight: (node: React.ReactNode) => void
}

const HeaderRightContext = React.createContext<HeaderRightContextValue | null>(
  null,
)

export function HeaderRightProvider({ children }: { children: React.ReactNode }) {
  const [right, setRight] = React.useState<React.ReactNode>(null)
  const value = React.useMemo(
    () => ({ right, setRight }),
    [right],
  )
  return (
    <HeaderRightContext value={value}>
      {children}
    </HeaderRightContext>
  )
}

export function useHeaderRight(): HeaderRightContextValue {
  const ctx = React.use(HeaderRightContext)
  if (!ctx) {
    throw new Error('useHeaderRight must be used within HeaderRightProvider')
  }
  return ctx
}

export function useHeaderRightContent(): React.ReactNode {
  const ctx = React.use(HeaderRightContext)
  return ctx?.right ?? null
}
