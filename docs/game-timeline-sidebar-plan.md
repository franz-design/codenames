# Plan d'action : Sidebar historique + chat in-game

**Documents de référence :** [game-backend-plan.md](./game-backend-plan.md), [game-frontend-plan.md](./game-frontend-plan.md), [common.mdc](../.cursor/rules/common.mdc), [front.mdc](../.cursor/rules/front.mdc)

---

## Vue d'ensemble

La sidebar doit contenir :

1. **Historique des actions** : événements de jeu (changement de tour, don d'indice, clics sur les cartes, etc.)
2. **Chat in-game** : les joueurs peuvent échanger par écrit dans cette zone
3. **Timeline unifiée** : actions et messages de chat intercalés par timestamp, du plus ancien en haut au plus récent en bas

---

## Todo list

### Phase Backend

- [x] **B.1** Ajouter le type `CHAT_MESSAGE` dans `game-event.types.ts` avec payload `{ playerId, playerName, content }`
- [x] **B.2** Implémenter `POST /games/:id/chat` dans le controller et le service
- [x] **B.3** Implémenter `GET /games/:id/timeline` (events + chat, pagination optionnelle)
- [x] **B.4** Émettre `game:timeline-item` via WebSocket pour chaque nouvel event (y compris chat)

### Phase Frontend

- [x] **F.1** Régénérer le client OpenAPI (`pnpm generate`) — non nécessaire (client API personnalisé)
- [x] **F.2** Créer le hook `useGameTimeline` (fetch initial + écoute WebSocket `game:timeline-item`)
- [x] **F.3** Créer le composant `GameTimelineItem` (formatage event vs chat)
- [x] **F.4** Créer le composant `GameChatInput`
- [x] **F.5** Créer le composant `GameTimelineSidebar`
- [x] **F.6** Intégrer la sidebar dans `GamePlayView` (layout avec zone principale + sidebar)

---

## Détail des phases

### Phase Backend

#### B.1 Type CHAT_MESSAGE

- **Fichier** : `apps/api/src/modules/games/game-event.types.ts`
- **Payload** : `{ playerId: string, playerName: string, content: string }`
- **Stockage** : `GameEvent` avec `eventType: CHAT_MESSAGE`, `roundId` null (chat au niveau game)

#### B.2 Endpoint POST /games/:id/chat

| Méthode | Route | Action |
|---------|-------|--------|
| POST | `/games/:id/chat` | Envoyer un message (body: `{ content: string }`, header: `X-Player-Id`) |

- Créer un `GameEvent` de type `CHAT_MESSAGE`
- Persister, puis émettre via WebSocket

#### B.3 Endpoint GET /games/:id/timeline

| Méthode | Route | Action |
|---------|-------|--------|
| GET | `/games/:id/timeline` | Récupérer la timeline (events + chat) |

- **Paramètres** : `limit`, `offset` (pagination)
- **Requête** : `WHERE gameId = ? ORDER BY createdAt ASC`
- **Réponse** : liste d'items avec `id`, `type` (`event` | `chat`), `eventType`, `payload`, `triggeredBy`, `createdAt`, `playerName`

#### B.4 WebSocket game:timeline-item

- Émettre `game:timeline-item` à chaque nouvel event (actions de jeu + chat)
- Permet au client d'ajouter l'item sans refetch

---

### Phase Frontend

#### Structure des composants

```
app/features/games/
├── components/
│   ├── game-timeline-sidebar.tsx
│   ├── game-timeline-item.tsx
│   ├── game-chat-input.tsx
│   └── ...
```

#### Formatage des événements en texte

| EventType | Exemple de texte |
|-----------|------------------|
| `ROUND_STARTED` | Tour de l'équipe rouge |
| `CLUE_GIVEN` | Marie a donné l'indice « camion » pour 3 mots |
| `WORD_SELECTED` | Paul a cliqué sur « Voiture » |
| `WORD_HIGHLIGHTED` | Max a mis en avant « Roue » |
| `TURN_PASSED` | Tour de l'équipe bleue |
| `CHAT_MESSAGE` | Marie : Bonne chance ! |

#### Schéma TimelineItem

```ts
interface TimelineItem {
  id: string
  type: 'event' | 'chat'
  eventType?: GameEventType
  payload: Record<string, unknown>
  triggeredBy: string | null
  playerName?: string
  createdAt: string
}
```

---

## Points d'attention

1. **Contexte pour les events** : pour `WORD_SELECTED` et `WORD_HIGHLIGHTED`, le mot vient de `round.words[wordIndex]` — à inclure dans le payload ou déduire côté front via `gameState.currentRound.words`
2. **Validation chat** : limiter la longueur (ex. 500 caractères)
3. **Performance** : pagination ou limite (ex. 100 derniers items)
4. **Responsive** : sidebar repliable ou en dessous sur mobile
5. **Accessibilité** : labels, focus, annonces pour nouveaux messages
