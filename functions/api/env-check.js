export async function onRequestGet({ env }) {
  const hasDataGoKrKey =
    typeof env.DATA_GO_KR_KEY === "string" && env.DATA_GO_KR_KEY.trim().length > 0;

  return Response.json(
    {
      ok: true,
      hasDataGoKrKey,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
