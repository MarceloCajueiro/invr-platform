import { createAuth } from "@/lib/auth/server";

export async function GET(req: Request) {
  const auth = await createAuth();
  return auth.handler(req);
}

export async function POST(req: Request) {
  const auth = await createAuth();
  return auth.handler(req);
}
