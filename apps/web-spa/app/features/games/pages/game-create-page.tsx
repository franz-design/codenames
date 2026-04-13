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
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import {
  createGamesApiClient,
  PENDING_REDIRECT_KEY,
  useGameSession,
} from '../index'

const createGameSchema = z.object({
  pseudo: z.string().min(1, 'Le pseudo est requis').max(100, 'Maximum 100 caractères'),
  isPublic: z.boolean(),
  maxPlayers: z.coerce.number().int().min(4, 'Minimum 4 joueurs').max(16, 'Maximum 16 joueurs'),
})

type CreateGameFormData = z.infer<typeof createGameSchema>

export default function GameCreatePage() {
  const navigate = useNavigate()
  const { setSession, hasSession, gameId, playerName } = useGameSession()

  useEffect(() => {
    const pendingGameId = typeof window !== 'undefined' ? sessionStorage.getItem(PENDING_REDIRECT_KEY) : null
    if (hasSession && gameId && pendingGameId === gameId) {
      sessionStorage.removeItem(PENDING_REDIRECT_KEY)
      navigate(`/games/${gameId}`, { replace: true })
    }
  }, [hasSession, gameId, navigate])

  const { mutate: createGame, isPending, error } = useMutation({
    mutationFn: async (data: CreateGameFormData) => {
      const api = createGamesApiClient('')
      const response = await api.createGame({
        pseudo: data.pseudo,
        isPublic: data.isPublic,
        maxPlayers: data.maxPlayers,
      })
      return response
    },
    onSuccess: (response, variables) => {
      const playerNameFromApi = response.game.creatorPseudo?.trim()
      setSession({
        playerId: response.playerId,
        gameId: response.game.id,
        playerName: playerNameFromApi || variables.pseudo,
        creatorToken: response.creatorToken,
      })
      sessionStorage.setItem(PENDING_REDIRECT_KEY, response.game.id)
      navigate(`/games/${response.game.id}`)
    },
  })

  const form = useForm<CreateGameFormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { pseudo: playerName || '', isPublic: false, maxPlayers: 8 },
  })

  const isPublic = form.watch('isPublic')

  const handleSubmit = (data: CreateGameFormData) => {
    createGame(data)
  }

  return (
    <div className="flex flex-grow w-full min-h-full flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-6 max-w-md items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Créer une partie</h1>
          <p className="mt-2 text-muted-foreground">
            Choisissez votre pseudo pour commencer
          </p>
        </div>

        <Form {...form}>
          <form className="flex flex-col gap-6 w-md" onSubmit={form.handleSubmit(handleSubmit)}>
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
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="flex flex-col">
                      <FormLabel htmlFor="isPublic">Partie publique</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        Visible dans le listing des parties en cours
                      </span>
                    </div>
                    <FormControl>
                      <input
                        id="isPublic"
                        type="checkbox"
                        checked={field.value}
                        onChange={event => field.onChange(event.target.checked)}
                        disabled={isPending}
                      />
                    </FormControl>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="maxPlayers">Nombre maximal de joueurs</FormLabel>
                  <FormControl>
                    <Input
                      id="maxPlayers"
                      type="number"
                      min={4}
                      max={16}
                      {...field}
                      value={field.value}
                      disabled={isPending || !isPublic}
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
    </div>
  )
}
