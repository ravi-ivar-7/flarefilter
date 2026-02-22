import { getAuth } from "~/lib/auth";
import type { Route } from "./+types/api.auth";

export async function loader({ request, context }: Route.LoaderArgs) {
    const auth = getAuth(context.cloudflare.env);
    return auth.handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
    const auth = getAuth(context.cloudflare.env);
    return auth.handler(request);
}
