import type { RuleEngineCondition } from "../types/rules";
import { parseSearchQuery } from "../searchQueryParser";

function withQualifier(
  prefix: string,
  value: string | undefined,
): string | null {
  if (!value) {
    return null;
  }
  if (!value.includes('"')) {
    return `${prefix}"${value}"`;
  }
  // Quoted strings can't contain quotes, so this only works for values that
  // the parser reads back as a single unquoted word.
  const query = `${prefix}${value}`;
  const parsed = parseSearchQuery(query);
  return parsed.result === "full" && parsed.matcher && parsed.text === ""
    ? query
    : null;
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
  switch (condition.type) {
    case "alwaysTrue":
      return "";
    // The url rules only match links, while url: also matches assets
    case "urlContains": {
      const q = withQualifier("url:", condition.str);
      return q === null ? null : `is:link ${q}`;
    }
    case "urlDoesNotContain": {
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
      if (condition.type === "or" && condition.conditions.length === 0) {
        // An empty "or" matches nothing
        return null;
      }
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
