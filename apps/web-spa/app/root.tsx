import type { Route } from './+types/root'
import { client } from '@codenames/openapi-generator'
import { Header } from '@codenames/ui/components/layout/Header'
import { TooltipProvider } from '@codenames/ui/components/primitives/tooltip'
import { User } from '@codenames/ui/icons'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { Toaster } from 'sonner'
import { useGameSession } from '@/features/games/hooks/use-game-session'
import { authClient } from '@/lib/auth-client'
import { queryClient } from '@/lib/query-client'
import { HeaderRightProvider, useHeaderRightContent } from './contexts/header-right-context'
import useTheme from './hooks/useTheme'
import '@fontsource/source-sans-pro'
import '@codenames/ui/globals.css'

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
})

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme()

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <html lang="en">
      <head>
        <title>Dashboard</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Lonestone" />
        <meta
          name="keywords"
          content="Lonestone, platform, create, share, ideas"
        />

        <meta
          name="description"
          content="Lonestone is a platform for creating and sharing your ideas."
        />
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

function AppHeader() {
  const headerRight = useHeaderRightContent()
  const { data: session } = authClient.useSession()
  const { playerName } = useGameSession()

  const displayName = useMemo(() => {
    const authName = session?.user?.name?.trim()
    if (authName)
      return authName
    const email = session?.user?.email?.trim()
    if (email)
      return email
    const fromGame = playerName?.trim()
    if (fromGame)
      return fromGame
    return null
  }, [playerName, session?.user?.email, session?.user?.name])

  const headerLeft = displayName
    ? (
        <span className="flex max-w-[min(14rem,calc(100vw-12rem))] items-center gap-2 text-sm font-medium text-foreground">
          <User className="size-4 shrink-0 opacity-80" aria-hidden />
          <span className="truncate" title={displayName}>
            {displayName}
          </span>
        </span>
      )
    : null

  return (
    <Header left={headerLeft} right={headerRight}>
      <Link
        to="/"
        className="text-xl font-bold tracking-tight transition-colors"
      >
        <div className="flex items-center justify-between gap-4 py-2 px-6 bg-white border rounded-xl shadow-[4px_4px_0px_0px_#AEC0E0] -rotate-2">
          <span className="rotate-2">codenames</span>
        </div>
      </Link>
    </Header>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HeaderRightProvider>
          <AppHeader />
          <main className="h-full flex flex-grow">
            <Outlet />
          </main>
        </HeaderRightProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details
      = error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
