import { withAuth } from "next-auth/middleware";

import { pages } from "./lib/pages";

export default withAuth({
  pages,
});
