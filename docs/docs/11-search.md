# Advanced Search Queries

## Usage

Advanced Queries allow writing very complex queries to search for bookmarks.

### Query Expressions

`Query Expressions` are used to filter bookmarks.

These are the currently available `Query Expressions`:
* `text="<text>"`:
  Allows searching the content of the bookmark. This behaves exactly like the simple query.
* `tags in ["<tag>", ...]`:
  Allows searching for bookmarks with a certain tag. It is possible to add multiple tags, separated by comma.
  Adding multiple tags will find bookmarks with either tag and not bookmarks that have both tags assigned to them.
  
  ***Sample***: `tags in ["yamaha", "suzuki"]`. Searches for bookmarks with the tag `yamaha` or `suzuki`.
* `list = "<listid>"`:
  Allows searching for bookmarks in a certain list.

  ***Sample***: `list = "fppabrrfk8nujgup3o21zy9p"`: Searches for bookmarks in the list with the id "fppabrrfk8nujgup3o21zy9p".
* `archived = true|false`:
  Allows searching for bookmarks that have been archived / not archived.
* `favourite = true |false`:
  Allows searching for bookmarks that have been added to the favourites / not been added to the favourites.
* `bookmarkType = "text" | "link" | "asset"`:
  Allows searching for bookmarks based on their type `text`, `link` or `asset`.
* `createdDate <operator> "<absoluteDate>"`:
  Allows searching for bookmarks by the date they were created, based on an absolute date.
  `absoluteDate` needs to be in the format `dd-mm-yyyy`. Operators can be `<`, `<=`, `>`, `>=`, `=`.

  ***Sample***: `createdDate > "01-01-2024"`. Searches for bookmarks created after January 1st 2024.
* `createdDate <operator> "-<number><type>"`:
  Allows searching for bookmarks by the date they were created, relative to the current day.
  Operators can be `<`, `<=`, `>`, `>=`, `=`. Possible values for `type` are `d` (day), `w` (week), `m` (month), `y` (year).
  
  ***Sample***: `createdDate > "-5w"`. Searches for bookmarks created in the last 5 weeks.

### AND, OR and Parenthesis

A query consists of 1 or more `Query Expressions` which are combined using `and` or `or` and can be combined
further using parenthesis.

`and` has precedence over `or`, which means that these queries without parenthesis are equivalent to these with parenthesis:
* `text = "motorocycle" and tags in ["yamaha"] or tags in ["cooking"]` --> 

  `(text = "motorocycle" and tags in ["yamaha"]) or tags in ["cooking"]`
* `text = "motorocycle" and tags in ["yamaha"] and createdDate>"-1y" or tags in ["cooking"]` -->

  `(text = "motorocycle" and tags in ["yamaha"] and createdDate>"-1y") or tags in ["cooking"]`

If this is not what you want, you can use parenthesis to group the Query expressions.
***Sample:*** 
* `text = "motorocycle" and (tags in ["yamaha"] or tags in ["cooking"])`

### Sort Expressions

`Sort Expressions` are used to sort the result of a query.
They are placed at the end of the `Query Expressions` like this:

`<query expressions> ORDER BY <sort expression>`.

A Sort Expression has the format `<criteria> <ASC|DESC>`. Multiple `Sort Expressions` can be appended using commas.

Possible values to sort by:
* `rank`: How well the searched text matches the bookmark. ***Only available if you have a `text=<text>` `Query Expression`!***
* `createdDate`: When the bookmark was created.
* `favourite`: If the bookmark has been added to the Favourites.
* `archived`: If the bookmark has been archived.
* `bookmarkType`: The type of the bookmark.

`ASC` and `DESC` stand for ascending and descending and define the sorting order.

So a full query will look like this:
`text = "yamaha" and tags in ["motorcycle"] order by rank desc, createdDate desc`.
This will return all bookmarks with the tag `motorcycle` and the text `yamaha` and sort them by the rank
(best matching first) and then by the time the bookmark was created (newest first).

***Note: By default, bookmarks are sorted by creation date in descending order!***

## Limitations

The default maximum for Meilisearch is 1000 results. In case you are running complicated queries
that return more than 1000 results with the `text=<text>` expression and a lot of other expressions
to narrow down the results, take this into consideration.

Possible workarounds are to put the `text=<text>` expression at the end of the query,
then it will be evaluated last and based on the bookmarks of the rest of the query.

***Sample:***

`text="motorcycle" AND tags in ["yamaha", "suzuki"] AND createdDate>"-1y"` will first find all the bookmarks
with the text "motorcycle" in them(1000 results maximum) and then narrow the result down further by assigned tag
and `createdDate` in the last year.
In this scenario it can happen that the 1000 results returned might only be bookmarks which are older than 1 year,
so the result could be empty.

To improve the result, change the order of the query:

`tags in ["yamaha", "suzuki"] AND createdDate>"-1y AND text="motorcycle"` will first search all the bookmarks
which have been created in the last year and have the tags `yamaha` or `suzuki` attached to them and then filters them
down further by searching the text "yamaha" in them.

***NOTE:***
This limitation does not apply to queries with only 2 expressions, since this is handled internally.
This means `text = "motorcycle" and tags in ["yamaha"]` and `tags in ["yamaha"] and text = "motorcycle"` are equivalent.

With further optimizations, this might change in the future.