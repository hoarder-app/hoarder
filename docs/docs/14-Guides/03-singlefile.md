# Using Hoarder with SingleFile Extension

Hoarder supports being a destination for the [SingleFile extension](https://github.com/gildas-lormeau/SingleFile). This has the benefit of allowing you to use the singlefile extension to hoard links as you're seeing them in the browser. This is perfect for websites that don't like to get crawled, has annoying cookie banner or require authentication.

## Setup

1. Install the [SingleFile extension](https://github.com/gildas-lormeau/SingleFile).
2. In the extension settings, select `Destinations`.
3. Select `upload to a REST Form API`.
4. In the URL, insert the address: `https://YOUR_SERVER_ADDRESS/api/v1/bookmarks/singlefile`.
5. In the `authorization token` field, paste an API key that you can get from your hoarder settings.
6. Set `data field name` to `file`.
7. Set `URL field name` to `url`.

Now, go to any page and click the singlefile extension icon. Once it's done with the upload, the bookmark should show up in your hoarder instance.

:::info
Currently, we don't support screenshots for singlefile uploads, but this will change in the future.
:::

