# Codenames — rules (as implemented)

Two sides (**red** and **blue**) compete on a word grid. Each side has a **spymaster** and **operatives**. The spymaster knows which cards belong to which side; operatives do not.

## Setup

- Players split into red and blue. Each side needs at least one player and one spymaster before the UI treats the game as startable.
- Default grid: **25** words (5×5). Card colors: **1 assassin** (black), **7 bystanders** (neutral), and **8 / 9** team cards. Odd round order: 9 red and 8 blue (red starts). Even order: 8 red and 9 blue (blue starts).

## Clues

On the spymaster’s turn they submit **one word** and a **number**.

- The word must not match a grid label (SPA validation, case-insensitive).
- Allowed numbers in the SPA: `0`–`9`, or **∞** (sent as `999`).
- The engine sets `guessesRemaining` to **`number + 1`**. A clue of `0` therefore allows **one** guess; ∞ allows a large remaining count.

House-rule extras (spelling-based clues, foreign languages, etc.) are not enforced server-side beyond “one string + integer”.

## Guessing

After a clue, operatives on the current side:

1. May **highlight** cards (shown to everyone with their pseudos).
2. **Select** a card to reveal it.
3. May **pass** (“done guessing”).

Turn ends when:

- A revealed card is **not** that side’s color (bystander or opponent), or
- They pass, or
- `guessesRemaining` reaches 0 after a correct guess, or
- The optional **turn timer** expires (server passes the turn).

A correct team card decrements `guessesRemaining` and they may continue.

## Win and loss

- A side **wins** when all of its cards are revealed.
- A side **loses immediately** if it reveals the **assassin**.

## Card types

| Type | Color | Effect |
|------|--------|--------|
| Red | Red | Red must contact these. |
| Blue | Blue | Blue must contact these. |
| Bystander | Neutral | Safe; ends the turn. |
| Assassin | Black | Revealing it loses the game. |
