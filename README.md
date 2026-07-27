# Tugasin — file structure

Each screen and each reusable card is now its own file, so you can open one
file and edit just that piece.

```
index.html              ← shell only: loads css/style.css + js/app.js
manifest.json           ← PWA install metadata
sw.js                   ← offline cache (service worker)
icon-192.png / icon-512.png

css/
  style.css             ← every style rule, one file

js/
  app.js                ← entry point: imports all pages, builds the route table, boots the app
  state.js              ← app state (S), nav()/back()/render()/toast() — the "router"
  data.js               ← seed data: providers, chats, tasks, user profile
  icons.js              ← every inline SVG icon, in one place

  components/           ← small reusable pieces used by multiple pages
    topbar.js              header bar (title + optional back button)
    bottomnav.js           Home / Market / Activity / Chat tab bar
    providerCard.js        provider grid card (Home + Market)
    taskCard.js            task card (Activity tabs)
    chatRow.js              one row in the Chat list
    infoRow.js              one labeled row (Profile, Task Submitted)
    quickButton.js          Home dashboard quick-action tile

  pages/                 ← one file per screen, matches your UML nodes 1:1
    login.js, register.js, verify.js, forgot.js, reset.js
    home.js, market.js, freelancer.js
    activity.js, requestTask.js, taskSubmitted.js, taskAccepted.js, orderCanceled.js
    chat.js, chatThread.js
    profile.js, createMarketplace.js
```

## How to edit something

- **Change a screen's layout/content** → open its file in `js/pages/`.
- **Change a card's look** (e.g. provider card, task card) → open its file in `js/components/`. Since cards are shared, editing one file updates every page that uses it.
- **Change colors/spacing/fonts** → `css/style.css` (CSS variables are at the top of the file).
- **Change seed data** (providers, chats, sample tasks, the logged-in user) → `js/data.js`.
- **Add a brand-new screen** → create `js/pages/yourPage.js` exporting `screenYourPage()`, then register it in `js/app.js`'s `ROUTES` object and `nav('yourPage')` from wherever it should be reachable.

## Running it

The pages use native ES modules (`<script type="module">`), which browsers
only load over `http://` or `https://` — not by double-clicking `index.html`
(`file://`). To preview locally, serve the folder, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

then open the printed `localhost` URL. For real deployment, upload the whole
folder (keeping the same relative paths) to any static host — Netlify,
Vercel, GitHub Pages, S3, etc. — and the PWA install prompt / offline
support will work once served over HTTPS.

State is still in-memory only (no backend, no database) — refreshing the
page resets data, same as before. `js/data.js` is the one place to swap in
real API calls.
