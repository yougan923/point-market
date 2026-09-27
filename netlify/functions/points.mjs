import { getStore } from "@netlify/blobs";

const store = getStore("point-market");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

async function getUsers() {
  const users = await store.get("users", {
    type: "json",
    consistency: "strong"
  });

  return users && typeof users === "object"
    ? users
    : {};
}

export default async function handler(request) {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  try {

    if (request.method === "POST") {

      const body = await request.json();

      const userId = String(body.userId || "").trim();

      if (!userId) {
        return json({
          error: "ユーザーIDがありません"
        }, 400);
      }

      const users = await getUsers();

      if (!users[userId]) {
        users[userId] = {
          points: 1000,
          createdAt: Date.now()
        };

        await store.setJSON(
          "users",
          users
        );
      }

      return json({
        userId,
        points: users[userId].points
      });
    }


    if (request.method === "GET") {

      const url = new URL(request.url);

      const userId =
        url.searchParams.get("userId");

      if (!userId) {
        return json({
          error: "ユーザーIDがありません"
        }, 400);
      }

      const users = await getUsers();

      if (!users[userId]) {
        users[userId] = {
          points: 1000,
          createdAt: Date.now()
        };

        await store.setJSON(
          "users",
          users
        );
      }

      return json({
        userId,
        points: users[userId].points
      });
    }


    return json({
      error: "Method Not Allowed"
    }, 405);

  } catch (error) {

    console.error(error);

    return json({
      error: "サーバーエラー"
    }, 500);
  }
}
