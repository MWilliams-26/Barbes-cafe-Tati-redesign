# Barbès & Café Tati: website refresh concept

Concept sites for two sister restaurants in Hoboken that sell themselves and each other: [Barbès](https://www.barbesrestaurant.com/), the French-Moroccan bistro and bar at 1300 Park Ave, and Café Tati, its little-sister café and BYOB bistro at 401 Bloomfield St. Research, creative direction, sources, the asset record and open questions are in [RESEARCH.md](RESEARCH.md).

| Page | What it is |
| --- | --- |
| `/` | The family: both houses side by side |
| `/barbes/` | Barbès, the evening house |
| `/tati/` | Café Tati, the morning house |
| `/notes/` | Why this refresh: the brief for the owners |

It is a static site in `public/` (HTML, CSS and one shared script) with no build step, deployed to Cloudflare as an assets-only Worker. Shared behaviour (open/closed status, hand-offs between the two houses, the day clock, menu tabs, the party planner, the family footer) lives in `public/assets/js/famille.js` and `public/assets/css/famille.css`.

## Preview locally

```sh
npm install
npm run dev        # wrangler dev, serves public/ like Cloudflare does
```

Add `?at=<day 0-6>-<HH:MM>` to fake the time for the open/closed signs and hand-offs, for example `/barbes/?at=1-11:00` (Monday 11 am, Barbès closed, Tati open) or `/tati/?at=5-20:30` (Friday evening).

## Images

`npm run images` rebuilds `public/assets/img` from the restaurants' published photos (needs curl and ImageMagick 7). Licensing status for each file is in RESEARCH.md.

## Deploy

```sh
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npm run deploy       # publishes https://barbes-tati-concept.<subdomain>.workers.dev
```

The preview sends `X-Robots-Tag: noindex` and a disallow-all `robots.txt` so it never competes with the restaurants' real sites in search.
