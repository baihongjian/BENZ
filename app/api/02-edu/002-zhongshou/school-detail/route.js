import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/study1.db');

function connectDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const schoolCode = searchParams.get('school_code');

  if (!schoolCode) {
    return Response.json({ success: false, error: '缺少学校代码' }, { status: 400 });
  }

  try {
    const db = await connectDb();

    // 获取学校基本信息
    const school = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM schools WHERE school_code = ?`,
        [schoolCode],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!school) {
      db.close();
      return Response.json({ success: false, error: '学校不存在' }, { status: 404 });
    }

    // 获取该学校的所有考试信息
    const exams = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM exams WHERE school_code = ? ORDER BY exam_date, start_time`,
        [schoolCode],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
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
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
