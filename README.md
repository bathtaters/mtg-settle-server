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

### To Do:
 - Memoize game endpoint
 - Add route validation
 - Schedule services to run daily (populate upcoming games, archive old games)
    - Schedule databases to update Weekly
 - Add request logs (Include IP, API Key, frontend session ID, request data, timestamp)
 - Add 'create next X days' button
 - Add interface for permanently skipping some cards