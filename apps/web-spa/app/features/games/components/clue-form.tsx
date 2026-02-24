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
import { cn } from '@codenames/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CLUE_NUMBER_INFINITY } from '../types'

const CLUE_NUMBER_OPTIONS = [
  ...Array.from({ length: 10 }, (_, i) => i),
  CLUE_NUMBER_INFINITY,
] as const

function buildClueSchema(gridWords: string[]) {
  const normalizedGrid = gridWords.map(w => w.toLowerCase().trim())

  return z.object({
    word: z
      .string()
      .min(1, 'L\'indice est requis')
      .max(50, 'Maximum 50 caractères')
      .refine(
        val => !normalizedGrid.includes(val.toLowerCase().trim()),
        'L\'indice ne doit pas être un mot de la grille',
      ),
    number: z
      .number()
      .refine(
        n => (n >= 0 && n <= 9) || n === CLUE_NUMBER_INFINITY,
        'Le nombre doit être entre 0 et 9 ou ∞',
      ),
  })
}

export type ClueFormData = z.infer<ReturnType<typeof buildClueSchema>>

export interface ClueFormProps {
  gridWords: string[]
  onSubmit: (data: ClueFormData) => void
  isPending?: boolean
  disabled?: boolean
}

export function ClueForm({
  gridWords,
  onSubmit,
  isPending = false,
  disabled = false,
}: ClueFormProps) {
  const schema = buildClueSchema(gridWords)
  const form = useForm<ClueFormData>({
    resolver: zodResolver(schema),
    defaultValues: { word: '', number: 1 },
  })

  const handleSubmit = (data: ClueFormData) => {
    onSubmit(data)
    form.reset({ word: '', number: 1 })
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="word"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[140px]">
              <FormLabel htmlFor="clue-word">Mot d&apos;indice</FormLabel>
              <FormControl>
                <Input
                  id="clue-word"
                  {...field}
                  placeholder="Ex: Océan"
                  autoComplete="off"
                  disabled={isPending || disabled}
                  onChange={e => field.onChange(e.target.value.trimStart())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem className="w-50">
              <FormLabel htmlFor="clue-number">Nombre de mots à trouver</FormLabel>
              <FormControl>
                <select
                  id="clue-number"
                  disabled={isPending || disabled}
                  value={field.value}
                  onChange={(e) => {
                    const val = e.target.value
                    field.onChange(
                      val === String(CLUE_NUMBER_INFINITY)
                        ? CLUE_NUMBER_INFINITY
                        : Number.parseInt(val, 10),
                    )
                  }}
                  className={cn(
                    'border-input bg-background/80 backdrop-blur-sm flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                  )}
                >
                  {CLUE_NUMBER_OPTIONS.map(n => (
                    <option key={n} value={n}>
                      {n === CLUE_NUMBER_INFINITY ? '∞' : n}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending || disabled}
          className="shrink-0"
        >
          {isPending ? 'Envoi...' : 'Donner l\'indice'}
        </Button>
      </form>
    </Form>
  )
}
