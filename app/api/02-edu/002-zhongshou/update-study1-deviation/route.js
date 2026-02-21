import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/study1.db');

/**
 * POST /api/02-edu/002-zhongshou/update-study1-deviation
 * 更新 study1.db 中的偏差值
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { school_code, deviation } = body;

    if (!school_code || deviation === undefined) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数: school_code 或 deviation',
      }, { status: 400 });
    }

    const db = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE schools SET deviation = ? WHERE school_code = ?',
        [deviation, school_code],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    db.close();

    return NextResponse.json({
      success: true,
      message: `更新成功: ${school_code} 的偏差值更新为 ${deviation}`,
    });
  } catch (error) {
    console.error('更新偏差值失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
