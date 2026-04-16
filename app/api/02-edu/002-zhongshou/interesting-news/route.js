/**
 * API 路由：保存有意思的新闻摘要
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../../../../app/02-edu/002-zhongshou/db/school_news.db');

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
    const { news } = body;

    if (!news || !Array.isArray(news)) {
      return Response.json({ success: false, error: '缺少新闻数据' }, { status: 400 });
    }

    const db = await connectDb();
    let savedCount = 0;

    // 获取今天的日期
    const today = new Date();
    const analyzeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (const item of news) {
      try {
        const sql = `
          INSERT INTO interesting_news (school_name, title, summary, news_date, analyze_date)
          VALUES (?, ?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) => {
          db.run(sql, [
            item.school_name,
            item.title,
            item.summary || '',
            item.news_date || analyzeDate,
            analyzeDate,
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        savedCount++;
      } catch (err) {
        console.error('保存失败:', err.message);
      }
    }

    db.close();

    return Response.json({
      success: true,
      saved: savedCount,
    });
  } catch (error) {
    console.error('保存有意思的新闻失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const analyzeDate = searchParams.get('analyze_date');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const db = await connectDb();

    let sql = 'SELECT * FROM interesting_news WHERE 1=1';
    const params = [];

    if (analyzeDate) {
      sql += ' AND analyze_date = ?';
      params.push(analyzeDate);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const news = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();

    return Response.json({
      success: true,
      data: news,
      count: news.length,
    });
  } catch (error) {
    console.error('获取有意思的新闻失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
