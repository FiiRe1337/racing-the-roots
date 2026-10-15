import { createFileRoute } from "@tanstack/react-router";
import { Grid90 } from "@/game/Grid90";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Grid90 />;
}
