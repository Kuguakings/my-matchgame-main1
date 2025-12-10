const fs = require("fs/promises");
const path = require("path");

let supabasePromise = null;

function ensureSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!supabasePromise) {
    supabasePromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, key)
    );
  }
  return supabasePromise;
}

async function readFallbackLevels() {
  const levelsFile = path.join(process.cwd(), "src", "js", "levels.json");
  const raw = await fs.readFile(levelsFile, "utf8");
  return JSON.parse(raw);
}

async function getLevelsFromSupabase(client) {
  const { data, error } = await client
    .from("levels")
    .select("level_data")
    .order("id", { ascending: true });

  if (error) throw error;
  return data.map((row) => row.level_data);
}

async function saveLevelsToSupabase(client, levels) {
  const { error: deleteError } = await client
    .from("levels")
    .delete()
    .neq("id", 0);
  if (deleteError) throw deleteError;

  const rows = levels.map((level) => ({ level_data: level }));
  const { data, error } = await client.from("levels").insert(rows).select();
  if (error) throw error;
  return data?.length || 0;
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseClientPromise = ensureSupabaseClient();
  const hasSupabase = !!supabaseClientPromise;

  if (req.method === "GET") {
    try {
      if (hasSupabase) {
        const supabase = await supabaseClientPromise;
        const levels = await getLevelsFromSupabase(supabase);
        return res.status(200).json({ success: true, levels });
      }
    } catch (err) {
      console.warn(
        "Failed to load levels from Supabase, falling back to local file",
        err
      );
    }

    try {
      const levels = await readFallbackLevels();
      return res.status(200).json({ success: true, levels });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error:
          "无法加载关卡数据，请检查 Supabase 配置或内置 levels.json 是否存在",
        detail: err.message,
      });
    }
  }

  if (req.method === "POST") {
    if (!hasSupabase) {
      return res.status(400).json({
        success: false,
        error:
          "Supabase 未配置。请在环境变量中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY",
      });
    }

    try {
      const body = req.body || {};
      const { levels } = body;

      if (!Array.isArray(levels)) {
        return res
          .status(400)
          .json({ success: false, error: "levels 必须是数组" });
      }

      const supabase = await supabaseClientPromise;
      const count = await saveLevelsToSupabase(supabase, levels);

      return res
        .status(200)
        .json({ success: true, message: "关卡已保存到数据库", count });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: "不支持的请求方法" });
};
