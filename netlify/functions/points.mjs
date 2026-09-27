const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default async function handler(request) {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: HEADERS
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      userId:
        new URL(request.url)
          .searchParams
          .get("userId") || "test",
      points: 1000
    }),
    {
      status: 200,
      headers: HEADERS
    }
  );
}
