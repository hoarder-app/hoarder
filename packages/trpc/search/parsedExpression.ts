import type { Context } from "../index";
import { ZBookmarkIdx } from "@hoarder/shared/search";
import { arrayToMap } from "./bookmarkOperations";
import type { Index } from "meilisearch";

/**
 * All the data about a bookmark that can be used in a query. Might only be initialized during sorting or if
 * meilisearch is involved in a search
 */
export interface BookmarkSearchInfo {
    id: string;
    ranking?: number; //only available if a meilisearch result is involved
    createdDate?: number;
    favourite?: boolean;
    bookmarkType?: "text" | "link" | "asset";
    archived?: boolean;
}

export type BookmarkSearchResultMap = Map<string, BookmarkSearchInfo>;

export const enum ExpressionType {
    QUERY = "Query",
    OR = "Or",
    AND = "And",
    TERM = "Term",
    GROUP = "Group",
    TAGS_IN = "TagsIn",
    TAGS_NOT_IN = "TagsNotIn",
    LIST_KEY_VAL = "ListKeyVal",
    TEXT_KEY_VAL = "TextKeyVal",
    CREATED_DATE_KEY_VAL = "CreatedDateKeyVal",
    CREATED_DATE_KEY_VAL_RELATIVE = "CreatedDateKeyValRelative",
    FAVOURITE_KEY_VAL = "FavouriteKeyVal",
    ARCHIVED_KEY_VAL = "ArchivedKeyVal",
    BOOKMARK_TYPE_KEY_VAL = "BookmarkTypeKeyVal",
    ELEMENTS = "Elements",
    STRING = "string",
    ANY_CHAR = "anyChar",
    ORDER_BY = "OrderBy",
    SORT_LIST = "SortList",
    SORT_ITEM = "SortItem",
    SEARCH_BY_ID = "SearchById", // Not actually part of the query yet
    SELECT_ALL = "SelectAll", // Not actually part of the query yet
}

export abstract class ParsedExpression {
    type: ExpressionType;

    protected constructor(type: ExpressionType) {
        this.type = type;
    }

    async execute(
        _ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        return Promise.resolve(arrayToMap([]));
    }
}