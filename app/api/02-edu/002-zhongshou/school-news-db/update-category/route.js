/**
 * API 路由：更新新闻分类和排序
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
    const { id, category, sort_order } = body;

    console.log('[UpdateCategory] 收到请求:', { id, category, sort_order });

    if (!id) {
      console.log('[UpdateCategory] 错误: 缺少ID');
      return Response.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    const db = await connectDb();
    console.log('[UpdateCategory] 数据库连接成功');

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE news SET category = ?, sort_order = ?, analyzed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [category, sort_order, id],
        function(err) {
          if (err) {
            console.log('[UpdateCategory] SQL 错误:', err.message);
            reject(err);
          } else {
            console.log('[UpdateCategory] 更新成功, changes:', this.changes);
            resolve();
          }
        }
      );
    });

    db.close();

    return Response.json({ success: true });
  } catch (error) {
    console.error('[UpdateCategory] 更新分类失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
