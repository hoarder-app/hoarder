import createClient from "openapi-fetch";

import type { paths } from "./hoarder-api.d.ts";

export const createHoarderClient = createClient<paths>;
