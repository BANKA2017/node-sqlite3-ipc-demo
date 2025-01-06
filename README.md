# node-sqlite3-ipc-demo

just for fun

## Example

```javascript
import { SQLiteClient } from "./src/client.mjs";
import { SQLiteServer } from "./src/server.mjs";

const DBServer = new SQLiteServer("/path/of/db", "/path/of/sock.sock");
const DBClient = new SQLiteClient("/path/of/sock.sock");

console.log(
  await DBClient.query("select * from example where limit ?", [2], "all"),
);
console.log(
  await DBClient.query(
    "select * from example where limit $limit",
    { $limit: 2 },
    "all",
  ),
);
console.log(await DBClient.query("sss", [], "all"));
```

## Type

### DBClient.query

| Argument | type                          | default |
| :------- | :---------------------------- | :------ |
| `sql`    | `string`                      | -       |
| `params` | `object\|array`               | -       |
| `type`   | `'run'\|'exec'\|'get'\|'all'` | `exec`  |
| `ext`    | `{ transaction?: any }`       | `{}`    |

## Response

```json
// success
{
    "id": "1876205137200050239",
    "success": true,
    "message": {},
    "data": [
        {
            "example1": 1,
            "example2": "string"
        },
        {
            "example1": 2,
            "example2": "string2"
        }
    ],
    "cost": 76
}

// failed
{
    "id": "1876205137539264534",
    "success": false,
    "message": {
        "name": "Error",
        "message": "SQLITE_ERROR: near \"sss\":syntax error"
    },
    "data": [],
    "cost": 12
}
```

## Known issues

- [ ] The sock file will not be deleted before shutting down the service, the next time start the server will throw `Error: listen EADDRINUSE: address already in use /path`

## About

### What’s the use of this?

Ummm I don't know.

### Will it support the xxx feature?

No, this is a piece of code that was once used for a Twitter Monitor, but it has now been deprecated.

### How does the performance compare to xxx?

It’s very bad. If possible, please do not use it directly, and definitely do not incorporate it into your product.
