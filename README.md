# KAN Tennis · San Diego

Website for KAN Tennis, a Korean tennis club in San Diego: home page, live rankings, and a game day schedule with moderator tools. Korean / English.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres) · Vercel

---

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) → **New project**. Pick a name (e.g. `kan-tennis`), set a database password, and choose the **West US (North California)** region (closest to San Diego).
2. Wait for the project to finish provisioning.

## 2. Run the migration and seed

In the Supabase dashboard, open **SQL Editor → New query**:

1. Run each migration in order. For each one, paste its contents and click **Run**:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) creates the `players`, `game_days` and `matches` tables.
   - [`supabase/migrations/0002_doubles.sql`](supabase/migrations/0002_doubles.sql) adds singles/doubles game days.
2. *(Optional, for sample data)* Paste [`supabase/seed.sql`](supabase/seed.sql) and **Run**. This adds 8 players, last Thursday's singles game day with results, and next Thursday's doubles game day with matchups.
   - Every sample player's password is **`1234`**.
   - **Daniel Lee** is a moderator, so you can try the moderator tools.
   - To start fresh later: `delete from game_days; delete from players;`

> **Security model.** Row Level Security is enabled on every table with *no policies*, so Supabase's public `anon` key can't read or write anything. The website talks to the database only from the server, using the secret `service_role` key, and checks sign-in and roles itself.

## 3. Set environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Supabase → **Project Settings → Data API** → Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings → API Keys** → a **secret** key (`sb_secret_…`), or the legacy **service_role** key (`eyJ…`). Not the publishable/anon key, because RLS blocks it from everything. ⚠️ Server-only. Never prefix it with `NEXT_PUBLIC_` and never commit it. |
| `SESSION_SECRET` | Any long random string. Generate one with `openssl rand -base64 32`. Changing it signs everyone out. |

## 4. Run locally

Requires **Node.js 22+** (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm test           # ranking + time unit tests (Vitest)
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run build      # production build
```

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo. The Next.js preset is detected automatically.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` (use a *different* `SESSION_SECRET` from your local one).
4. Click **Deploy**. Later pushes to `main` deploy automatically.

## 6. Promote a player to moderator

Players register themselves on the site. To make someone a moderator, run this in the Supabase **SQL Editor** (names match case-insensitively):

```sql
update players set role = 'moderator' where lower(name) = lower('Player Name');
```

To demote:

```sql
update players set role = 'member' where lower(name) = lower('Player Name');
```

The change applies on the player's next page load. There's no need to sign out.

### Other admin tasks (SQL Editor)

```sql
-- Reset a forgotten password (replace temp-password with the club's default). pgcrypto produces a bcrypt hash the app understands.
-- On Supabase, pgcrypto lives in the "extensions" schema.
update players
set pin_hash = extensions.crypt('temp-password', extensions.gen_salt('bf', 10)),
    failed_attempts = 0, locked_until = null
where lower(name) = lower('Player Name');

-- Unlock an account after too many wrong passwords (it also unlocks by itself after 15 min)
update players set failed_attempts = 0, locked_until = null where lower(name) = lower('Player Name');
```

---

## How it works

- **Sign-in:** name + password (at least 4 characters; the column is named `pin_hash` for historical reasons). Passwords are hashed with bcrypt. The session is a signed JWT in an httpOnly cookie, valid for 60 days. After 5 wrong passwords, an account is locked for 15 minutes.
- **Passwords:** new members choose their own when they register. Anyone signed in can change theirs at **My account** (`/account`, tap your name in the navbar) by entering the current password plus the new one twice; wrong current passwords count toward the same lockout. Each session cookie carries a fingerprint of the password hash, so changing a password (or resetting it with the SQL below) signs out every other device.
- **Roles:** `member` (default) or `moderator`. Every moderator action re-checks the role in the database on the server, so hiding buttons is not the only protection.
- **Singles / doubles:** each game day is one or the other (new ones default to doubles). A doubles matchup is Team 1 (`player1` + `partner1`) vs Team 2 (`player2` + `partner2`). A game day's format can't change once it has matchups.
- **Rankings** are computed from completed matches on every request ([`lib/ranking.ts`](lib/ranking.ts)) and are never stored. Singles and doubles share one table: in doubles, both winners get the win and both losers get the loss. Win = 5 pts, draw = 3, loss = 1 (playing always earns points, so showing up is rewarded). Ties are broken by **game difference** (games won − games lost, from the entered scores), then wins, then name. Players tied on points, game difference and wins share a rank.
- **Scores** are entered as games per team (one box each) and stored as `6-0`, Team 1's / Player 1's games first. The result is picked automatically from the score, and the server rejects a score that contradicts the result. Older multi-set strings like `6-4, 3-6, 10-8` still parse ([`lib/score.ts`](lib/score.ts)). Matches without a score add nothing to game difference. Players with no completed matches are listed at the bottom without a rank (shown as `–`).
- **Times:** game day dates and times are stored as San Diego wall-clock values. "Upcoming" vs "past" is decided by today's date in `America/Los_Angeles`.
- **Language:** Korean by default. The KO/EN toggle is remembered in a `lang` cookie. Translations live in [`lib/i18n/ko.ts`](lib/i18n/ko.ts) and [`lib/i18n/en.ts`](lib/i18n/en.ts). TypeScript fails the build if a key is missing from `en.ts`.
- **Logo:** put the club badge at `public/logo.png` (square PNG, ideally at least 512×512). It is used in the navbar, the home page hero, and as the favicon.

## Project structure

```
app/
  page.tsx, rankings/, game-day/   pages
  actions/auth.ts                  sign in / register / sign out / language
  actions/game-day.ts              moderator-only mutations
components/
  home/, rankings/, game-day/      page sections
  game-day/admin/                  moderator forms (client components)
  auth/, ui/                       sign-in modal, shared UI
lib/
  db.ts                            server-only Supabase client
  auth/                            session cookie + password hashing
  ranking.ts (+ .test.ts)          standings calculation
  queries.ts, validation.ts, time.ts, i18n/
supabase/
  migrations/0001_init.sql, seed.sql
```
