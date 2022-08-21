# MtG Settle Server

Backend for [Settle](settle.gg) _(Magic: the Gathering set guessing game)_

---

## API Routes
`http://backend.settle.gg/api/[model]/...`
##### _Header must include `{ Authorization: "Bearer <token>" }` with valid API token._

| URL | Method | Body | Return | Description |
|------|------|------|------|------|
|`/`|`POST`|`{...data}`|`{ id }`|Create|
|`/`|`GET`| |`[{...data}]`|Read all|
|`/[id]`|`GET`| |`{...data}`|Read|
|`/[id]`|`PUT`|`{...data}`|`{ success }`|Update|
|`/[id]`|`DELETE`| |`{ success }`|Delete|
|`/swap`|`POST`|`{ id, swap }`|`{ success }`|Swap IDs _(`swap` = ID)_|

---

### Credits
 - **Logo Image**: bathtaters

---

### To Do:
 - Create base models
 - Create photo downloader
 - Create editor interface