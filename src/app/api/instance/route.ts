import { randomUUID } from "crypto";

/**
 * A UUID generated once per server process lifetime.
 * It changes every time the Next.js server (or Docker container) restarts,
 * allowing clients to detect a restart and clear stale session state.
 */
const INSTANCE_ID = randomUUID();

export async function GET() {
  return Response.json({ instanceId: INSTANCE_ID });
}
