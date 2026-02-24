# Plan d'action – Frontend Codenames

Ce document décrit le plan de mise en place de la partie frontend du jeu Codenames, aligné sur le [backend plan](./game-backend-plan.md).

**Règles du jeu** : Consulter [rules.md](./rules.md) pour les règles officielles. L'UI doit refléter ces règles (grille 5×5, rôles Espion/Opératif, tours, indices, victoire/défaite).

**Identification** : Consulter [player-identification.md](./player-identification.md) pour le flux d'identification (pseudo, playerId, creatorToken, header X-Player-Id).

---

## Todo list

### Phase 1 : Fondations et SDK

- [x] **1.1** Régénérer le client OpenAPI pour inclure les endpoints Games (nécessite API démarrée : `pnpm generate`)
- [x] **1.2** Créer un client API Games avec support du header `X-Player-Id`
- [x] **1.3** Créer le hook `useGameSession` pour stocker playerId, creatorToken, gameId (sessionStorage)
- [x] **1.4** Créer le hook `useGameWebSocket` pour connexion WebSocket namespace `/games` et écoute de `game:state`

### Phase 2 : Pages d'entrée et routing

- [x] **2.1** Créer la page d'accueil Codenames (choix : créer ou rejoindre une partie)
- [x] **2.2** Créer la page « Créer une partie » (formulaire pseudo → POST /games)
- [x] **2.3** Créer la page « Rejoindre une partie » (input gameId + pseudo → POST /games/:id/join)
- [x] **2.4** Configurer les routes : `/`, `/games/new`, `/games/:gameId/join`, `/games/:gameId`

### Phase 3 : Lobby

- [x] **3.1** Créer la page/vue Lobby affichant les joueurs et le statut `LOBBY`
- [x] **3.2** Créer le composant de sélection d'équipe (rouge/bleu) pour chaque joueur
- [x] **3.3** Créer le composant de désignation d'espion par équipe
- [x] **3.4** Afficher le bouton « Démarrer la partie » (créateur uniquement, quand équipes et espions OK)
- [x] **3.5** Implémenter l'éjection de joueurs (créateur uniquement, avec creatorToken)

### Phase 4 : Vue de jeu – structure commune

- [x] **4.1** Créer le layout de la page de jeu (`/games/:gameId`) avec WebSocket connecté
- [x] **4.2** Créer le composant `WordGrid` (grille 5×5 de cartes)
- [x] **4.3** Créer le composant `WordCard` (mot révélé/non révélé, type de carte, highlights)
- [x] **4.4** Afficher l'indicateur de tour (équipe courante, indice en cours, guessesRemaining)
- [x] **4.5** Gérer l'affichage selon le rôle (Espion vs Opératif) et l'équipe

### Phase 5 : Vue Espion

- [x] **5.1** Afficher la grille avec les couleurs réelles (rouge, bleu, neutre, noir) pour l'espion
- [x] **5.2** Créer le formulaire de saisie d'indice (mot + nombre) avec validation
- [x] **5.3** Envoyer l'indice via POST `/games/:id/rounds/current/clue` quand c'est le tour de l'espion

### Phase 6 : Vue Opératif

- [x] **6.1** Afficher la grille avec mots masqués (cartes face cachée)
- [x] **6.2** Implémenter le highlight (hover ou clic) pour proposer un mot → POST highlight
- [x] **6.3** Implémenter l'unhighlight → DELETE highlight
- [x] **6.4** Afficher les pseudos des joueurs qui ont highlighté chaque mot
- [x] **6.5** Implémenter la sélection de mot (confirmation) → POST select
- [x] **6.6** Implémenter « Fini de deviner » → POST pass

### Phase 7 : États de fin et UX

- [x] **7.1** Afficher l'écran de victoire/défaite (winningSide, losingSide)
- [x] **7.2** Implémenter le bouton « Nouvelle partie » (GAME_RESTARTED) pour le créateur
- [x] **7.3** Gérer les états de chargement et les erreurs (401, 404, erreurs réseau)
- [x] **7.4** Gérer la reconnexion WebSocket et la récupération d'état (GET /games/:id/state)

### Phase 8 : Polish et tests

- [ ] **8.1** Adapter le design (couleurs équipes, cartes, thème Codenames)
- [ ] **8.2** Responsive design (mobile/tablette)
- [ ] **8.3** Tests unitaires des hooks et composants critiques
- [x] **8.4** Nettoyer les features boilerplate non utilisées (user-posts supprimé)

---

## Architecture frontend

### Stack (existant)

- React + React Router
- TanStack Query pour le data fetching
- shadcn/ui (packages/ui)
- OpenAPI Generator (types, SDK)
- Vite

### Structure des features

```
app/features/
├── games/
│   ├── components/
│   │   ├── word-grid.tsx
│   │   ├── word-card.tsx
│   │   ├── team-selector.tsx
│   │   ├── spy-designation.tsx
│   │   ├── clue-form.tsx
│   │   ├── lobby-players-list.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── use-game-session.ts
│   │   ├── use-game-websocket.ts
│   │   └── use-game-actions.ts
│   ├── utils/
│   │   ├── games-api.ts          # Client API avec X-Player-Id
│   │   └── games-queries.ts      # TanStack Query options
│   ├── pages/
│   │   ├── game-home-page.tsx
│   │   ├── game-create-page.tsx
│   │   ├── game-join-page.tsx
│   │   ├── game-lobby-page.tsx
│   │   └── game-play-page.tsx
│   └── types.ts                  # Types dérivés du GameState
```

### Flux de données

1. **Création/Rejoindre** : Formulaire → API REST → stockage session (playerId, creatorToken, gameId)
2. **Connexion WebSocket** : `game:join` avec gameId → écoute `game:state`
3. **État** : `game:state` reçu → mise à jour UI (état dérivé du backend)
4. **Actions** : Boutons/formulaires → API REST avec `X-Player-Id` → WebSocket émet `game:state` → UI se met à jour

### Client API et header X-Player-Id

Le client doit envoyer `X-Player-Id` sur toutes les actions en jeu. Options :

- **Option A** : Créer un client API wrapper qui injecte le header depuis `useGameSession`
- **Option B** : Utiliser un intercepteur/fetch custom dans le SDK OpenAPI
- **Option C** : Passer le header explicitement à chaque appel (moins DRY)

**Recommandation** : Option A – un hook ou contexte qui fournit une instance du client avec le header pré-configuré.

---

## Détail des composants clés

### useGameSession

Stocke et expose : `playerId`, `creatorToken`, `gameId`, `playerName`.

- Persistance : `sessionStorage` (clés : `codenames_playerId`, `codenames_creatorToken`, etc.)
- Méthodes : `setSession(data)`, `clearSession()`, `isCreator`
- Utilisé par : toutes les pages de jeu, client API

### useGameWebSocket

- Connexion : `socket.io` vers `VITE_WS_URL/games` (ou dérivé de VITE_API_URL)
- Événement envoyé : `game:join` avec `gameId`
- Événement reçu : `game:state` → callback ou state
- Gestion : reconnexion, déconnexion propre

### WordGrid / WordCard

- **WordCard** : affiche le mot, la couleur (si révélé), les highlights (pseudos)
- **Vue Opératif** : mot visible, carte « face cachée » jusqu'à révélation
- **Vue Espion** : couleur visible (rouge, bleu, neutre, noir)
- **Highlights** : `highlights[wordIndex]` = liste `{ playerId, playerName }[]` → afficher les pseudos

### Règles d'affichage selon le rôle

| Rôle      | Grille visible                    | Actions disponibles                          |
|-----------|------------------------------------|----------------------------------------------|
| Espion    | Couleurs réelles                   | Donner indice (quand c'est son tour)         |
| Opératif  | Mots masqués, révélés au fur et à mesure | Highlight, unhighlight, select, pass (quand c'est le tour de son équipe) |

---

## Références

- [game-backend-plan.md](./game-backend-plan.md) — Plan backend (endpoints, events, GameState)
- [player-identification.md](./player-identification.md) — Flux d'identification
- [rules.md](./rules.md) — Règles du jeu Codenames
- [frontend.mdx](../apps/documentation/src/content/docs/guidelines/frontend.mdx) — Conventions frontend
