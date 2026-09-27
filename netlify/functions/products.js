import { getStore } from "@netlify/blobs";

const store = getStore("point-market");

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: HEADERS
  });
}

async function getProducts() {
  const products = await store.get("products", {
    type: "json",
    consistency: "strong"
  });

  return Array.isArray(products) ? products : [];
}

export default async function handler(request) {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: HEADERS
    });
  }

  try {

    /* =========================
       商品一覧
    ========================= */

    if (request.method === "GET") {

      const products = await getProducts();

      products.sort(
        (a, b) =>
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
      );

      return response(products);
    }


    /* =========================
       商品出品
    ========================= */

    if (request.method === "POST") {

      const body = await request.json();

      const title =
        String(body.title || "").trim();

      const description =
        String(body.description || "").trim();

      const seller =
        String(body.seller || "匿名").trim();

      const sellerId =
        String(body.sellerId || "").trim();

      const price =
        Number(body.price);


      if (!title) {
        return response(
          {
            error:
              "商品名を入力してください"
          },
          400
        );
      }


      if (
        !Number.isInteger(price) ||
        price <= 0
      ) {
        return response(
          {
            error:
              "価格が正しくありません"
          },
          400
        );
      }


      if (!sellerId) {
        return response(
          {
            error:
              "ユーザーIDがありません"
          },
          400
        );
      }


      const products =
        await getProducts();


      const product = {

        id:
          crypto.randomUUID(),

        title:
          title.slice(0, 100),

        description:
          description.slice(0, 1000),

        price:
          price,

        seller:
          seller.slice(0, 50) || "匿名",

        sellerId:
          sellerId,

        createdAt:
          Date.now()

      };


      products.unshift(product);


      await store.setJSON(
        "products",
        products
      );


      return response(
        product,
        201
      );
    }


    /* =========================
       商品削除
    ========================= */

    if (request.method === "DELETE") {

      const body =
        await request.json();

      const id =
        String(body.id || "").trim();

      const sellerId =
        String(body.sellerId || "").trim();


      if (!id) {
        return response(
          {
            error:
              "商品IDがありません"
          },
          400
        );
      }


      if (!sellerId) {
        return response(
          {
            error:
              "ユーザーIDがありません"
          },
          400
        );
      }


      const products =
        await getProducts();


      const product =
        products.find(
          p =>
            String(p.id) === id
        );


      if (!product) {
        return response(
          {
            error:
              "商品が見つかりません"
          },
          404
        );
      }


      /*
        出品者本人か確認
      */

      if (
        String(product.sellerId || "") !==
        sellerId
      ) {
        return response(
          {
            error:
              "自分の商品だけ削除できます"
          },
          403
        );
      }


      const newProducts =
        products.filter(
          p =>
            String(p.id) !== id
        );


      await store.setJSON(
        "products",
        newProducts
      );


      return response({
        success: true
      });
    }


    return response(
      {
        error:
          "Method Not Allowed"
      },
      405
    );

  } catch (error) {

    console.error(error);

    return response(
      {
        error:
          "サーバーエラーが発生しました"
      },
      500
    );
  }
}
