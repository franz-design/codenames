import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { fetchPublicOngoingGames } from '../index'

export default function GameHomePage() {
  const { data: publicGames, isLoading, isError } = useQuery({
    queryKey: ['publicGames'],
    queryFn: () => fetchPublicOngoingGames(),
  })

  return (
    <div className="w-full flex flex-col gap-8 items-center justify-center px-12">
      <div className="w-full max-w-5xl flex flex-col gap-8 lg:flex-row">
        <Card className="w-full lg:flex-1 lg:basis-0">
          <CardHeader>
            <CardTitle>Nouvelle partie</CardTitle>
            <CardDescription>
              Créez une partie et partagez le code avec vos amis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link to="/games/new">Créer une partie</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full lg:flex-1 lg:basis-0">
          <CardHeader>
            <CardTitle>Rejoindre une partie</CardTitle>
            <CardDescription>
              Entrez le code de la partie pour rejoindre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link to="/games/join">Rejoindre une partie</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Parties publiques en cours</CardTitle>
          <CardDescription>
            Rejoignez une partie publique ouverte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {isError && <p className="text-sm text-destructive">Impossible de charger les parties publiques.</p>}
          {!isLoading && !isError && (publicGames?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Aucune partie publique en cours.</p>
          )}
          {(publicGames ?? []).map(game => {
            const isFull = game.currentPlayersCount >= game.maxPlayers
            return (
              <div key={game.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="flex flex-col">
                  <p className="font-medium">{game.creatorPseudo}</p>
                  <p className="text-xs text-muted-foreground">
                    {game.status === 'LOBBY' ? 'Lobby' : 'En cours'} - {game.currentPlayersCount}/{game.maxPlayers} joueurs
                  </p>
                </div>
                <Button asChild disabled={isFull}>
                  <Link to={`/games/${game.id}/join`}>{isFull ? 'Complet' : 'Rejoindre'}</Link>
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
