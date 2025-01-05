# Hoarder SDK

This package contains the official typescript SDK for the hoarder API.

## Installation

```
npm install @hoarderapp/sdk
```

## Usage

```typescript
import { createHoarderClient } from "@hoarderapp/sdk";

// Create a client
const apiKey = "my-super-secret-key";
const client = createHoarderClient({
  baseUrl: `http://localhost:${port}/api/v1/`,
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
});


// Search for bookmarks
const { data: searchResults, response: searchResponse } = await client.GET(
  "/bookmarks/search",
  {
    params: {
      query: {
        q: "test bookmark",
      },
    },
  },
);

// Create a bookmark
await client.POST("/bookmarks", {
  body: {
    type: "text",
    title: "Search Test 1",
    text: "This is a test bookmark for search",
  },
});
```


## Docs

API docs can be found [here](https://docs.hoarder.app/api).

## Versioning

- This package follows the minor version of the hoarder server. So new APIs introduced in Hoarder version `0.21.0` will be available in this package starting from version `0.21.0`.
- Hoarder strives to maintain backward compatibility in its APIs, so older versions of this package should continue working with newer hoarder server versions.
