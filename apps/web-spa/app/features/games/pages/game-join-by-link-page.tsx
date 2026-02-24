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
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import {
  createGamesApiClient,
  useGameSession,
} from '../index'

const joinGameSchema = z.object({
  pseudo: z.string().min(1, 'Le pseudo est requis').max(100, 'Maximum 100 caractères'),
})

type JoinGameFormData = z.infer<typeof joinGameSchema>

export default function GameJoinByLinkPage() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const { setSession } = useGameSession()

  const { mutate: joinGame, isPending, error } = useMutation({
    mutationFn: async (data: JoinGameFormData) => {
      if (!gameId)
        throw new Error('Code de partie requis')
      const api = createGamesApiClient('')
      const response = await api.joinGame(gameId, data.pseudo)
      return { ...response, gameId }
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
    defaultValues: { pseudo: '' },
  })

  const handleSubmit = (data: JoinGameFormData) => {
    joinGame(data)
  }

  if (!gameId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Partie introuvable</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Rejoindre la partie</h1>
          <p className="mt-2 text-muted-foreground">
            Entrez votre pseudo pour rejoindre
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
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
      </div>
    </main>
  )
}
