import { Button } from '@codenames/ui/components/primitives/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@codenames/ui/components/primitives/form'
import { Input } from '@codenames/ui/components/primitives/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import {
  createGamesApiClient,
  useGameSession,
} from '../index'

const joinGameSchema = z.object({
  gameId: z.string().uuid('Code de partie invalide'),
  pseudo: z.string().min(1, 'Le pseudo est requis').max(100, 'Maximum 100 caractères'),
})

type JoinGameFormData = z.infer<typeof joinGameSchema>

export default function GameJoinPage() {
  const navigate = useNavigate()
  const { setSession } = useGameSession()

  const { mutate: joinGame, isPending, error } = useMutation({
    mutationFn: async (data: JoinGameFormData) => {
      const api = createGamesApiClient('')
      const response = await api.joinGame(data.gameId, data.pseudo)
      return { ...response, gameId: data.gameId }
    },
    onSuccess: (response, variables) => {
      setSession({
        playerId: response.playerId,
        gameId: response.gameId,
        playerName: variables.pseudo,
      })
      navigate(`/games/${response.gameId}`)
    },
  })

  const form = useForm<JoinGameFormData>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: { gameId: '', pseudo: '' },
  })

  const handleSubmit = (data: JoinGameFormData) => {
    joinGame(data)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Rejoindre une partie</h1>
          <p className="mt-2 text-muted-foreground">
            Entrez le code de la partie et votre pseudo
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="gameId">Code de la partie</FormLabel>
                  <FormControl>
                    <Input
                      id="gameId"
                      {...field}
                      placeholder="ex: 550e8400-e29b-41d4-a716-446655440000"
                      autoComplete="off"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pseudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="pseudo">Pseudo</FormLabel>
                  <FormControl>
                    <Input
                      id="pseudo"
                      {...field}
                      placeholder="Votre pseudo"
                      autoComplete="username"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm font-medium text-destructive">
                {error instanceof Error ? error.message : 'Une erreur est survenue'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Connexion...' : 'Rejoindre la partie'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="underline hover:no-underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  )
}
