import { syncAllClubs } from "@/lib/sync";

export async function POST() {
  const results = await syncAllClubs();
  return Response.json({ ok: true, results });
}
