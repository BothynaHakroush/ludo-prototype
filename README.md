# Spider Ludo — Prototype

A clickable prototype of **Spider Ludo**, an educational Ludo game for 2–4 players. Players race their pieces home while answering questions about Agile, MVC, design patterns and software testing.

We built this prototype to test our requirements and screen design with real users **before** the real implementation starts. It is a throw-away prototype: it uses sample data, and the final game will be written in Java.

> Course: Software Engineering and Software Quality Assurance in Information Systems, University of Haifa
> Group: **Spider**, Exercise 3 (Prototype)

## What you can try

| Process | What happens |
|---|---|
| **Set up a game** | Choose 2–4 players and Easy, Medium or Hard. Enter names and pick unique colors. Errors are explained right next to the field. |
| **Play** | Roll the dice, move a glowing piece, capture opponents, build a Double Block. The turn panel takes the color of the player whose turn it is. |
| **Question squares** | Answer a multiple-choice question (A–D). A right answer moves you forward, a wrong one moves you back: 1, 2 or 3 steps by difficulty. |
| **Surprise squares** | One of six random events, with the chance of each shown. |
| **Finish a game** | See the final ranking, difficulty and game time. The result is added to the game history. |
| **Game history** | All finished games in the course CSV format, sortable by date or difficulty. |
| **Question management** | Administrator login, then view, filter, add, edit and delete questions, with validation and a change log. |
| **How to play** | The full rules in nine short points. |

### Difficulty levels

| Level | Board | Dice | Special squares |
|---|---|---|---|
| Easy | Standard board, 52 squares | Normal die | 4 protection, 4 arrow |
| Medium | Adds an outer route of 64 squares | Normal × Boost (1–3) | 8 protection, 8 arrow, 6 question, 2 surprise |
| Hard | Adds outer routes of 64 and 72 squares | Normal × UltraBoost (1–6) | 12 protection, 12 arrow, 9 question, 3 surprise |

### Keyboard

| Key | Action |
|---|---|
| `R` or `Space` | Roll the dice |
| `1`–`4` | Move that piece |
| `A`–`D`, then `Enter` | Answer a question |
| `Esc` | Close a dialog |

## Tips for testers

- **Admin password:** `Spider2026`
- The first few dice rolls are fixed, so every tester quickly meets a 6, a question square, a turn with no move and a surprise square. After that, rolls are random.
- Open **Prototype tools** in the game's top bar to set the next roll, or to end the game and jump to the results.
- On the Game History page, the prototype tools show the empty state, a damaged-file error and the raw CSV.
- Data is kept only in your browser tab. Refreshing keeps your game; closing the tab resets everything.

## Run it locally

Requires [Node.js](https://nodejs.org) 18.18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Production build:

```bash
npm run build
npm start
```

## Deploy

A standard Next.js app with no environment variables. Import the repository in [Vercel](https://vercel.com/new) and deploy with the default settings.

## Tech stack

- Next.js (App Router) and React
- TypeScript
- Tailwind CSS

## Project structure

```
src/
├── app/                 Screens, one folder per route
│   ├── page.tsx         Main menu
│   ├── setup/           New game setup
│   ├── game/            Board, dice, question and surprise dialogs
│   ├── results/         Final ranking
│   ├── history/         Game history
│   ├── rules/           How to play
│   └── admin/           Administrator login and question bank
├── components/          Board and shared UI (buttons, dialogs, tokens)
└── lib/
    ├── board.ts         Board layout for all three difficulty levels
    ├── engine.ts        Simplified game rules (turns, dice, moves, effects)
    ├── data.ts          Sample questions, history and rule settings
    └── store.tsx        App state, kept in the browser tab
```

## Limits of this prototype

- Sample data only. Nothing is saved to files or a database.
- The game rules are simplified, and some edge cases are not handled.
- The login is for demonstration only. It is not real security.
- How pieces move between the outer routes and the standard board is our proposal. We would like your feedback on it.

## Team

Group **Spider**

- Nadin Harshuk
- David Koliev
- Bothyna Hakroush
- Mahmoud Mokary
