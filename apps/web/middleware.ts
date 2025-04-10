import { withAuth } from "next-auth/middleware";

import { pages } from "./server/auth";

export default withAuth({
  pages,
});
