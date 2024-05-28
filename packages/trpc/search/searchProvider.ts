import type { Index } from "meilisearch";
import { and, eq, inArray } from "drizzle-orm/expressions";
import { ZBookmark, ZGetBookmarksRequest, ZGetBookmarksResponse } from "@hoarder/shared/types/bookmarks";
import { bookmarks } from "@hoarder/db/schema";
import { ZBookmarkIdx } from "@hoarder/shared/search";
import type { Context } from "../index";
import { BookmarkQueryReturnType, toZodSchema } from "../routers/bookmarks";
import { BookmarkSearchInfo, ExpressionType, ParsedExpression } from "./parsedExpression";
import { ExtendedNode, queryGrammar, searchQuerySemantics } from "./queryParsing";
import { MatchResult } from "ohm-js";
import {
    BooleanSearchExpression,
    ListEqualsExpression,
    QueryExpression,
    SearchByIdExpression, SelectAllSearchExpression,
    TagsInExpression,
    TextSearchExpression
} from "./queryExpressions";

function filterUsingCursor(bookmarkSearchInfo: Map<string, BookmarkSearchInfo>, query: ZGetBookmarksRequest, limit: number) {
    // Cursor request was made
    const returnValue: BookmarkSearchInfo[] = [];
    let count = 0;
    if (query.cursor) {
        let found = false;
        if (query.useCursorV2) {
            if (!("id" in query.cursor)) {
                throw new Error("cursor is missing the id!");
            }

            for (let [, value] of bookmarkSearchInfo) {
                if (value.id === query.cursor.id) {
                    found = true;
                }
                if (found) {
                    if (count === limit) {
                        break;
                    }
                    count++;
                    returnValue.push(value);
                }
            }
        } else {
            // Cursor v1 --> filter only by timestamp
            // TODO: Remove once Cursor v1 is no longer supported
            const createdDate = (query.cursor as Date).getTime();
            let found = false;
            let count = 0;
            for (let [, value] of bookmarkSearchInfo) {
                if (value.createdDate === createdDate) {
                    found = true;
                }
                if (found) {
                    if (count === limit) {
                        break;
                    }
                    count++;
                    returnValue.push(value);
                }
            }
        }

        return returnValue;
    }
    for (let [, value] of bookmarkSearchInfo) {
        if (count === limit) {
            break;
        }
        count++;
        returnValue.push(value);
    }
    return returnValue;
}

async function getBookmarkInformation(query: ZGetBookmarksRequest, ctx: Context, bookmarkSearchInfo: Map<string, BookmarkSearchInfo>): Promise<{
    bookmarks: ZBookmark[];
    nextCursor: Date | { id: string, createdAt: Date } | null
}> {
    if (bookmarkSearchInfo.size === 0) {
        return { bookmarks: [], nextCursor: null };
    }
    const limit = (query.limit || 50) + 1;
    const ids = filterUsingCursor(bookmarkSearchInfo, query, limit);
    let nextCursor: Date | { id: string, createdAt: Date } | null = null;

    if (ids.length === limit) {
        const nextItem = ids.pop()!;
        const createdDate = new Date();
        createdDate.setTime(nextItem.createdDate!);
        if (query.useCursorV2) {
            nextCursor = {
                id: nextItem.id,
                createdAt: createdDate,
            };
        } else {
            nextCursor = createdDate;
            throw new Error("not supported"); // TODO here to find out where it is used
        }
    }

    let selectedBookmarks = ids.map((bookmark) => bookmark.id);

    // Only load the information of the first 50 bookmarks to not overload the UI
    const queryResult = await ctx.db.query.bookmarks.findMany({
        where: and(
            eq(bookmarks.userId, ctx.user!.id),
            inArray(bookmarks.id, selectedBookmarks)
        ),
        with: {
            tagsOnBookmarks: {
                with: {
                    tag: true
                }
            },
            link: true,
            text: true,
            asset: true
        }
    });

    const resortedBookmarks = sortBookmarkResults(selectedBookmarks, queryResult);

    return { bookmarks: resortedBookmarks.map(toZodSchema), nextCursor: nextCursor };
}

function sortBookmarkResults(ids: string[], bookmarks: BookmarkQueryReturnType[]): BookmarkQueryReturnType[] {
    const idToObjectMap: Map<string, BookmarkQueryReturnType> = new Map();

    // Create a map from id to object
    for (const bookmark of bookmarks) {
        idToObjectMap.set(bookmark.id, bookmark);
    }

    // Sort the objects array based on the order of ids in the ids array
    // @ts-expect-error maybe works better in typescript 5.4? undefined is actually filtered out (and should actually never happen)
    return ids.map(id => idToObjectMap.get(id))
              .filter(object => object !== undefined);
}

function handleSimpleQuery(query: ZGetBookmarksRequest): ParsedExpression {
    if (query.listId) {
        return new QueryExpression(new ListEqualsExpression(query.listId));
    }
    if (query.tagId) {
        return new QueryExpression(new TagsInExpression([query.tagId], false, true));
    }
    if (query.archived) {
        return new QueryExpression(new BooleanSearchExpression(ExpressionType.ARCHIVED_KEY_VAL, "true"));
    }
    if (query.favourited) {
        return new QueryExpression(new BooleanSearchExpression(ExpressionType.FAVOURITE_KEY_VAL, "true"));
    }
    if (query.ids) {
        return new SearchByIdExpression(query.ids);
    }
    if (query.text) {
        return new QueryExpression(new TextSearchExpression(query.text));
    }
    return new QueryExpression(new SelectAllSearchExpression());
}

function handleAdvancedQuery(match: MatchResult): ParsedExpression {
    return (searchQuerySemantics(match) as ExtendedNode<ParsedExpression>).visit();
}

export async function performSearch(
    query: ZGetBookmarksRequest,
    ctx: Context,
    client: Index<ZBookmarkIdx>
): Promise<ZGetBookmarksResponse> {

    let queryExpression: ParsedExpression;
    if (query.advanced) {
        if (!query.text) {
            queryExpression = new QueryExpression(new SelectAllSearchExpression());
        } else {
            const match = queryGrammar.match(query.text);
            if (!match.succeeded()) {
                console.log("failed", match.shortMessage);
                return { bookmarks: [], bookmarkCursor: [], nextCursor: null, errorMessage: match.shortMessage };
            }

            console.log("succeeded");
            queryExpression = handleAdvancedQuery(match);
        }
    } else {
        queryExpression = handleSimpleQuery(query);
    }

    console.log("visited: ", JSON.stringify(queryExpression, null, 4));
    const startTime = performance.now();
    const uniqueResult = await queryExpression.execute(ctx, client, new Map());
    const middle = performance.now();
    console.log("querying total:", middle - startTime);
    let returnResult = await getBookmarkInformation(query, ctx, uniqueResult);
    console.log("after loading bookmarkinfo:", performance.now() - middle);
    console.log("duration: ", performance.now() - startTime, "Results: ", uniqueResult.size);
    return returnResult;
}