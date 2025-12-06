// 确保环境变量已正确设置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
  // 设置 CORS 和缓存控制
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // 防止缓存
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 如果没有配置 Supabase，返回错误
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase 未配置。请在环境变量中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY'
    });
  }

  if (req.method === 'GET') {
    try {
      // 从 Supabase 获取所有关卡
      const { data, error } = await supabase
        .from('levels')
        .select('level_data')
        .order('id', { ascending: true });

      if (error) throw error;

      // 提取关卡数据
      const levels = data.map(row => row.level_data);

      return res.status(200).json({
        success: true,
        levels: levels.length > 0 ? levels : []
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { level_data } = req.body;

      // 插入新关卡到 Supabase
      const { data, error } = await supabase
        .from('levels')
        .insert([{ level_data }])
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        level: data[0]
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, level_data } = req.body;

      // 更新关卡数据
      const { data, error } = await supabase
        .from('levels')
        .update({ level_data })
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        level: data[0]
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      // 删除关卡
      const { data, error } = await supabase
        .from('levels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: '关卡已删除'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: '方法不被允许'
  });
}
