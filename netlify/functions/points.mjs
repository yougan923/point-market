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

async function getProducts() {
  const products = await store.get("products", {
    type: "json",
    consistency: "strong"
  });

  return Array.isArray(products)
    ? products
    : [];
}

export default async function handler(request) {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  try {

    /* =========================
       ユーザー作成・ポイント取得
    ========================= */

    if (request.method === "GET") {

      const url = new URL(request.url);
      const userId = String(
        url.searchParams.get("userId") || ""
      ).trim();

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

        await store.setJSON("users", users);
      }

      return json({
        userId,
        points: users[userId].points
      });
    }


    /* =========================
       ユーザー作成
    ========================= */

    if (request.method === "POST") {

      const body = await request.json();

      const action =
        String(body.action || "").trim();

      const userId =
        String(body.userId || "").trim();


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
      }


      /* =========================
         購入
      ========================= */

      if (action === "buy") {

        const productId =
          String(body.productId || "").trim();


        if (!productId) {
          return json({
            error: "商品IDがありません"
          }, 400);
        }


        const products =
          await getProducts();


        const index =
          products.findIndex(
            product =>
              product.id === productId
          );


        if (index === -1) {
          return json({
            error: "商品が見つかりません"
          }, 404);
        }


        const product =
          products[index];


        if (
          product.sellerId &&
          product.sellerId === userId
        ) {
          return json({
            error: "自分の商品は購入できません"
          }, 400);
        }


        const price =
          Number(product.price);


        if (
          !Number.isInteger(price) ||
          price <= 0
        ) {
          return json({
            error: "商品の価格が不正です"
          }, 400);
        }


        const buyer =
          users[userId];


        if (buyer.points < price) {
          return json({
            error: "ポイントが足りません",
            points: buyer.points
          }, 400);
        }


        /*
          購入者からポイントを減らす
        */

        buyer.points -= price;


        /*
          出品者が登録されている場合は
          出品者へポイントを渡す
        */

        if (
          product.sellerId &&
          product.sellerId !== userId
        ) {

          if (!users[product.sellerId]) {

            users[product.sellerId] = {
              points: 0,
              createdAt: Date.now()
            };

          }

          users[product.sellerId].points += price;
        }


        /*
          商品をマーケットから削除
        */

        products.splice(index, 1);


        /*
          商品とポイントを保存
        */

        await store.setJSON(
          "users",
          users
        );

        await store.setJSON(
          "products",
          products
        );


        return json({
          success: true,
          points: buyer.points,
          product
        });
      }


      /*
        通常のユーザー登録
      */

      await store.setJSON(
        "users",
        users
      );


      return json({
        success: true,
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
      error: "サーバーエラーが発生しました"
    }, 500);
  }
}
