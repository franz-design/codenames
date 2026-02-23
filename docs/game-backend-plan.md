# Plan d'action – Backend Codenames

Ce document décrit le plan de mise en place de la partie backend du jeu Codenames, avec une todo list pour le suivi.

**Architecture** : Event-sourcing. Les événements sont la source de vérité. L'état de la partie est calculé en rejouant les événements. Indexation par `gameId` et `roundId` pour des requêtes efficaces.

**Règles du jeu** : Consulter [rules.md](./rules.md) pour les règles officielles de Codenames. Garder ces règles à l'esprit lors du développement de la logique (game-core, validation des actions, calcul d'état).

---

## Todo list

### Phase 1 : Event store et logique de calcul d'état

- [ ] **1.1** Créer l'entité GameEvent avec index sur gameId et roundId
- [ ] **1.2** Définir les types d'événements et leurs payloads JSON dédiés
- [ ] **1.3** Créer `game-core.logic.ts` : `applyEvent`, `computeGameState(events)`, `generateGridResults`
- [ ] **1.4** Créer la migration MikroORM pour le schéma events

### Phase 2 : Entités minimales et module Games

- [ ] **2.1** Simplifier Game et Round (données immuables uniquement)
- [ ] **2.2** Supprimer le module Rounds autonome
- [ ] **2.3** Implémenter GamesService : actions = création d'events + recalcul état
- [ ] **2.4** Implémenter les endpoints REST et contrats Zod

### Phase 3 : WebSockets et événements temps réel

- [ ] **3.1** Installer et configurer @nestjs/websockets et @nestjs/platform-socket.io
- [ ] **3.2** Créer GamesGateway avec rooms par partie
- [ ] **3.3** Émettre `game:state` après chaque event (état recalculé)
- [ ] **3.4** Implémenter l'authentification WebSocket (Better Auth)

### Phase 4 : Feature highlight et intégration

- [ ] **4.1** Implémenter les events WORD_HIGHLIGHTED et WORD_UNHIGHLIGHTED
- [ ] **4.2** Intégrer les highlights dans le calcul d'état (Map wordIndex → players)
- [ ] **4.3** Mettre à jour AppModule et GamesModule
- [ ] **4.4** Écrire les tests unitaires et e2e

---

## Architecture event-sourcing

### Principe

- **Source de vérité** : les événements (`GameEvent`).
- **État** : calculé en rejouant les événements (ou en appliquant incrémentalement).
- **Indexation** : `gameId` + `roundId` pour récupérer rapidement les events d'une partie ou d'un round.
- **WebSocket** : après chaque event, recalcul de l'état → émission `game:state` à tous les joueurs de la room.

### Exemple de flux

1. Joueur rejoint et choisit son équipe → event `PLAYER_CHOSE_SIDE` avec payload `{ playerId, playerName, side }`.
2. Service : persiste l'event, recharge les events du game, recalcule l'état.
3. Gateway : émet `game:state` (état recalculé) à la room.
4. Tous les joueurs reçoivent l'état à jour (équipes, rôles, etc.) et l'app s'affiche correctement.

---

## Phase 1 : Event store et logique de calcul d'état

### 1.1 Entité GameEvent

**Emplacement** : `apps/api/src/modules/games/entities/game-event.entity.ts`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | Clé primaire |
| `gameId` | uuid | **Index** – filtre par partie |
| `roundId` | uuid (nullable) | **Index** – filtre par round (null = event au niveau game) |
| `eventType` | enum/string | Type d'événement |
| `payload` | jsonb | Objet JSON custom par type d'event |
| `triggeredBy` | uuid (nullable) | Joueur à l'origine de l'event |
| `createdAt` | timestamp | Ordre de traitement |

**Index composites** : `(gameId, createdAt)`, `(gameId, roundId, createdAt)` pour des requêtes efficaces.

**Requêtes typiques** :

- État complet d'une partie : `WHERE gameId = ? ORDER BY createdAt ASC`
- État d'un round spécifique : `WHERE gameId = ? AND (roundId = ? OR roundId IS NULL) ORDER BY createdAt ASC` (events game-level + round-level)

### 1.2 Types d'événements et payloads JSON

#### Events au niveau Game (`roundId = null`)

| EventType | Payload | Description |
|-----------|---------|-------------|
| `GAME_CREATED` | `{ createdById }` | Création de la partie |
| `PLAYER_JOINED` | `{ playerId, playerName }` | Un joueur rejoint la partie |
| `PLAYER_LEFT` | `{ playerId }` | Un joueur quitte la partie |
| `PLAYER_CHOSE_SIDE` | `{ playerId, playerName, side }` | Joueur rejoint une équipe (red/blue) |
| `PLAYER_DESIGNATED_SPY` | `{ playerId, playerName, side }` | Joueur se désigne espion pour son équipe |
| `GAME_FINISHED` | `{ winningSide?, losingSide? }` | Fin de partie (winningSide si victoire, losingSide si mot noir) |
| `GAME_RESTARTED` | `{}` | Nouvelle partie (changement de rôles) |

#### Events au niveau Round (`roundId` défini)

| EventType | Payload | Description |
|-----------|---------|-------------|
| `ROUND_STARTED` | `{ words, results, order, startingSide }` | Début du round, grille et équipe qui commence |
| `CLUE_GIVEN` | `{ word, number }` | Indice donné par l'espion |
| `WORD_SELECTED` | `{ wordIndex, cardType }` | Mot sélectionné (révèle le type pour l'affichage) |
| `WORD_HIGHLIGHTED` | `{ wordIndex, playerId, playerName }` | Joueur met en avant un mot (pré-sélection) |
| `WORD_UNHIGHLIGHTED` | `{ wordIndex, playerId }` | Joueur retire son highlight d'un mot |
| `TURN_PASSED` | `{}` | Équipe passe le tour (« Fini de deviner ») |

### 1.3 Fichier `game-core.logic.ts`

**Emplacement** : `apps/api/src/modules/games/game-core.logic.ts`

> **Référence** : S'appuyer sur [rules.md](./rules.md) pour implémenter la logique (types de cartes, fin de tour, nombre de devinettes = indice + 1, victoire/défaite, etc.).

**Responsabilités :**

- `generateGridResults(order: number): CardType[]` – génère la grille (1 noir, 7 neutres, 8/9 rouge, 9/8 bleu).
- `applyEvent(state: GameState, event: GameEvent): GameState` – applique un event de manière incrémentale.
- `computeGameState(events: GameEvent[]): GameState` – calcule l'état en rejouant tous les events.
- `checkGameOver(state): { isOver, winningSide?, losingSide? }` – détecte la fin de partie.
- `canPerformAction(state, action, playerId): boolean` – validation des actions.

**Structure de GameState (calculée) :**

```ts
interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED'
  players: { id, name, side?, isSpy? }[]
  currentRound?: { id, words, results, order, currentTurn, currentClue?, guessesRemaining, revealedWords, highlights }
  winningSide?: Side
  losingSide?: Side
}
```

**Highlights** : `highlights` = `Map<wordIndex, { playerId, playerName }[]>` – pour chaque mot, la liste des joueurs qui l'ont mis en avant. Affichage côté app : pseudo du joueur sur les cartes highlightées.

---

## Phase 2 : Entités minimales et module Games

### 2.1 Entités Game et Round (données immuables)

**Game** : `id`, `createdBy`, `createdAt`. Pas de status/winningSide – tout vient des events.

**Round** : `id`, `gameId`, `order`, `words[]`, `results[]`, `createdAt`. Données de grille uniquement. Le round est créé à `ROUND_STARTED` ; tout le reste (tour, indice, révélations) vient des events.

**Suppression** : `GamePlayer` en tant qu'entité persistée. Les joueurs et leurs rôles sont dérivés des events `PLAYER_JOINED`, `PLAYER_CHOSE_SIDE`, `PLAYER_DESIGNATED_SPY`, `PLAYER_LEFT`.

### 2.2 Suppression du module Rounds autonome

- Supprimer `RoundsModule`, `RoundsController`, `RoundsService`.
- Déplacer l'entité Round dans le module Games (ou la garder comme référence pour les grilles).
- Mettre à jour `AppModule`.

### 2.3 Endpoints REST (actions = création d'event)

Chaque action crée un event, le persiste, recalcule l'état, et le Gateway émet `game:state`.

| Méthode | Route | Action | Event créé |
|---------|-------|--------|------------|
| POST | `/games` | Créer une partie | `GAME_CREATED` |
| GET | `/games/:id` | Infos de base (createdBy, etc.) | - |
| GET | `/games/:id/state` | État calculé à partir des events | - |
| POST | `/games/:id/join` | Rejoindre | `PLAYER_JOINED` |
| DELETE | `/games/:id/leave` | Quitter | `PLAYER_LEFT` |
| PATCH | `/games/:id/players/me/side` | Choisir son équipe | `PLAYER_CHOSE_SIDE` |
| PATCH | `/games/:id/players/me/spy` | Se désigner espion | `PLAYER_DESIGNATED_SPY` |
| POST | `/games/:id/rounds/start` | Démarrer un round | `ROUND_STARTED` (+ création Round) |
| POST | `/games/:id/rounds/current/clue` | Donner un indice | `CLUE_GIVEN` |
| POST | `/games/:id/rounds/current/select` | Sélectionner un mot | `WORD_SELECTED` |
| POST | `/games/:id/rounds/current/highlight` | Mettre en avant un mot | `WORD_HIGHLIGHTED` |
| DELETE | `/games/:id/rounds/current/highlight/:wordIndex` | Retirer son highlight | `WORD_UNHIGHLIGHTED` |
| POST | `/games/:id/rounds/current/pass` | Passer le tour | `TURN_PASSED` |
| POST | `/games/:id/restart` | Nouvelle partie | `GAME_RESTARTED` |

### 2.4 Contrats (Zod)

- `getGameStateSchema` : état complet (players, currentRound avec words, results, revealedWords, highlights, currentTurn, currentClue, guessesRemaining).
- `giveClueSchema` : `{ word: string, number: number }`.
- `selectWordSchema` : `{ wordIndex: number }`.
- `highlightWordSchema` : `{ wordIndex: number }` (ou dans l'URL).
- `startRoundSchema` : `{ wordCount?: 25 }`.

---

## Phase 3 : WebSockets et événements temps réel

### 3.1 Configuration

- Ajouter `@nestjs/websockets` et `@nestjs/platform-socket.io`.
- Créer un `GamesGateway` dans le module Games.
- Rooms : une room par game (`game:${gameId}`).
- Authentification : vérifier la session (Better Auth) avant d'accepter la connexion.

### 3.2 Événement unique émis : `game:state`

**Principe** : Après chaque action (event persisté), le service recalcule l'état et le Gateway émet `game:state` à toute la room. Les clients n'ont qu'à écouter ce seul événement pour mettre à jour l'UI.

| Payload | Contenu |
|---------|---------|
| `game:state` | État complet recalculé (players, currentRound, highlights, etc.) |

Pas besoin d'événements séparés (`round:clue`, `round:word:revealed`, etc.) : tout est dans l'état. Optionnellement, on peut aussi émettre l'event brut (`game:event`) pour des optimisations côté client (mise à jour incrémentale sans recharger tout l'état).

### 3.3 Événements reçus (clients → server)

Les actions peuvent passer par REST ou WebSocket. Si tout passe par WebSocket :

- `game:join` : rejoindre la room du jeu (pour recevoir les mises à jour).
- `game:action` : payload `{ action: 'giveClue' | 'selectWord' | 'highlight' | 'unhighlight' | 'pass', ... }` avec les paramètres.

Le Gateway appelle le `GamesService` qui crée l'event, persiste, recalcule l'état, et émet `game:state` à la room.

---

## Phase 4 : GamesService – orchestration

### 4.1 Structure du service

```
GamesService
├── createGame → GAME_CREATED
├── getGame, getGameState (charge events, computeGameState)
├── joinGame → PLAYER_JOINED
├── leaveGame → PLAYER_LEFT
├── chooseSide → PLAYER_CHOSE_SIDE
├── designateSpy → PLAYER_DESIGNATED_SPY
├── startRound → ROUND_STARTED (+ création Round)
├── giveClue → CLUE_GIVEN
├── selectWord → WORD_SELECTED
├── highlightWord → WORD_HIGHLIGHTED
├── unhighlightWord → WORD_UNHIGHLIGHTED
├── passTurn → TURN_PASSED
├── restartGame → GAME_RESTARTED
└── (privé) persistEvent, loadEvents, emitStateToRoom
```

### 4.2 Flux commun à chaque action

1. Valider l'action (via `game-core.canPerformAction`).
2. Créer l'event avec le payload dédié.
3. Persister l'event (index gameId, roundId).
4. Charger les events du game (et round si pertinent).
5. Recalculer l'état via `computeGameState(events)`.
6. Émettre `game:state` à la room WebSocket.

### 4.3 Feature Highlight

**Règle** : Un joueur peut highlight/unhighlight des mots uniquement quand c'est au tour de son équipe (et qu'il n'est pas espion).

**Comportement** :

- `WORD_HIGHLIGHTED` : le joueur met en avant un mot. Côté app, le pseudo du joueur s'affiche sur la carte.
- Plusieurs joueurs peuvent highlight le même mot (liste de pseudos).
- Un joueur peut highlight plusieurs mots.
- `WORD_UNHIGHLIGHTED` : le joueur retire son highlight d'un mot.
- Les highlights sont recalculés à partir des events `WORD_HIGHLIGHTED` / `WORD_UNHIGHLIGHTED` dans l'état.

**Structure dans GameState** :

```ts
highlights: Record<number, { playerId: string, playerName: string }[]>
// wordIndex → liste des joueurs qui ont highlighté ce mot
```

---

## Phase 5 : Migrations et nettoyage

### 5.1 Migrations MikroORM

- Créer la table `game_event` (id, gameId, roundId, eventType, payload, triggeredBy, createdAt) avec index sur `(gameId, createdAt)` et `(gameId, roundId, createdAt)`.
- Simplifier `game` : garder id, createdBy, createdAt ; supprimer les champs dérivés des events.
- Supprimer ou migrer `game_player` : les joueurs viennent des events.
- Adapter `round` : id, gameId, order, words, results, createdAt (données de grille uniquement).
- Supprimer `round_player_roles`, `round_events`, `round_clue`, `round_reveal` (si existants).

### 5.2 Nettoyage

- Supprimer `RoundsModule`, `RoundsController`, `RoundsService`.
- Mettre à jour `AppModule` pour retirer Rounds.
- Mettre à jour `GamesModule` pour importer WordsModule et le nouveau GamesGateway.

---

## Récapitulatif des fichiers

| Fichier | Action |
|---------|--------|
| `games/entities/game-event.entity.ts` | Créer |
| `games/game-core.logic.ts` | Créer (applyEvent, computeGameState, generateGridResults) |
| `games/games.entity.ts` | Simplifier (minimal) |
| `games/round.entity.ts` | Déplacer depuis rounds, adapter (grille uniquement) |
| `games/games.service.ts` | Refactorer (event-driven) |
| `games/games.controller.ts` | Refactorer |
| `games/games.gateway.ts` | Créer |
| `games/contracts/games.contract.ts` | Étendre (payloads par event type) |
| `rounds/*` | Supprimer |

---

## Références

### Règles du jeu Codenames

- **[rules.md](./rules.md)** — Règles officielles à respecter pour la logique du jeu (grille, types de cartes, tour, indices, victoire/défaite).

### Conventions de développement

- [common.mdc](../.cursor/rules/common.mdc)
- [backend.mdx](../apps/documentation/src/content/docs/guidelines/backend.mdx)
