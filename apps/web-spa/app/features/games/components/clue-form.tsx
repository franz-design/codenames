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

  const isFormValid = form.formState.isValid

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
            <FormItem className="min-w-[140px] flex-grow">
              <FormLabel htmlFor="clue-word">Indice</FormLabel>
              <FormControl>
                <Input
                  id="clue-word"
                  {...field}
                  placeholder="Ex: Océan"
                  autoComplete="off"
                  disabled={isPending || disabled}
                  onChange={e => field.onChange(e.target.value.trimStart())}
                  maxLength={32}
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
            <FormItem className="min-w-0 sm:max-w-xl">
              <FormLabel>Nombre de mots à trouver</FormLabel>
              <FormControl>
                <input
                  type="hidden"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                />
              </FormControl>
              <div className="flex flex-wrap gap-2">
                {CLUE_NUMBER_OPTIONS.map((n) => {
                  const isSelected = field.value === n
                  const label = n === CLUE_NUMBER_INFINITY ? '∞' : String(n)
                  return (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      disabled={isPending || disabled}
                      aria-pressed={isSelected}
                      aria-label={
                        n === CLUE_NUMBER_INFINITY
                          ? 'Infini'
                          : `${n} mot${n > 1 ? 's' : ''}`
                      }
                      onClick={() => {
                        field.onChange(n)
                      }}
                      className={cn('transition-all duration-200 w-8 bg-white hover:bg-blue-dark hover:text-white hover:-left-[2px] hover:-top-[2px] hover:shadow-[4px_4px_0px_0px_#AEC0E0]', {
                        'bg-blue-dark text-white -left-0 -top-0 shadow-[2px_2px_0px_0px_#AEC0E0] hover:-left-0 hover:-top-0 hover:shadow-[2px_2px_0px_0px_#AEC0E0]': isSelected,
                      })}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending || disabled || !isFormValid}
          className="shrink-0"
        >
          Donner l'indice
        </Button>
      </form>
    </Form>
  )
}
