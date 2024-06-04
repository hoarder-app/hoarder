import { SearchQueryGrammar } from "./query/searchQuery.ohm-bundle";
import * as ohm from "ohm-js";
import { ExpressionType, ParsedExpression } from "./parsedExpression";
import {
    BookmarkTypeSearchExpression,
    BooleanSearchExpression,
    AbsoluteCreatedDateSearchExpression,
    RelativeCreatedDateSearchExpression,
    LogicalExpression,
    QueryExpression,
    StringExpression,
    TagsInExpression,
    TextSearchExpression, ListEqualsExpression
} from "./queryExpressions";
import { OrderByExpression, SortExpression } from "./sortExpressions";

export interface ExtendedNode<T> extends ohm.Node {
    visit: () => T;
}

export const queryGrammar: SearchQueryGrammar = ohm.grammar(String.raw`
Query {
  Query       = Exp OrderBy?
  Exp         = Or
               | AndExp
  Or        = Exp caseInsensitive<"or"> AndExp
  And         = AndExp caseInsensitive<"and"> Term
  AndExp      = And 
               | Term
  Term        = Group
               | KeyVal
               | TagsIn
               | TagsNotIn
               | ListKeyVal
  Group       = "(" Exp ")"
  KeyVal      = TextKeyVal
               | CreatedDateKeyVal
               | CreatedDateKeyValRelative
               | FavouriteKeyVal
               | ArchivedKeyVal
               | BookmarkTypeKeyVal
  TagsIn      = "tags" "in" "[" Elements "]"
  TagsNotIn   = "tags" "not" "in" "[" Elements "]"
  ListKeyVal     = "list" "=" string
  TextKeyVal  = "text" "=" string
  CreatedDateKeyVal = "createdDate" ("<=" | ">=" | "=" | "<" | ">") date
  CreatedDateKeyValRelative = "createdDate" ("<=" | ">=" | "=" | "<" | ">") "\"" "-" number ("d" | "w" | "m" | "y") "\""
  FavouriteKeyVal = "favourite" "=" boolean
  ArchivedKeyVal = "archived" "=" boolean
  BookmarkTypeKeyVal = "bookmarkType" "=" "\"" ("link" | "text" | "asset") "\""
  Elements    = string ("," string)*
  boolean     = "true" | "false"
  string      = "\"" anyChar* "\""
  date        = "\"" digit digit? "-" digit digit? "-" digit digit digit digit "\""
  number      = digit+
  anyChar   = ~"\"" any
  
  OrderBy     = caseInsensitive<"order by"> SortList
  SortList    = SortItem ("," SortItem)*
  SortItem    = SortKey SortOrder?
  SortKey     = "rank" | "favourite" | "createdDate" | "archived" | "bookmarkType"
  SortOrder   = caseInsensitive<"asc"> | caseInsensitive<"desc">
}
`);

function toStringArray(children: StringExpression[]) {
    return children.map((child) => {
        return child.value;
    });
}

export const searchQuerySemantics = queryGrammar.createSemantics();

searchQuerySemantics.addOperation<ParsedExpression>("visit", {
    [ExpressionType.QUERY as string]: function (
        exp: ExtendedNode<ParsedExpression>,
        orderBy: ExtendedNode<ParsedExpression>) {
        const expression = exp.visit();
        const orderExpression = orderBy.visit();
        return new QueryExpression(expression, orderExpression);
    },
    [ExpressionType.ORDER_BY as string]: function (
        _orderBy: ExtendedNode<ParsedExpression>,
        sortList: ExtendedNode<ParsedExpression>) {
        return sortList.visit();
    },
    [ExpressionType.SORT_LIST as string]: function (
        _one: ExtendedNode<ParsedExpression>,
        _comma: ExtendedNode<ParsedExpression>,
        _two: ExtendedNode<ParsedExpression>) {
        let allChildren = [];
        allChildren.push(_one);
        allChildren = allChildren.concat(_two.children as ExtendedNode<ParsedExpression>[]);
        return new OrderByExpression(allChildren.map((child: ExtendedNode<ParsedExpression>) => child.visit()) as SortExpression[]);
    },
    [ExpressionType.SORT_ITEM as string]: function (
        sortKey: ExtendedNode<ParsedExpression>,
        sortOrder: ExtendedNode<ParsedExpression>) {
        return new SortExpression(sortKey.sourceString, sortOrder.sourceString);
    },
    [ExpressionType.OR as string]: function (
        left: ExtendedNode<ParsedExpression>,
        _and: ohm.NonterminalNode,
        right: ExtendedNode<ParsedExpression>
    ) {
        const leftExpression = left.visit();
        const rightExpression = right.visit();
        return new LogicalExpression(
            ExpressionType.OR,
            leftExpression,
            rightExpression
        );
    },
    [ExpressionType.AND as string]: function (
        left: ExtendedNode<ParsedExpression>,
        _and: ohm.NonterminalNode,
        right: ExtendedNode<ParsedExpression>
    ) {
        const leftExpression = left.visit();
        const rightExpression = right.visit();
        return new LogicalExpression(
            ExpressionType.AND,
            leftExpression,
            rightExpression
        );
    },
    [ExpressionType.GROUP as string]: function (
        _var1: ohm.NonterminalNode,
        expression: ExtendedNode<ParsedExpression>,
        _var3: ohm.NonterminalNode
    ) {
        return expression.visit();
    },
    [ExpressionType.TAGS_IN as string]: function (
        _tags: ohm.NonterminalNode,
        _in: ohm.NonterminalNode,
        _par: ohm.NonterminalNode,
        elements: ExtendedNode<StringExpression[]>,
        _par2: ohm.NonterminalNode
    ) {
        return new TagsInExpression(toStringArray(elements.visit()), false, false);
    },
    [ExpressionType.LIST_KEY_VAL as string]: function (
        _list: ohm.NonterminalNode,
        _equals: ohm.NonterminalNode,
        string: ExtendedNode<string>,
    ) {
        return new ListEqualsExpression(string.visit());
    },
    [ExpressionType.TAGS_NOT_IN as string]: function (
        _tags: ohm.NonterminalNode,
        _not: ohm.NonterminalNode,
        _in: ohm.NonterminalNode,
        _par: ohm.NonterminalNode,
        elements: ExtendedNode<StringExpression[]>,
        _par2: ohm.NonterminalNode
    ) {
        return new TagsInExpression(toStringArray(elements.visit()), true, false);
    },
    [ExpressionType.TEXT_KEY_VAL as string]: function (
        _text: ExtendedNode<ParsedExpression>,
        _equals: ExtendedNode<ParsedExpression>,
        string: ExtendedNode<string>
    ) {
        return new TextSearchExpression(string.visit());
    },
    [ExpressionType.CREATED_DATE_KEY_VAL as string]: function (
        _createdDate: ExtendedNode<ParsedExpression>,
        operator: ExtendedNode<ParsedExpression>,
        date: ExtendedNode<ParsedExpression>
    ) {
        return new AbsoluteCreatedDateSearchExpression(operator.sourceString, date.sourceString);
    },
    [ExpressionType.CREATED_DATE_KEY_VAL_RELATIVE as string]: function (
        _createdDate: ExtendedNode<ParsedExpression>,
        operator: ExtendedNode<ParsedExpression>,
        _quote1: ExtendedNode<ParsedExpression>,
        _dash: ExtendedNode<ParsedExpression>,
        number: ExtendedNode<ParsedExpression>,
        quantity: ExtendedNode<ParsedExpression>,
        _quote2: ExtendedNode<ParsedExpression>) {
        return new RelativeCreatedDateSearchExpression(operator.sourceString, number.sourceString, quantity.sourceString);
    },
    [ExpressionType.FAVOURITE_KEY_VAL as string]: function (
        _favourite: ExtendedNode<ParsedExpression>,
        _equals: ExtendedNode<ParsedExpression>,
        boolean: ExtendedNode<ParsedExpression>) {
        return new BooleanSearchExpression(ExpressionType.FAVOURITE_KEY_VAL, boolean.sourceString);
    },
    [ExpressionType.ARCHIVED_KEY_VAL as string]: function (
        _archived: ExtendedNode<ParsedExpression>,
        _equals: ExtendedNode<ParsedExpression>,
        boolean: ExtendedNode<ParsedExpression>) {
        return new BooleanSearchExpression(ExpressionType.ARCHIVED_KEY_VAL, boolean.sourceString);
    },
    [ExpressionType.BOOKMARK_TYPE_KEY_VAL as string]: function (
        _type: ExtendedNode<ParsedExpression>,
        _equals: ExtendedNode<ParsedExpression>,
        _quote1: ExtendedNode<ParsedExpression>,
        bookmarkType: ExtendedNode<ParsedExpression>,
        _quote2: ExtendedNode<ParsedExpression>
    ) {
        return new BookmarkTypeSearchExpression(bookmarkType.sourceString);
    },
    [ExpressionType.ELEMENTS as string]: function (
        string: ExtendedNode<ParsedExpression[]>,
        _comma: ohm.NonterminalNode,
        strings: ExtendedNode<ParsedExpression[]>
    ) {
        const child = string.children[1];
        let allChildren = [];
        allChildren.push(child);
        allChildren = allChildren.concat(strings.children);
        return (allChildren as ExtendedNode<ParsedExpression>[])
            .map((string: ExtendedNode<ParsedExpression>) => new StringExpression(string.sourceString.replaceAll("\"", "")));
    },
    [ExpressionType.STRING as string]: function (
        _par1: ohm.NonterminalNode,
        stringPart: ExtendedNode<string[]>,
        _par2: ohm.NonterminalNode
    ) {
        return stringPart.sourceString.replaceAll("\"", "");
    },
    [ExpressionType.ANY_CHAR as string]: function (var1: ohm.NonterminalNode) {
        return var1.sourceString;
    },

    _nonterminal: function (this: ohm.NonterminalNode, ...children: ohm.Node[]) {
        // This function will be called for every nonterminal node in the parse tree.
        // `children` is an array of child nodes.
        if (children.length === 1) {
            return children[0].visit();
        }
        throw Error("not implemented");
    },
    _terminal: function (): ParsedExpression {
        // This function will be called for every terminal node in the parse tree.
        // Terminal nodes represent the actual characters in the input.
        return null as unknown as ParsedExpression;
    },
    _iter: function (...children) {
        // This function will be called for every iteration node in the parse tree.
        // `children` is an array of child nodes.
        if (children.length === 1) {
            return children[0].visit();
        }
        if (children.length === 0) {
            return null;
        }
        throw Error("not implemented");
    }
});