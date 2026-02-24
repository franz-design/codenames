import { Link, useParams } from 'react-router'
import { useGameSession, useGameWebSocket } from '../index'

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { playerName, hasSession } = useGameSession()
  const { gameState, isConnected, error } = useGameWebSocket({
    gameId: gameId ?? null,
    enabled: Boolean(gameId) && hasSession,
  })

  if (!gameId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Partie introuvable</p>
        <Link to="/" className="mt-4 text-sm underline hover:no-underline">
          Retour à l&apos;accueil
        </Link>
      </main>
    )
  }

  if (!hasSession) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Vous devez rejoindre cette partie</p>
        <Link to={`/games/${gameId}/join`} className="mt-4 text-sm underline hover:no-underline">
          Rejoindre la partie
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Partie</h1>
          <span className="text-sm text-muted-foreground">
            {playerName}
          </span>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive">
            {error.message}
          </p>
        )}

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Statut : {isConnected ? 'Connecté' : 'Connexion...'}
          </p>
          {gameState && (
            <p className="mt-2 text-sm">
              État : {gameState.status} — {gameState.players.length} joueur(s)
            </p>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Le lobby et la vue de jeu seront implémentés en Phase 3 et 4.
        </p>

        <p className="text-center text-sm">
          <Link to="/" className="underline hover:no-underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  )
}
