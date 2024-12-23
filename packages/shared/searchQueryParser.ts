import {
  alt,
  alt_sc,
  apply,
  expectEOF,
  expectSingleResult,
  kmid,
  kright,
  lrec_sc,
  rule,
  seq,
  str,
  tok,
  Token,
  TokenPosition,
} from "typescript-parsec";
import { z } from "zod";

import { Matcher } from "./types/search";

enum TokenType {
  And = "AND",
  Or = "OR",

  Qualifier = "QUALIFIER",
  Ident = "IDENT",
  StringLiteral = "STRING_LITERAL",

  LParen = "LPAREN",
  RParen = "RPAREN",
  Space = "SPACE",
  Hash = "HASH",
}

class TokenImpl implements Token<TokenType> {
  constructor(
    private readonly lexer: Lexer,
    private readonly input: string,
    public kind: TokenType,
    public text: string,
    public pos: TokenPosition,
  ) {}

  matchRule(rest: string, pos: number, regex: RegExp): string | undefined {
    const res = regex.exec(rest);
    if (!res) {
      return undefined;
    }
    return res[0];
  }

  public get next(): Token<TokenType> | undefined {
    if (!this.input.length) {
      return undefined;
    }

    for (const [regex, tokenType] of this.lexer.lexerRules) {
      const match = this.matchRule(this.input, this.pos.index, regex);
      if (!match) {
        continue;
      }
      return new TokenImpl(
        this.lexer,
        this.input.slice(match.length),
        tokenType,
        match,
        {
          index: this.pos.index + match.length,
          columnBegin: this.pos.index + 1,
          columnEnd: this.pos.index + 1 + match.length,
          // Our strings are always only one line
          rowBegin: 1,
          rowEnd: 1,
        },
      );
    }
    // No match
    throw new Error(
      `Failed to tokenize the token at position ${this.pos.index}: ${this.input[0]}`,
    );
  }
}

class Lexer {
  // Rules are in order of priority
  lexerRules: readonly [RegExp, TokenType][] = [
    [/^and/i, TokenType.And],
    [/^or/i, TokenType.Or],

    [/^#/, TokenType.Hash],
    [/^(is|url|list|after|before):/, TokenType.Qualifier],

    [/^"([^"]+)"/, TokenType.StringLiteral],

    [/^\(/, TokenType.LParen],
    [/^\)/, TokenType.RParen],
    [/^\s+/, TokenType.Space],

    // This needs to be last as it matches a lot of stuff
    [/^[^ ")(]+/, TokenType.Ident],
  ] as const;
  constructor() {
    for (const [regex, _] of this.lexerRules) {
      if (!regex.source.startsWith("^")) {
        throw new Error("Regex must start with ^");
      }
    }
  }

  lex(query: string): Token<TokenType> | undefined {
    const tok = new TokenImpl(
      this,
      query,
      /* Doesn't matter */ TokenType.Ident,
      "",
      {
        index: 0,
        rowBegin: 1,
        rowEnd: 1,
        columnBegin: 0,
        columnEnd: 0,
      },
    );
    return tok.next;
  }
}

export interface TextAndMatcher {
  text: string;
  matcher?: Matcher;
}

const MATCHER = rule<TokenType, TextAndMatcher>();
const EXP = rule<TokenType, TextAndMatcher>();

MATCHER.setPattern(
  alt_sc(
    apply(kright(str("is:"), tok(TokenType.Ident)), (toks) => {
      switch (toks.text) {
        case "fav":
          return {
            text: "",
            matcher: { type: "favourited", favourited: true },
          };
        case "not_fav":
          return {
            text: "",
            matcher: { type: "favourited", favourited: false },
          };
        case "archived":
          return {
            text: "",
            matcher: { type: "archived", archived: true },
          };
        case "not_archived":
          return {
            text: "",
            matcher: { type: "archived", archived: false },
          };
        default:
          // If the token is not known, emit it as pure text
          return {
            text: `is:${toks.text}`,
            matcher: undefined,
          };
      }
    }),
    apply(
      seq(
        alt(tok(TokenType.Qualifier), tok(TokenType.Hash)),
        alt(
          apply(tok(TokenType.Ident), (tok) => {
            return tok.text;
          }),
          apply(tok(TokenType.StringLiteral), (tok) => {
            return tok.text.slice(1, -1);
          }),
        ),
      ),
      (toks) => {
        switch (toks[0].text) {
          case "url:":
            return {
              text: "",
              matcher: { type: "url", url: toks[1] },
            };
          case "#":
            return {
              text: "",
              matcher: { type: "tagName", tagName: toks[1] },
            };
          case "list:":
            return {
              text: "",
              matcher: { type: "listName", listName: toks[1] },
            };
          case "after:":
            return {
              text: "",
              matcher: {
                type: "dateAfter",
                dateAfter: z.coerce.date().parse(toks[1]),
              },
            };
          case "before:":
            return {
              text: "",
              matcher: {
                type: "dateBefore",
                dateBefore: z.coerce.date().parse(toks[1]),
              },
            };
          default:
            // If the token is not known, emit it as pure text
            return {
              text: toks[0].text + toks[1],
              matcher: undefined,
            };
        }
      },
    ),
    apply(seq(tok(TokenType.Ident), tok(TokenType.Space), MATCHER), (toks) => {
      return {
        text: [toks[0].text, toks[2].text].join(" ").trim(),
        matcher: toks[2].matcher,
      };
    }),
    apply(tok(TokenType.Ident), (toks) => {
      return {
        text: toks.text,
        matcher: undefined,
      };
    }),
    kmid(tok(TokenType.LParen), EXP, tok(TokenType.RParen)),
  ),
);

EXP.setPattern(
  lrec_sc(
    MATCHER,
    seq(
      alt(
        tok(TokenType.Space),
        kmid(tok(TokenType.Space), tok(TokenType.And), tok(TokenType.Space)),
        kmid(tok(TokenType.Space), tok(TokenType.Or), tok(TokenType.Space)),
      ),
      MATCHER,
    ),
    (toks, next) => {
      switch (next[0].kind) {
        case TokenType.Space:
        case TokenType.And:
          return {
            text: [toks.text, next[1].text].join(" ").trim(),
            matcher: {
              type: "and",
              matchers: [toks.matcher, next[1].matcher].filter(
                (a) => !!a,
              ) as Matcher[],
            },
          };
        case TokenType.Or:
          return {
            text: [toks.text, next[1].text].join(" ").trim(),
            matcher: {
              type: "or",
              matchers: [toks.matcher, next[1].matcher].filter(
                (a) => !!a,
              ) as Matcher[],
            },
          };
      }
    },
  ),
);

function flattenAndsAndOrs(matcher: Matcher): Matcher {
  switch (matcher.type) {
    case "and":
    case "or": {
      if (matcher.matchers.length == 1) {
        return flattenAndsAndOrs(matcher.matchers[0]);
      }
      const flattened: Matcher[] = [];
      for (let m of matcher.matchers) {
        // If inside the matcher is another matcher of the same type, flatten it
        m = flattenAndsAndOrs(m);
        if (m.type == matcher.type) {
          flattened.push(...m.matchers);
        } else {
          flattened.push(m);
        }
      }
      matcher.matchers = flattened;
      return matcher;
    }
    default:
      return matcher;
  }
}

export function _parseAndPrintTokens(query: string) {
  console.log(`PARSING: ${query}`);
  let tok = new Lexer().lex(query);
  do {
    console.log(tok?.kind, tok?.text);
    tok = tok?.next;
  } while (tok);
  console.log("DONE");
}

export function parseSearchQuery(query: string): TextAndMatcher {
  // _parseAndPrintTokens(query); // Uncomment to debug tokenization
  const parsed = expectSingleResult(
    expectEOF(EXP.parse(new Lexer().lex(query.trim()))),
  );
  if (parsed.matcher) {
    parsed.matcher = flattenAndsAndOrs(parsed.matcher);
  }
  return parsed;
}
