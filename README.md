# Frame by Frame — Episode Tracker

A responsive Next.js + TypeScript episode tracker for anime, donghua, and TV series.

## Features
- Dashboard stats for series, currently watching, episodes watched, and completed titles.
- Add series with type, status, season count, episode count, genre, and year.
- Track watched/unwatched episodes season by season.
- Automatic watched counts, progress percentages, current next episode, and completion status.
- Search, filter by status/type, sort, and switch between grid/list layouts.
- Light/dark theme toggle.
- Local persistence using `localStorage` (data stays in the same browser on this device).
- Responsive layout and reusable poster/status/progress patterns.

## Run locally
Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes
- This starter uses generated poster artwork rather than external images or an anime metadata API.
- When adding a series, episodes are created as numbered placeholders. The episode count field is the number of episodes **per season**; total episodes are calculated from season count × episodes per season.
- Data is saved locally in the browser. It does not sync across devices or accounts.
