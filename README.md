# MtG Settle Server

Backend for [Settle](https://github.com/bathtaters/mtg-settle) _(Magic: the Gathering set guessing game)_

---

## API Routes
`http://backend.settle.gg/api/...`
##### _Header must include `{ Authorization: "Bearer <token>" }` with valid API token._

| URL | Method | Body | Return | Description |
|------|------|------|------|------|
|`/game`|`GET`| |`{ game }`|Get encoded game data|
|`/img/[id]`|`GET`| |`Card Art`|Get card art|

---

### Credits
 - **Logo Image**: bathtaters
 - **Card Data**: [MTGJSON](https://mtgjson.com/)
 - **Card/Set Images**: [Scryfall](https://scryfall.com/)

---

### To Do:
 - IMPLEMENT BATCH-ADD IN SCAFFOLDING
 
 - CONVERT NON-INTERNAL TO TYPESCRIPT

 - Write services to auto-update models
 - Create Game endpoint (connect to security middleware)
 - Write service to store photos locally
 - Serve photos as static assets w/ random UUID names
 - Schedule services to run daily (populate upcoming games, archive old games)
 - Create custom editor interface
 - Schedule databases to update Weekly
 - Encrypt & Memoize game endpoint (send key in header?)
 - Add hit counter (by IP)