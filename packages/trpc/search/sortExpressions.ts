import type { Context } from "../index";
import { ZBookmarkIdx } from "@hoarder/shared/search";
import { bookmarks } from "@hoarder/db/schema";
import type { Index } from "meilisearch";
import { and, eq, inArray } from "drizzle-orm/expressions";
import { BookmarkSearchInfo, BookmarkSearchResultMap, ExpressionType, ParsedExpression } from "./parsedExpression";

type BookmarkComparator = (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => number;
enum SORT_ORDER {
    ASC = "asc",
    DESC = "desc"
}

export enum SORTING_KEYS {
    ID= "id", // fallback sorting key to get a stable result for e.g. pagination
    RANK= "rank",
    FAVOURITE = "favourite",
    CREATED_DATE = "createdDate",
    ARCHIVED = "archived",
    BOOKMARK_TYPE = "bookmarkType"
}

const BOOKMARK_TYPE_ORDER = {
    "link": 1,
    "text": 2,
    "asset": 3
};

const COMPARATOR_MAPPING: Record<SORTING_KEYS, BookmarkComparator> = {
    // At this point we have loaded all the values for sorting and therefore ignore the cases where they are not here (rank is an exception)
    [SORTING_KEYS.ID]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        if (value1.id < value2.id) {
            return -1;
        }
        if (value1.id > value2.id) {
            return 1;
        }
        return 0; // equal
    },
    [SORTING_KEYS.RANK]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        // Treat undefined as less than any number
        if (value1.ranking === undefined) {
            return value2.ranking === undefined ? 0 : -1;
        }
        if (value2.ranking === undefined) {
            return 1;
        }
        return value1.ranking - value2.ranking;
    },
    [SORTING_KEYS.FAVOURITE]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        if (value1.favourite === value2.favourite) {
            return 0;
        }
        return value1.favourite ? 1 : -1;
    },
    [SORTING_KEYS.CREATED_DATE]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        return value1.createdDate! - value2.createdDate!;
    },
    [SORTING_KEYS.ARCHIVED]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        if (value1.archived === value2.archived) {
            return 0;
        }
        return value1.archived ? 1 : -1;
    },
    [SORTING_KEYS.BOOKMARK_TYPE]: (value1: BookmarkSearchInfo, value2: BookmarkSearchInfo) => {
        if (!value1.bookmarkType || !value2.bookmarkType) {
            throw new Error("bookmarkType value has not been loaded");
        }
        if (BOOKMARK_TYPE_ORDER[value1.bookmarkType] < BOOKMARK_TYPE_ORDER[value2.bookmarkType]) {
            return -1;
        } else if (BOOKMARK_TYPE_ORDER[value1.bookmarkType] > BOOKMARK_TYPE_ORDER[value2.bookmarkType]) {
            return 1;
        } else {
            return 0;
        }
    }
};

export class SortExpression extends ParsedExpression {
    sortKey: SORTING_KEYS;
    sortOrder: SORT_ORDER;

    constructor(sortKey: string, sortOrder: string) {
        super(ExpressionType.SORT_ITEM);
        this.sortKey = sortKey as SORTING_KEYS;
        this.sortOrder = sortOrder as SORT_ORDER;
    }
}

function createReverseOrderComparator(comparator: BookmarkComparator): BookmarkComparator {
    return (value1, value2) => comparator(value1, value2) * -1;
}

export class OrderByExpression extends ParsedExpression {
    sortExpressions: SortExpression[];

    constructor(sortExpressions?: SortExpression[]) {
        super(ExpressionType.ORDER_BY);
        if (!sortExpressions) {
            this.sortExpressions = [new SortExpression(SORTING_KEYS.CREATED_DATE, "desc")];
        } else {
            this.sortExpressions = sortExpressions;
        }
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        if (bookmarks.size ===  0) {
            return bookmarks;
        }
        await enrichBookmarkDataForSorting(ctx, bookmarks);
        return this.sortBookmarks(bookmarks, this.bindComparator());
    }

    bindComparator(): BookmarkComparator {
        const sortExpressions = this.sortExpressions;
        let prevComparator = COMPARATOR_MAPPING[SORTING_KEYS.ID];
        for (let i = sortExpressions.length - 1; i>= 0; i--) {
            prevComparator = this.translateComparator(sortExpressions[i], prevComparator);
        }
        return prevComparator;
    }

    translateComparator(expression: SortExpression, previousComparator?: BookmarkComparator): BookmarkComparator {
        let comparator = COMPARATOR_MAPPING[expression.sortKey];
        if (expression.sortOrder === SORT_ORDER.DESC) {
            comparator = createReverseOrderComparator(comparator);
        }
        return (value1, value2) => {
            const compared = comparator(value1, value2);
            if (compared === 0 && previousComparator) {
                return previousComparator(value1, value2);
            }
            return compared;
        };
    }

    sortBookmarks(allBookmarks: BookmarkSearchResultMap, comparator: BookmarkComparator): BookmarkSearchResultMap {
        const array = Array.from(allBookmarks);
        array.sort((value1, value2) => comparator(value1[1], value2[1]));
        return new Map(array);
    }
}

async function enrichBookmarkDataForSorting(ctx: Context, allBookmarks: BookmarkSearchResultMap) {
    const bookmarkIds = Array.from(allBookmarks.keys());
    const loadedBookmarkInfo = await ctx.db
                                        .select({
                                            id: bookmarks.id,
                                            createdDate: bookmarks.createdAt,
                                            archived: bookmarks.archived,
                                            favourited: bookmarks.favourited,
                                            bookmarkType: bookmarks.type,
                                        })
                                        .from(bookmarks)
                                        .where(
                                            and(
                                                eq(bookmarks.userId, ctx.user!.id),
                                                inArray(bookmarks.id, bookmarkIds)
                                            )
                                        );

    // Update existing bookmarks with data from the select statement
    loadedBookmarkInfo.forEach((value) => {
        const bookmarkInfo = allBookmarks.get(value.id);
        // just in case it got deleted just now
        if (bookmarkInfo) {
            bookmarkInfo.createdDate = value.createdDate.getTime();
            bookmarkInfo.archived = value.archived;
            bookmarkInfo.favourite = value.favourited;
            bookmarkInfo.bookmarkType = value.bookmarkType;
        }
    });
}