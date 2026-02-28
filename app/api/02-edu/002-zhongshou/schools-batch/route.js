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
  const schoolCodes = searchParams.get('school_codes');

  if (!schoolCodes) {
    return Response.json({ success: false, error: '缺少学校代码' }, { status: 400 });
  }

  try {
    const db = await connectDb();
    const codes = schoolCodes.split(',').filter(c => c.trim());

    if (codes.length === 0) {
      db.close();
      return Response.json({ success: true, data: [] });
    }

    const placeholders = codes.map(() => '?').join(',');
    const schools = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM schools WHERE school_code IN (${placeholders})`,
        codes,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    db.close();

    return Response.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
