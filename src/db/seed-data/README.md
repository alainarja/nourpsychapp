# Demo seed data

One JSON file per collection, matching the future MongoDB collections 1:1.
The app loads them on first launch (`src/db/seed.js`). Bump `SEED_VERSION` there after editing, and the app reseeds.

## Tokens

Dates are relative to the day the data is loaded, so the demo never goes stale:

| Token | Becomes |
|---|---|
| `@day:-3` | date key 3 days ago, `YYYY-MM-DD` |
| `@iso:-2:10:00` | ISO timestamp 2 days ago at 10:00 local time |
| `@hash:demo123` | placeholder password hash of `demo123` |

The backend's seed script should apply the same rules (see `resolveTokens` in `src/db/seed.js`). It must hash passwords with bcrypt/argon2, not the placeholder.

## Conventions

- `id` is a string. In MongoDB, store it as `_id`, or keep `id` with a unique index.
- References are plain id strings (`proId`, `clientId`, `sellerId`, …).
- Adding a collection: create `<name>.json` and register it in `index.js`.
