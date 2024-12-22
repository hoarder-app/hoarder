import {
  alt,
  alt_sc,
  apply,
  buildLexer,
  expectEOF,
  expectSingleResult,
  kmid,
  lrec_sc,
  rule,
  seq,
  tok,
} from "typescript-parsec";
import { z } from "zod";

import { Matcher } from "./types/search";

enum TokenType {
  And = "AND",
  Or = "OR",

  // Is Queries
  Favourited = "FAVOURITED",
  NotFavourited = "NOT_FAVOURITED",
  Archived = "ARCHIVED",
  NotArchived = "NOT_ARCHIVED",

  // Filters
  Url = "URL",
  Tag = "TAG",
  List = "LIST",
  After = "AFTER",
  Before = "BEFORE",
  UrlPrefix = "URL_PREFIX",
  TagPrefix = "TAG_PREFIX",
  ListPrefix = "LIST_PREFIX",

  StringLiteral = "STRING_LITERAL",

  LParen = "LPAREN",
  RParen = "RPAREN",
  Space = "SPACE",
}

const lexer = buildLexer([
  [true, /^(and)/gi, TokenType.And],
  [true, /^(or)/gi, TokenType.Or],

  // Is Queries
  [true, /^is:fav/g, TokenType.Favourited],
  [true, /^is:not_fav/g, TokenType.NotFavourited],
  [true, /^is:archived/g, TokenType.Archived],
  [true, /^is:not_archived/g, TokenType.NotArchived],

  // String Filter
  [true, /^url:/gi, TokenType.UrlPrefix],
  [true, /^#/g, TokenType.TagPrefix],
  [true, /^list:/gi, TokenType.ListPrefix],

  [true, /^url:[^" \\) ]+/gi, TokenType.Url],
  [true, /^#[^" \\) ]+/gi, TokenType.Tag],
  [true, /^list:[^" \\)]+/gi, TokenType.List],
  [true, /^list:[^" \\)]+/gi, TokenType.List],
  [true, /^after:\d{4}-\d{2}-\d{2}/gi, TokenType.After],
  [true, /^before:\d{4}-\d{2}-\d{2}/gi, TokenType.Before],

  [true, /^"([^"]+)"/g, TokenType.StringLiteral],

  [true, /^\(/g, TokenType.LParen],
  [true, /^\)/g, TokenType.RParen],
  [true, /^\s+/g, TokenType.Space],
]);

const ONE_MATCHER = rule<TokenType, Matcher>();
const EXP = rule<TokenType, Matcher>();

ONE_MATCHER.setPattern(
  alt_sc(
    apply(
      alt(
        tok(TokenType.Favourited),
        tok(TokenType.NotFavourited),
        tok(TokenType.Archived),
        tok(TokenType.NotArchived),
      ),
      (toks) => {
        switch (toks.kind) {
          case TokenType.Favourited:
            return { type: "favourited", favourited: true };
          case TokenType.NotFavourited:
            return { type: "favourited", favourited: false };
          case TokenType.Archived:
            return { type: "archived", archived: true };
          case TokenType.NotArchived:
            return { type: "archived", archived: false };
        }
      },
    ),
    apply(
      seq(
        alt(
          tok(TokenType.UrlPrefix),
          tok(TokenType.TagPrefix),
          tok(TokenType.ListPrefix),
        ),
        apply(tok(TokenType.StringLiteral), (tok) => {
          return tok.text.slice(1, -1);
        }),
      ),
      (toks) => {
        switch (toks[0].kind) {
          case TokenType.UrlPrefix:
            return { type: "url", url: toks[1] };
          case TokenType.TagPrefix:
            return { type: "tagName", tagName: toks[1] };
          case TokenType.ListPrefix:
            return { type: "listName", listName: toks[1] };
        }
      },
    ),
    apply(
      alt(
        tok(TokenType.Url),
        tok(TokenType.Tag),
        tok(TokenType.List),
        tok(TokenType.After),
        tok(TokenType.Before),
      ),
      (toks) => {
        switch (toks.kind) {
          case TokenType.Url:
            return { type: "url", url: toks.text.slice("url:".length) };
          case TokenType.Tag:
            return { type: "tagName", tagName: toks.text.slice("#".length) };
          case TokenType.List:
            return {
              type: "listName",
              listName: toks.text.slice("list:".length),
            };
          case TokenType.After:
            return {
              type: "dateAfter",
              dateAfter: z.coerce
                .date()
                .parse(toks.text.slice("after:".length)),
            };
          case TokenType.Before:
            return {
              type: "dateBefore",
              dateBefore: z.coerce
                .date()
                .parse(toks.text.slice("before:".length)),
            };
        }
      },
    ),
    kmid(tok(TokenType.LParen), EXP, tok(TokenType.RParen)),
  ),
);

EXP.setPattern(
  lrec_sc(
    ONE_MATCHER,
    seq(
      alt(
        tok(TokenType.Space),
        kmid(tok(TokenType.Space), tok(TokenType.And), tok(TokenType.Space)),
        kmid(tok(TokenType.Space), tok(TokenType.Or), tok(TokenType.Space)),
      ),
      ONE_MATCHER,
    ),
    (toks, next) => {
      switch (next[0].kind) {
        case TokenType.Space:
        case TokenType.And:
          return { type: "and", matchers: [toks, next[1]] };
        case TokenType.Or:
          return { type: "or", matchers: [toks, next[1]] };
      }
    },
  ),
);

export function parseSearchQuery(query: string): Matcher {
  return expectSingleResult(expectEOF(EXP.parse(lexer.parse(query))));
}
