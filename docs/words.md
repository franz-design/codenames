# Words

Labels on the grid come from **seeded categories** plus an optional **custom pool** the host sends when starting a round.

## Categories (packs)

Persisted slugs (`word_category` + `word` rows):

| Slug | Role |
|------|------|
| `base` | Default pack if none is selected |
| `music-artists-fr` | French-language artists |
| `music-artists-intl` | International artists |
| `films-series` | Films and series |

**Virtual pack** `music-artists-mixed`: not a DB row. Draw expands it to FR + international artist categories.

Lobby UI can send `wordCategorySlug` or `wordCategorySlugs` on `POST /api/games/:id/rounds/start`. Multiple slugs are unioned, then expanded.

## Draw

`WordsService.getRandomWords` (also `GET /api/words/random?count=&categorySlug=`):

1. Normalize custom labels: trim, drop empty, **dedupe** with `fr-FR` lowercasing, keep first spelling.
2. Resolve category slugs (default `base`).
3. Load all labels in those categories.
4. Sample with `sampleBiasedWordLabels` when custom words are present; otherwise unique random labels from the category pool.

If the combined unique pool is smaller than `count`, the API returns 400 (`Not enough unique words in the selected pool`).

Default `count` for a round is **25**. Card **colors** are generated for a standard 25-cell layout (`generateGridResults`). Keep `wordCount` at 25 unless you change coloring as well.

## Custom pool

- Max **400** strings, each max **40** characters (API).
- Sent as `customWords` on start; **not** stored on the game row.
- The SPA keeps a local list (`localStorage` key `codenames.custom-word-list`) and a lobby dialog to edit it. The dialog accepts a comma- and/or newline-separated list (Ajouter splits, trims, silently drops empty / over-40 / duplicate / overflow past 400 labels).

Bias when mixing custom + pack labels (`customWordQuota`):

- Fewer than 10 custom words → aim to reserve ~60% of the grid from custom (at least 1, at most `count`).
- 10–29 → ~40%.
- 30+ → ~30%.

Reserved custom words are sampled first, then pack labels (excluding the same normalized keys), then leftover custom words if the grid is still short. Final order is shuffled.

Custom-only labels appear in the random-words payload as category slug `custom` (synthetic UUID). Round start only persists **string labels** on the `Round` entity, not those ids.
