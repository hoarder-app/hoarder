import { withAuth } from "next-auth/middleware";

import { pages } from "./server/pages";

export default withAuth({
  pages,
});
