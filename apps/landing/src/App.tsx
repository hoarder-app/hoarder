import Homepage from "@/src/Homepage";
import Privacy from "@/src/Privacy";

import "@karakeep/tailwind-config/globals.css";

export default function App() {
  // Poor man router
  if (window.location.pathname === "/privacy") {
    return <Privacy />;
  }

  return <Homepage />;
}
