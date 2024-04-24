# Importing Bookmarks

:::warning
Currently importing bookmarks requires some technical knowledge and might not be very straightforward for non-technical users. Don't hesitate to ask questions in github discussions or discord though.
:::

## Import from Chrome

- Open Chrome and go to `chrome://bookmarks`
- Click on the three dots on the top right corner and choose `Export bookmarks`
- This will download an html file with all of your bookmarks.
- To extract the links from this html file, you can run this simple bash one liner (if on windows, you might need to use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)): `cat <file_path> | grep HREF | sed 's/.*HREF="\([^"]*\)".*/\1/' > all_links.txt`.
- This will create a file `all_links.txt` with all of your bookmarks one per line.
- To import them, we'll use the [hoarder cli](https://docs.hoarder.app/command-line). You'll need a Hoarder API key for that.

Run the following command to import all the links from `all_links.txt`:

```
cat all_links.txt | xargs -I{} hoarder --api-key <key> --server-addr <addr> bookmarks add --link {}
```

## Import from other platforms

If you can get your bookmarks in a text file with one link per line, you can use the following command to import them using the [hoarder cli](https://docs.hoarder.app/command-line):

```
cat all_links.txt | xargs -I{} hoarder --api-key <key> --server-addr <addr> bookmarks add --link {}
```
