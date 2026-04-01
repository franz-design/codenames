import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router'
import {
  adminWatchGame,
  fetchAdminOngoingGames,
  readAdminTokenFromLocalStorage,
  isAdminSpectatorClientConfigured,
  useGameSession,
} from '../index'

export default function GameAdminOngoingPage() {
  const navigate = useNavigate()
  const { setAdminSpectatorSession } = useGameSession()
  const adminToken = typeof window !== 'undefined' ? readAdminTokenFromLocalStorage() : null
  const isAllowed = isAdminSpectatorClientConfigured()

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['adminOngoingGames', adminToken],
    queryFn: () => fetchAdminOngoingGames(adminToken!),
    enabled: Boolean(isAllowed && adminToken),
  })

  const { mutate: watchGame, isPending } = useMutation({
    mutationFn: async (gameId: string) => {
      const token = readAdminTokenFromLocalStorage()
      if (!token)
        throw new Error('Missing admin token')
      return adminWatchGame(gameId, token)
    },
    onSuccess: (response, gameId) => {
      setAdminSpectatorSession({ playerId: response.playerId, gameId })
      navigate(`/games/${gameId}`)
    },
  })

  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex w-full flex-col items-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <h1 className="text-lg font-semibold text-muted-foreground">Parties non terminées</h1>
        {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Erreur'}
          </p>
        )}
        {games?.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">Aucune partie en cours.</p>
        )}
        <ul className="space-y-2">
          {games?.map(game => (
            <li key={game.id}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                  <CardTitle className="text-base font-medium">
                    {game.creatorPseudo}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {game.status}
                    </span>
                  </CardTitle>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => watchGame(game.id)}
                  >
                    Observer
                  </Button>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="font-mono text-xs text-muted-foreground break-all">{game.id}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
