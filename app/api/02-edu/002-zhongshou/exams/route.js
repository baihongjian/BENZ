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
  const limit = parseInt(searchParams.get('limit') || '10000');
  const category = searchParams.get('category');
  const sexType = searchParams.get('sexType');

  try {
    const db = await connectDb();

    let whereClause = '1=1';
    const categoryParams = [];
    const sexTypeParams = [];

    if (category && category.trim() !== '') {
      const categories = category.split(',');
      if (categories.length > 0) {
        const placeholders = categories.map(() => '?').join(',');
        whereClause = `s.category IN (${placeholders})`;
        categoryParams.push(...categories);
      }
    }

    if (sexType && sexType.trim() !== '') {
      const sexTypes = sexType.split(',');
      if (sexTypes.length > 0) {
        const placeholders = sexTypes.map(() => '?').join(',');
        whereClause += ` AND s.sex_type IN (${placeholders})`;
        sexTypeParams.push(...sexTypes);
      }
    }

    // 正确的参数顺序: categoryParams, sexTypeParams, limit
    const params = [...categoryParams, ...sexTypeParams, limit];

    const sql = `
      SELECT
        e.id,
        e.school_code,
        e.exam_name,
        e.exam_date,
        e.start_time,
        e.source_url,
        s.name as school_name,
        s.deviation as deviation,
        s.category as category
      FROM exams e
      LEFT JOIN schools s ON e.school_code = s.school_code
      WHERE ${whereClause}
      ORDER BY s.deviation DESC, s.name, e.exam_date
      LIMIT ?
    `;

    const exams = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();

    return Response.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
