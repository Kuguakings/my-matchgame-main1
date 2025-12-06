// 确保环境变量已正确设置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 在API中添加权重配置支持
export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 禁用缓存
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
      const { levels } = req.body;

      if (!Array.isArray(levels)) {
        return res.status(400).json({
          success: false,
          error: 'levels 必须是数组'
        });
      }

      // 删除所有现有关卡（简单策略，也可以使用更新策略）
      const { error: deleteError } = await supabase
        .from('levels')
        .delete()
        .neq('id', 0); // 删除所有记录

      if (deleteError) throw deleteError;

      // 插入新关卡
      const levelRows = levels.map(level => ({
        level_data: level
      }));

      const { data, error } = await supabase
        .from('levels')
        .insert(levelRows)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: '关卡已保存到数据库',
        count: data.length
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
    error: '不支持的请求方法'
  });
}
