import type { RuleEngineCondition } from "../types/rules";

function quote(value: string): string | null {
  if (value.length === 0) {
    return null;
  }
  if (!value.includes('"')) {
    return `"${value}"`;
  }
  // Quoted strings can't contain quotes, so this only works for values that
  // can be written unquoted.
  return /^[^\s()"-][^\s()]*$/.test(value) ? value : null;
}

/**
 * Collects the ids of the tags and feeds referenced by a condition.
 */
export function getRuleConditionReferences(condition: RuleEngineCondition): {
  tagIds: string[];
  feedIds: string[];
} {
  const tagIds = new Set<string>();
  const feedIds = new Set<string>();
  const visit = (c: RuleEngineCondition) => {
    switch (c.type) {
      case "hasTag":
        tagIds.add(c.tagId);
        break;
      case "importedFromFeed":
        feedIds.add(c.feedId);
        break;
      case "and":
      case "or":
        c.conditions.forEach(visit);
        break;
    }
  };
  visit(condition);
  return { tagIds: [...tagIds], feedIds: [...feedIds] };
}

/**
 * Translates a rule condition into a search query that matches the same
 * bookmarks. Returns an empty string for conditions that match everything,
 * and null when the condition can't be expressed in the query language.
 */
export function ruleConditionToSearchQuery(
  condition: RuleEngineCondition,
  names: {
    tags: Record<string, string>;
    feeds: Record<string, string>;
  },
): string | null {
  const withQualifier = (prefix: string, value: string | undefined) => {
    if (value === undefined) {
      return null;
    }
    const quoted = quote(value);
    return quoted === null ? null : `${prefix}${quoted}`;
  };

  switch (condition.type) {
    case "alwaysTrue":
      return "";
    case "urlContains":
      return withQualifier("url:", condition.str);
    case "urlDoesNotContain": {
      // The rule only matches links
      const q = withQualifier("-url:", condition.str);
      return q === null ? null : `is:link ${q}`;
    }
    case "titleContains":
      return withQualifier("title:", condition.str);
    case "titleDoesNotContain":
      return withQualifier("-title:", condition.str);
    case "importedFromFeed":
      return withQualifier("feed:", names.feeds[condition.feedId]);
    case "bookmarkTypeIs":
      return {
        link: "is:link",
        text: "is:text",
        asset: "is:media",
      }[condition.bookmarkType];
    case "bookmarkSourceIs":
      return `source:${condition.source}`;
    case "hasTag":
      return withQualifier("#", names.tags[condition.tagId]);
    case "isFavourited":
      return "is:fav";
    case "isArchived":
      return "is:archived";
    case "and":
    case "or": {
      const parts: string[] = [];
      for (const c of condition.conditions) {
        const q = ruleConditionToSearchQuery(c, names);
        if (q === null) {
          return null;
        }
        if (q === "") {
          // Matching everything makes an "or" match everything, and is a
          // no-op in an "and".
          if (condition.type === "or") {
            return "";
          }
          continue;
        }
        parts.push(q);
      }
      if (parts.length <= 1) {
        return parts[0] ?? "";
      }
      return parts
        .map((p) => (p.includes(" ") ? `(${p})` : p))
        .join(` ${condition.type} `);
    }
    default: {
      const _exhaustiveCheck: never = condition;
      return null;
    }
  }
}
