import { createFileRoute, redirect } from "@tanstack/react-router";

// Operations merged into the Monitor page.
export const Route = createFileRoute("/operations")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
