import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 study1.db 数据库
const DB_PATH = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/study1.db');

console.log('Database path:', DB_PATH);

/**
 * 连接数据库
 */
function connectDb() {
  return new Promise((resolve, reject) => {
    console.log('Opening database...');
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Database open error:', err);
        reject(err);
      } else {
        console.log('Database opened successfully');
        resolve(db);
      }
    });
  });
}

/**
 * GET /api/02-edu/002-zhongshou/schools-study1
 * 查询学校列表（支持筛选）
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // 筛选参数
  const minDeviation = searchParams.get('minDeviation');
  const maxDeviation = searchParams.get('maxDeviation');
  const sex = searchParams.get('sex'); // 男子, 女子, 共通
  const region = searchParams.get('region'); // 関東, 関西
  const examDate = searchParams.get('examDate');
  const search = searchParams.get('search'); // 学校名称搜索
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const db = await connectDb();

    // 构建查询条件
    let whereClauses = ['1=1'];
    const params = [];

    if (minDeviation) {
      whereClauses.push('deviation >= ?');
      params.push(parseInt(minDeviation));
    }

    if (maxDeviation) {
      whereClauses.push('deviation <= ?');
      params.push(parseInt(maxDeviation));
    }

    if (sex && sex !== 'all') {
      whereClauses.push('sex_type = ?');
      params.push(sex);
    }

    if (region && region !== 'all') {
      whereClauses.push('region = ?');
      params.push(region);
    }

    if (examDate) {
      whereClauses.push('id IN (SELECT school_id FROM exams WHERE exam_date LIKE ?)');
      params.push(`%${examDate}%`);
    }

    if (search) {
      whereClauses.push('name LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = whereClauses.join(' AND ');

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM schools WHERE ${whereSql}`;

    const total = await new Promise((resolve, reject) => {
      db.get(countSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    // 获取学校列表
    const sql = `
      SELECT
        id,
        school_code,
        name,
        deviation,
        prefecture,
        category,
        sex_type,
        website,
        region
      FROM schools
      WHERE ${whereSql}
      ORDER BY deviation DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (page - 1) * limit;
    const schools = await new Promise((resolve, reject) => {
      db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 获取每个学校的考试日期
    for (const school of schools) {
      const examSql = `SELECT exam_name, exam_date, start_time, source_url FROM exams WHERE school_code = ? ORDER BY exam_date`;
      const exams = await new Promise((resolve, reject) => {
        db.all(examSql, [school.school_code], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      school.exams = exams;
    }

    db.close();

    return Response.json({
      success: true,
      data: schools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
