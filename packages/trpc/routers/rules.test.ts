import { beforeEach, describe, expect, test } from "vitest";

import { RuleEngineRule } from "@karakeep/shared/types/rules";

import type { CustomTestContext } from "../testUtils";
import { defaultBeforeEach } from "../testUtils";

beforeEach<CustomTestContext>(defaultBeforeEach(true));

describe("Rules Routes", () => {
  test<CustomTestContext>("create rule with valid data", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    const validRuleInput: Omit<RuleEngineRule, "id"> = {
      name: "Valid Rule",
      description: "A test rule",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "valid-tag-id" }],
    };

    const createdRule = await api.create(validRuleInput);
    expect(createdRule).toMatchObject({
      name: "Valid Rule",
      description: "A test rule",
      enabled: true,
      event: validRuleInput.event,
      condition: validRuleInput.condition,
      actions: validRuleInput.actions,
    });
  });

  test<CustomTestContext>("create rule fails with invalid data (no actions)", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    const invalidRuleInput: Omit<RuleEngineRule, "id"> = {
      name: "Invalid Rule",
      description: "Missing actions",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [], // Empty actions array - should fail validation
    };

    await expect(() => api.create(invalidRuleInput)).rejects.toThrow(
      /You must specify at least one action/,
    );
  });

  test<CustomTestContext>("create rule fails with invalid event (empty tagId)", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    const invalidRuleInput: Omit<RuleEngineRule, "id"> = {
      name: "Invalid Rule",
      description: "Invalid event",
      enabled: true,
      event: { type: "tagAdded", tagId: "" }, // Empty tagId - should fail
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "valid-tag-id" }],
    };

    await expect(() => api.create(invalidRuleInput)).rejects.toThrow(
      /You must specify a tag for this event type/,
    );
  });

  test<CustomTestContext>("create rule fails with invalid condition (empty tagId in hasTag)", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    const invalidRuleInput: Omit<RuleEngineRule, "id"> = {
      name: "Invalid Rule",
      description: "Invalid condition",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "hasTag", tagId: "" }, // Empty tagId - should fail
      actions: [{ type: "addTag", tagId: "valid-tag-id" }],
    };

    await expect(() => api.create(invalidRuleInput)).rejects.toThrow(
      /You must specify a tag for this condition type/,
    );
  });

  test<CustomTestContext>("update rule with valid data", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    // First, create a rule
    const createdRule = await api.create({
      name: "Original Rule",
      description: "Original desc",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "tag1" }],
    });

    const validUpdateInput: RuleEngineRule = {
      id: createdRule.id,
      name: "Updated Rule",
      description: "Updated desc",
      enabled: false,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "removeTag", tagId: "tag2" }],
    };

    const updatedRule = await api.update(validUpdateInput);
    expect(updatedRule).toMatchObject({
      id: createdRule.id,
      name: "Updated Rule",
      description: "Updated desc",
      enabled: false,
      event: validUpdateInput.event,
      condition: validUpdateInput.condition,
      actions: validUpdateInput.actions,
    });
  });

  test<CustomTestContext>("update rule fails with invalid data (empty action tagId)", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].rules;

    // First, create a rule
    const createdRule = await api.create({
      name: "Original Rule",
      description: "Original desc",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "tag1" }],
    });

    const invalidUpdateInput: RuleEngineRule = {
      id: createdRule.id,
      name: "Updated Rule",
      description: "Updated desc",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "removeTag", tagId: "" }], // Empty tagId - should fail
    };

    await expect(() => api.update(invalidUpdateInput)).rejects.toThrow(
      /You must specify a tag for this action type/,
    );
  });

  test<CustomTestContext>("delete rule", async ({ apiCallers }) => {
    const api = apiCallers[0].rules;

    const createdRule = await api.create({
      name: "Rule to Delete",
      description: "",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "tag1" }],
    });

    await api.delete({ id: createdRule.id });

    // Attempt to fetch the rule should fail
    await expect(() =>
      api.update({ ...createdRule, name: "Updated" }),
    ).rejects.toThrow(/Rule not found/);
  });

  test<CustomTestContext>("list rules", async ({ apiCallers }) => {
    const api = apiCallers[0].rules;

    await api.create({
      name: "Rule 1",
      description: "",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "tag1" }],
    });

    await api.create({
      name: "Rule 2",
      description: "",
      enabled: true,
      event: { type: "bookmarkAdded" },
      condition: { type: "alwaysTrue" },
      actions: [{ type: "addTag", tagId: "tag2" }],
    });

    const rulesList = await api.list();
    expect(rulesList.rules.length).toBeGreaterThanOrEqual(2);
    expect(rulesList.rules.some((rule) => rule.name === "Rule 1")).toBeTruthy();
    expect(rulesList.rules.some((rule) => rule.name === "Rule 2")).toBeTruthy();
  });
});
