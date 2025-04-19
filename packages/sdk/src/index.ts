import createClient from "openapi-fetch";

import type { components, paths } from "./karakeep-api.js";

/**
 * @deprecated Use createKarakeepClient instead.
 */
export const createKarakeepClient = createClient<paths>;

export const createKarakeepClient = createClient<paths>;

export type KarakeepAPISchemas = components["schemas"];
