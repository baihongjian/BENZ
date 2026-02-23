/**
 * API 路由：更新新闻分析结果
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../../../../../app/02-edu/002-zhongshou/db/school_news.db');

function connectDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, summary, importance } = body;

    console.log('[UpdateAnalysis] 收到请求:', { id, summary: summary?.substring(0, 30), importance });

    if (!id) {
      console.log('[UpdateAnalysis] 错误: 缺少ID');
      return Response.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    const db = await connectDb();
    console.log('[UpdateAnalysis] 数据库连接成功');

    // 计算 sort_order（只基于 importance）
    const sortOrder = (6 - (importance || 1));
    console.log('[UpdateAnalysis] 执行更新:', { summary, sortOrder, id });

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE news SET summary = ?, sort_order = ?, analyzed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [summary, sortOrder, id],
        function(err) {
          if (err) {
            console.log('[UpdateAnalysis] SQL 错误:', err.message);
            reject(err);
          } else {
            console.log('[UpdateAnalysis] 更新成功, changes:', this.changes);
            resolve();
          }
        }
      );
    });

    db.close();

    return Response.json({ success: true });
  } catch (error) {
    console.error('[UpdateAnalysis] 更新分析结果失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
