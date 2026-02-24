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
import { useNavigate } from 'react-router'
import { z } from 'zod'
import {
  createGamesApiClient,
  useGameSession,
} from '../index'

const createGameSchema = z.object({
  pseudo: z.string().min(1, 'Le pseudo est requis').max(100, 'Maximum 100 caractères'),
})

type CreateGameFormData = z.infer<typeof createGameSchema>

export default function GameCreatePage() {
  const navigate = useNavigate()
  const { setSession } = useGameSession()

  const { mutate: createGame, isPending, error } = useMutation({
    mutationFn: async (data: CreateGameFormData) => {
      const api = createGamesApiClient('')
      const response = await api.createGame(data.pseudo)
      return response
    },
    onSuccess: (response) => {
      setSession({
        playerId: response.playerId,
        gameId: response.game.id,
        playerName: response.game.creatorPseudo,
        creatorToken: response.creatorToken,
      })
      navigate(`/games/${response.game.id}`)
    },
  })

  const form = useForm<CreateGameFormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { pseudo: '' },
  })

  const handleSubmit = (data: CreateGameFormData) => {
    createGame(data)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Créer une partie</h1>
          <p className="mt-2 text-muted-foreground">
            Choisissez votre pseudo pour commencer
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
              {isPending ? 'Création...' : 'Créer la partie'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  )
}
