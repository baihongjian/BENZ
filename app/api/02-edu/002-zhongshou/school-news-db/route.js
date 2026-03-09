/**
 * API 路由：保存新闻到数据库
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import cheerio from 'cheerio';

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

async function fetchContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    $('script, style, nav, header, footer, aside').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

    return { title, textContent };
  } catch (err) {
    return { title: '', textContent: '' };
  }
}

function saveNews(db, news) {
  return new Promise((resolve, reject) => {
    // 使用 UPSERT: 存在则更新，不存在则插入（保留原有id）
    const sql = `
      INSERT INTO news (school_name, school_url, title, url, news_date, content, text_content, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        school_name = excluded.school_name,
        school_url = excluded.school_url,
        title = excluded.title,
        news_date = excluded.news_date,
        content = excluded.content,
        text_content = excluded.text_content
    `;
    db.run(sql, [
      news.school_name,
      news.school_url,
      news.title,
      news.url,
      news.news_date,
      news.content || '',
      news.text_content || '',
      'chugaku-juken-navi.com',
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { news, newsDate } = body;

    if (!news || !Array.isArray(news)) {
      return Response.json({ success: false, error: '缺少新闻数据' }, { status: 400 });
    }

    const db = await connectDb();
    let savedCount = 0;
    let errorCount = 0;

    for (const item of news) {
      try {
        // 获取详细内容
        let content = item.content || '';
        let textContent = item.textContent || '';

        if (item.url && !textContent) {
          const fetched = await fetchContent(item.url);
          content = fetched.title;
          textContent = fetched.textContent;
        }

        await saveNews(db, {
          school_name: item.school,
          school_url: item.schoolUrl,
          title: item.title,
          url: item.url,
          news_date: newsDate || item.newsDate,
          content: content,
          text_content: textContent,
        });
        savedCount++;
      } catch (err) {
        console.error('保存失败:', err.message);
        errorCount++;
      }
    }

    db.close();

    return Response.json({
      success: true,
      saved: savedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('保存新闻失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const days = parseInt(searchParams.get('days') || '0'); // 最近天数，0表示不限制

  console.log('[SchoolNewsDB] GET 请求, category:', category, 'limit:', limit, 'days:', days);

  try {
    const db = await connectDb();

    let sql = 'SELECT * FROM news WHERE 1=1';
    const params = [];

    // 筛选最近几天的数据
    if (days > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      sql += ' AND news_date >= ?';
      params.push(targetDateStr);
    }

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    console.log('[SchoolNewsDB] SQL:', sql, params);

    const news = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('[SchoolNewsDB] 返回数据条数:', news.length, 'IDs:', news.map(n => n.id));

    db.close();

    return Response.json({
      success: true,
      data: news,
      count: news.length,
    });
  } catch (error) {
    console.error('获取新闻失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
