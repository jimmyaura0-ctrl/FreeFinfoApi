export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      const body = await request.json();
      const uid = body.uid;
      const region = body.region || "IND";

      if (!uid) {
        return new Response(JSON.stringify({ success: false, message: "Enter UID" }), { status: 400, headers });
      }

      if (env.LIKES_KV) {
        const saved = await env.LIKES_KV.get(uid);
        if (saved) {
          return new Response(saved, { status: 200, headers });
        }
      }

      const res = await fetch(`https://gameskinbo.com{uid}&region=${region}`, {
        headers: {
          "Authorization": `Bearer ${env.KINBO_API_KEY}`,
          "x-api-key": env.KINBO_API_KEY
        }
      });

      const data = await res.json();
      const player = data.data || data;

      if (player && (player.nickname || player.name)) {
        const result = JSON.stringify({
          success: true,
          name: player.nickname || player.name,
          level: player.level || "N/A",
          likes: player.likes || "0",
          region: region
        });

        if (env.LIKES_KV) {
          await env.LIKES_KV.put(uid, result, { expirationTtl: 86400 });
        }

        return new Response(result, { status: 200, headers });
      }

      return new Response(JSON.stringify({ success: false, message: "Player not found" }), { status: 404, headers });

    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: "Error" }), { status: 500, headers });
    }
  }
};
