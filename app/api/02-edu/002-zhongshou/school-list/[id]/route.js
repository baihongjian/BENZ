import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/yotsuya.db');

/**
 * 连接数据库
 */
function connectDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

/**
 * GET /api/02-edu/002-zhongshou/school-list/[id]
 * 获取单个学校的详细信息
 */
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const db = await connectDb();

    // 获取学校基本信息
    const school = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM schools WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!school) {
      db.close();
      return Response.json({ error: '学校不存在' }, { status: 404 });
    }

    // 获取该学校的所有考试信息
    const exams = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM exams WHERE school_id = ? ORDER BY id', [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();

    return Response.json({
      success: true,
      data: {
        school,
        exams,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
