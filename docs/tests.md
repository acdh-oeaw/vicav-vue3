# E2E Tests

## Backend Switching

One env var controls everything: `NUXT_PUBLIC_API_BASE_URL`.

| URL                                        | Backend  |
| ------------------------------------------ | -------- |
| `https://vicav-dev.acdh.oeaw.ac.at`        | vicav    |
| `https://vicav.acdh.oeaw.ac.at`            | vicav    |
| `http://localhost:8984`                    | vicav    |
| `https://shawi-api.acdh-dev.oeaw.ac.at`    | shawi    |
| `https://tunocent-api.acdh-dev.oeaw.ac.at` | tunocent |
| `https://wibarab-api.acdh-dev.oeaw.ac.at`  | wibarab  |

`playwright.config.ts` reads this var and sets `testMatch: "<backend>/**/*.@(test|spec).ts"`.

## Running Tests

```bash
# Set in .env.local (gitignored)
NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"

# Build (PUBLIC vars baked at build time!)
pnpm run build

# Run tests
pnpm run test:e2e                # all vicav tests
pnpm run test:e2e keyboard       # only keyboard tests
```

The npm scripts use `dotenv -e .env.local` to inject the var into both the app and playwright.

## Test Locations

- `e2e/pages/vicav/menu/` — 41 test files
- `e2e/pages/tunocent/`, `e2e/pages/shawi/`, `e2e/pages/wibarab/` — other backends

## Current Vicav Menu Data (live)

- **Project**: Mission, News, Types of Text/Data, Contributors, Linguistics
- **Bibliographies**: Explanation + 8 more items
- **Profiles**: Explanation + List, Show All Profiles on Map, Contribute a Profile
- **Feature Lists**: Explanation, Cross-examine, Show All on Map, Contribute
- **Samples**: Explanation, Show All on Map, Contribute
- **Texts**: Explanation and Overview
- **Dictionaries**: 11 items
- **Tools & Technology**: 16 items

## Selector Patterns

| Old (Menubar)                | New (NavigationMenu)                    |
| ---------------------------- | --------------------------------------- |
| `getByRole("menuitem", ...)` | `getByRole("button", ...)`              |
| `[role='menu']`              | `[data-slot=navigation-menu-content]`   |
| `[role='menubar']`           | `[data-slot=navigation-menu]`           |
| `[role='separator']`         | `[data-slot=navigation-menu-separator]` |

**Windows dropdown** (`window-list-dropdown.vue`) still uses Menubar — keep `menuitem` selectors for
it.
