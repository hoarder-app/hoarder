import * as fs from "fs";
import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import { registry as bookmarksRegistry } from "./lib/bookmarks";
import { registry as commonRegistry } from "./lib/common";
import { registry as listsRegistry } from "./lib/lists";
import { registry as tagsRegistry } from "./lib/tags";

function getOpenApiDocumentation() {
  const registry = new OpenAPIRegistry([
    commonRegistry,
    bookmarksRegistry,
    listsRegistry,
    tagsRegistry,
  ]);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Hoarder API",
      description: "The API for the Hoarder app",
    },
    servers: [{ url: "v1" }],
  });
}

function writeDocumentation() {
  const docs = getOpenApiDocumentation();
  const fileContent = JSON.stringify(docs, null, 2);
  fs.writeFileSync(`./hoarder-openapi-spec.json`, fileContent, {
    encoding: "utf-8",
  });
}

writeDocumentation();
