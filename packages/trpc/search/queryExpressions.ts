import type { Context } from "../index";
import { ZBookmarkIdx } from "@hoarder/shared/search";
import { bookmarks, bookmarksInLists, bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";
import { arrayToMap, mergeMapsIntersection, mergeMapsUnion } from "./bookmarkOperations";
import type { Index } from "meilisearch";
import { OrderByExpression } from "./sortExpressions";
import { and, BinaryOperator, eq, gt, gte, inArray, lt, lte, not } from "drizzle-orm/expressions";
import { parse, startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { BookmarkSearchResultMap, ExpressionType, ParsedExpression } from "./parsedExpression";

export class QueryExpression extends ParsedExpression {
    expression: ParsedExpression;
    orderExpression: ParsedExpression;

    constructor(expression: ParsedExpression, orderExpression?: ParsedExpression) {
        super(ExpressionType.QUERY);
        this.expression = expression;
        if (orderExpression) {
            this.orderExpression = orderExpression;
        } else {
            this.orderExpression = new OrderByExpression();
        }
    }

    async execute(
        ctx: Context,
        client: Index<ZBookmarkIdx>,
        bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const selectedBookmarks = await this.expression.execute(ctx, client, bookmarks);
        return this.orderExpression.execute(ctx, client, selectedBookmarks);
    }
}

export class TagsInExpression extends ParsedExpression {
    tags: string[];
    negate: boolean;
    isId: boolean;

    constructor(tags: string[], negate: boolean, isId: boolean) {
        super(ExpressionType.TAGS_IN);
        this.tags = tags;
        this.negate = negate;
        // Indicates if the tags are ids or the name of the tags
        this.isId = isId;
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        let tagIds;
        if (this.isId) {
            tagIds = this.tags;
        } else {
            tagIds = ctx.db
                 .select({
                     tagId: bookmarkTags.id
                 })
                 .from(bookmarkTags)
                 .where(
                     and(
                         eq(bookmarkTags.userId, ctx.user!.id),
                         inArray(bookmarkTags.name, this.tags)
                     )
                 );
        }

        let expression = inArray(tagsOnBookmarks.tagId, tagIds);
        if (this.negate) {
            expression = not(expression);
        }
        let bookmarks = await ctx.db
                                       .selectDistinct({
                                           id: tagsOnBookmarks.bookmarkId
                                       })
                                       .from(tagsOnBookmarks)
                                       .where(expression);
        return arrayToMap(bookmarks);
    }
}

export class ListEqualsExpression extends ParsedExpression {
    listId: string;

    constructor(listId: string) {
        super(ExpressionType.LIST_KEY_VAL);
        this.listId = listId;
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const bookmarkIds = await ctx.db
                               .select({
                                   id: bookmarksInLists.bookmarkId
                               })
                               .from(bookmarksInLists)
                               .where(
                                   eq(bookmarksInLists.listId, this.listId)
                               );

        return arrayToMap(bookmarkIds);
    }
}

export class StringExpression extends ParsedExpression {
    value: string;

    constructor(value: string) {
        super(ExpressionType.STRING);
        this.value = value;
    }
}

export class TextSearchExpression extends ParsedExpression {
    text: string;

    constructor(text: string) {
        super(ExpressionType.TEXT_KEY_VAL);
        this.text = text;
    }

    async execute(
        ctx: Context,
        client: Index<ZBookmarkIdx>,
        bookmarkMap: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const filter = [`userId = '${ctx.user!.id}'`];
        if (bookmarkMap.size > 0) {
            const bookmarkIds = Array.from(bookmarkMap.keys());
            filter.push(`id IN [${bookmarkIds.join(",")}]`);
        }

        const resp = await client.search(this.text, {
            filter,
            showRankingScore: true,
            attributesToRetrieve: ["id"],
            sort: ["createdAt:desc"],
            limit: 1000
        });

        if (resp.hits.length == 0) {
            return arrayToMap([]);
        }
        const result = await ctx.db.query.bookmarks.findMany({
            columns: {
                id: true
            },
            where: and(
                eq(bookmarks.userId, ctx.user!.id),
                inArray(
                    bookmarks.id,
                    resp.hits.map((h) => h.id)
                )
            )
        });
        return arrayToMap(result);
    }
}

export class BookmarkTypeSearchExpression extends ParsedExpression {
    bookmarkType: "link" | "text" | "asset";

    constructor(bookmarkType: string) {
        super(ExpressionType.BOOKMARK_TYPE_KEY_VAL);
        if (bookmarkType === "text" || bookmarkType === "link" || bookmarkType === "asset") {
            this.bookmarkType = bookmarkType;
        } else {
            throw new Error("unknown bookmark type specified");
        }
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarkMap: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const result = await ctx.db
                                .select({
                                    id: bookmarks.id
                                })
                                .from(bookmarks)
                                .where(
                                    and(eq(bookmarks.userId, ctx.user!.id),
                                        eq(bookmarks.type, this.bookmarkType))
                                );
        return arrayToMap(result);
    }
}

export class BooleanSearchExpression extends ParsedExpression {
    booleanValue: boolean;

    constructor(expressionType: ExpressionType, booleanString: string) {
        super(expressionType);

        this.booleanValue = booleanString === "true";
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarkMap: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        let equalsStatement;
        if (this.type === ExpressionType.ARCHIVED_KEY_VAL) {
            equalsStatement = eq(bookmarks.archived, this.booleanValue);
        } else {
            equalsStatement = eq(bookmarks.favourited, this.booleanValue);
        }

        const result = await ctx.db
                                .selectDistinct({
                                    id: bookmarks.id
                                })
                                .from(bookmarks)
                                .where(
                                    and(
                                        eq(bookmarks.userId, ctx.user!.id),
                                        equalsStatement
                                    )
                                )
        return arrayToMap(result);
    }
}

export abstract class CreatedDateSearchExpression extends ParsedExpression {
    date: Date;
    operator: BinaryOperator;

    protected constructor(type: ExpressionType, operator: string, date: Date) {
        super(type);
        this.date = date;
        this.operator = translateOperator(operator);
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarkMap: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const result = await ctx.db
                                .selectDistinct({
                                    id: bookmarks.id
                                })
                                .from(bookmarks)
                                .where(
                                    and(
                                        eq(bookmarks.userId, ctx.user!.id),
                                        this.operator(bookmarks.createdAt, this.date)
                                    )
                                )
        return arrayToMap(result);
    }
}

function translateOperator(operator: string) {
    switch (operator) {
        case "<":
            return lt;
        case "<=":
            return lte;
        case ">":
            return gt;
        case ">=":
            return gte;
        case "=":
            return eq;
    }
    throw new Error("Not possible, just for typescript");
}

function translateAbsoluteDate(dateString: string) {
    return parse(dateString.replaceAll("\"", ""), "dd-mm-yyyy", new Date());
}

export class AbsoluteCreatedDateSearchExpression extends CreatedDateSearchExpression {
    dateString: string;

    constructor(operator: string, dateString: string) {
        const date = translateAbsoluteDate(dateString);
        super(ExpressionType.CREATED_DATE_KEY_VAL, operator, date);
        this.dateString = dateString;
    }
}

export class RelativeCreatedDateSearchExpression extends CreatedDateSearchExpression {
    relativeDateString: string;
    quantity: string;

    constructor(operatorString: string, relativeDateString: string, quantity: string) {
        const relativeDate = translateRelativeDate(parseInt(relativeDateString), quantity);
        super(ExpressionType.CREATED_DATE_KEY_VAL_RELATIVE, operatorString, relativeDate);

        this.relativeDateString = relativeDateString;
        this.quantity = quantity;
    }
}

function translateRelativeDate(relativeDate: number, quantity: string) {
    const currentDate = new Date();
    switch (quantity) {
        case "d":
            return startOfDay(subDays(currentDate, relativeDate));
        case "w":
            return startOfDay(subWeeks(currentDate, relativeDate));
        case "m":
            return startOfDay(subMonths(currentDate, relativeDate));
        case "y":
            return startOfDay(subYears(currentDate, relativeDate));
    }
    throw new Error("Not possible, just for typescript");
}

export class LogicalExpression extends ParsedExpression {
    left: ParsedExpression;
    right: ParsedExpression;

    constructor(
        type: ExpressionType,
        left: ParsedExpression,
        right: ParsedExpression
    ) {
        super(type);

        this.left = left;
        this.right = right;
    }

    async execute(
        ctx: Context,
        client: Index<ZBookmarkIdx>,
        bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        let leftBookmarkSearchInfo;
        let rightBookmarkSearchInfo;
        if (this.type === ExpressionType.AND) {
            // If one of the children is a text= expression and this is an AND expression, we validate the other expression first and then pass the ids to meilisearch.
            // Meilisearch has a limit of 1000 results by default, so narrowing down the amount of bookmarks to search will help
            if (this.left instanceof TextSearchExpression) {
                rightBookmarkSearchInfo = await this.right.execute(ctx, client, new Map());
                leftBookmarkSearchInfo = await this.left.execute(ctx, client, rightBookmarkSearchInfo);
            } else if (this.right instanceof TextSearchExpression) {
                leftBookmarkSearchInfo = await this.left.execute(ctx, client, new Map());
                rightBookmarkSearchInfo = await this.right.execute(ctx, client, leftBookmarkSearchInfo);
            } else {
                leftBookmarkSearchInfo = await this.left.execute(ctx, client, bookmarks);
                rightBookmarkSearchInfo = await this.right.execute(ctx, client, bookmarks);
            }
            return mergeMapsIntersection(leftBookmarkSearchInfo, rightBookmarkSearchInfo);
        }
        leftBookmarkSearchInfo = await this.left.execute(ctx, client, bookmarks);
        rightBookmarkSearchInfo = await this.right.execute(ctx, client, bookmarks);
        return mergeMapsUnion(leftBookmarkSearchInfo, rightBookmarkSearchInfo);
    }
}

export class SearchByIdExpression extends ParsedExpression {
    ids: string[]

    constructor(ids: string[]) {
        super(ExpressionType.SEARCH_BY_ID);

        this.ids = ids;
    }

    async execute(
        _ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const searchInfo = this.ids.map((id) => {
            return { id };
        });
        return arrayToMap(searchInfo);
    }
}

export class SelectAllSearchExpression extends ParsedExpression {
    constructor() {
        super(ExpressionType.SELECT_ALL);
    }

    async execute(
        ctx: Context,
        _client: Index<ZBookmarkIdx>,
        _bookmarks: BookmarkSearchResultMap
    ): Promise<BookmarkSearchResultMap> {
        const result = await ctx.db
                                .select({
                                    id: bookmarks.id
                                })
                                .from(bookmarks)
                                .where(
                                    eq(bookmarks.userId, ctx.user!.id)
                                )
        return arrayToMap(result);
    }
}