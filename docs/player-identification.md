# Identification des joueurs

Ce document décrit le fonctionnement de l'identification des joueurs dans l'application Codenames. Il sera enrichi au fil du développement des fonctionnalités.

---

## Vue d'ensemble

L'application ne requiert **aucune inscription ni authentification**. Les joueurs rejoignent une partie en renseignant uniquement un **pseudo**. Chaque joueur reçoit un identifiant unique (`playerId`) qu'il doit conserver côté client pour les actions en jeu.

---

## Flux d'identification

### Création d'une partie

**Endpoint** : `POST /api/games`

**Body** : `{ "pseudo": "Alice" }`

**Réponse** :
```json
{
  "game": { "id": "...", "creatorPseudo": "Alice", "createdAt": "..." },
  "creatorToken": "uuid-du-créateur",
  "playerId": "uuid-du-joueur",
  "gameState": { "status": "LOBBY", "players": [...], ... }
}
```

Le client doit **stocker** :
- `playerId` : pour s'identifier sur les actions en jeu (header `X-Player-Id`)
- `creatorToken` : pour pouvoir éjecter des joueurs (réservé au créateur)

### Rejoindre une partie

**Endpoint** : `POST /api/games/:id/join`

**Body** : `{ "pseudo": "Bob" }`

**Réponse** :
```json
{
  "gameState": { "status": "LOBBY", "players": [...], ... },
  "playerId": "uuid-du-nouveau-joueur"
}
```

Le client doit **stocker** `playerId` pour les actions en jeu.

---

## Identification des requêtes

### Header X-Player-Id

Pour les actions qui nécessitent d'identifier le joueur (leave, chooseSide, giveClue, selectWord, highlightWord, etc.), le client envoie le header :

```
X-Player-Id: <uuid-du-playerId>
```

**Exemple** :
```http
PATCH /api/games/abc123/players/me/side
X-Player-Id: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "side": "red" }
```

Si le header est absent ou invalide (pas un UUID), la requête renvoie `401 Unauthorized`.

---

## Rôle du créateur

Le créateur de la partie dispose d'un **creatorToken** secret. Il peut :

- **Éjecter un joueur** : `DELETE /api/games/:id/players/:playerId` avec body `{ "creatorToken": "..." }`

Seul le créateur (celui qui possède le `creatorToken` valide) peut effectuer cette action.

---

## WebSocket

**Namespace** : `/games`

**Connexion** : aucune authentification requise. Toute connexion est acceptée.

**Événement `game:join`** : le client envoie le `gameId` pour rejoindre la room et recevoir les mises à jour d'état (`game:state`). Aucun `playerId` n'est transmis à la connexion WebSocket ; l'identification se fait uniquement via les requêtes REST.

---

## Stockage côté client

| Donnée        | Quand l'obtenir      | Usage                                      |
|---------------|----------------------|--------------------------------------------|
| `playerId`    | createGame ou joinGame | Header `X-Player-Id` sur toutes les actions |
| `creatorToken`| createGame uniquement | Body des requêtes kick                      |
| `gameId`      | createGame ou URL    | Rejoindre la room WebSocket, requêtes REST  |

**Recommandation** : stocker ces valeurs en `sessionStorage` ou `localStorage` pour persister pendant la session de jeu.

---

## Sections à venir

- *(À compléter au fil du développement)*
