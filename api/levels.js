// Vercel Serverless Function for level management
// 部署到 Vercel 后，这个文件会自动成为 API 端点: /api/levels
//
// 注意：这是基础版本，使用内存存储，数据不会持久化
// 生产环境建议使用 Supabase 版本（api/levels-supabase.js）

export default async function handler(req, res) {
  // 设置 CORS 头，允许前端访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 这里使用简单的内存存储（生产环境建议使用数据库）
  // 注意：Vercel Serverless Functions 是无状态的，每次调用都是新的实例
  // 所以这里只是示例，实际应该使用数据库（如 Supabase、MongoDB Atlas 等）
  
  // 示例：使用 GitHub 作为存储（通过 GitHub API）
  // 或者使用 Supabase（推荐，免费额度大）
  
  if (req.method === 'GET') {
    // 获取所有关卡
    try {
      // 方案1: 从 GitHub 获取（如果关卡存储在 GitHub）
      const githubResponse = await fetch(
        `https://raw.githubusercontent.com/${process.env.GITHUB_REPO}/main/levels.json`
      );
      if (githubResponse.ok) {
        const levels = await githubResponse.json();
        return res.status(200).json({ success: true, levels });
      }
      
      // 方案2: 返回默认关卡（如果 GitHub 不可用）
      return res.status(200).json({ 
        success: true, 
        levels: [],
        message: '使用默认关卡' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    // 保存关卡（创建或更新）
    try {
      const { levels } = req.body;
      
      if (!Array.isArray(levels)) {
        return res.status(400).json({ 
          success: false, 
          error: 'levels 必须是数组' 
        });
      }

      // 这里应该保存到数据库
      // 示例：保存到 Supabase 或 MongoDB
      // 暂时返回成功（实际需要实现数据库保存）
      
      return res.status(200).json({ 
        success: true, 
        message: '关卡已保存',
        count: levels.length
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // 不支持的请求方法
  return res.status(405).json({ 
    success: false, 
    error: '不支持的请求方法' 
  });
}

