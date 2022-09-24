# MtG Settle Server

Backend for [Settle](https://github.com/bathtaters/mtg-settle) _(Magic: the Gathering set guessing game)_

---

## API Routes
`[domain]/api/client/...`
##### _Header must include `{ Authorization: "Bearer <token>" }` with valid API token._

| URL | Method | Body | Return | Description |
|------|------|------|------|------|
|`/today`|`GET`| |`[ Encoded solution/cards ]`|Get encoded game data|
|`/setlist`|`GET`| |`[ { code, name, block } ]`|Get list of possible sets|

##### _All data is encoded like `{ data: <payload>, secret?: <key for encoded data>, expiresIn: <time data can be safely cached (ms)> }`

---

### Dev Note
You must create ./src/config/credentials.json with the following keys.
```json
{
  "gqlKey": "Bearer <MTGJSON GQL KEY>",
  "ikOptions": {
    "connection": {
      "publicKey":   "<ImageKit.io public key>",
      "privateKey":  "<ImageKit.io private key>",
      "urlEndpoint": "https://ik.imagekit.io/<server-endpoint>"
    },
    "minRequestInterval": 500, // MS delay between requests from scryfall
    "upload": {
      // imagekit.upload options, example provided below
      "fileName": "c.jpg",
      "folder": "card_art",
      "useUniqueFileName": true,
      "overwriteFile": false
    },
    "publicEndpoint": "https://ik.imagekit.io/<client-endpoint>"
  }
}
```

---

### Credits
 - **Logo Image**: bathtaters
 - **Card Data**: [MTGJSON](https://mtgjson.com/)
 - **Card/Set Images**: [Scryfall](https://scryfall.com/)

### To Do:
 - Clean up manager GUI
    - Remove advanced options from non-admin manager (Only Create game [remove "up to"] & Pick a game)
    - Sort game list by date
    - Add Next/Prev buttons to game editor
 - Schedule services to run daily (populate upcoming games, archive old games)
    - Schedule databases to update Weekly
    - Log tasks to log.info
 - Add request logs (Include IP, API Key, frontend session ID, request data, timestamp)
