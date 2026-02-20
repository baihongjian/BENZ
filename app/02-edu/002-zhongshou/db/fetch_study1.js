#!/usr/bin/env node
/**
 * study1.jp 偏差値数据 - 批量获取并保存到 SQLite
 */

const path = require('path');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, 'study1.db');

// 性别类型映射 (从 alt 属性)
const SEX_MAP = {
  '男子校': '男子',
  '女子校': '女子',
  '共学校': '共通',
};

// 办学类型映射 (从 alt 属性)
const CATEGORY_MAP = {
  '私立中学': '私立',
  '国立中学': '国立',
  '公立中学': '公立',
};

// API 基础 URL (当前服务)
const API_URL = 'http://localhost:3000/api/02-edu/002-zhongshou/study1';


// 调试日志函数
function debug(message, data = null) {
  const timestamp = new Date().toISOString().slice(11, 23);
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// 错误日志函数
function logError(message, err = null) {
  const timestamp = new Date().toISOString().slice(11, 23);
  if (err) {
    console.error(`[${timestamp}] ERROR: ${message}`, err.message || err);
  } else {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}


/**
 * 连接数据库
 */
function connectDb() {
  return new Promise((resolve, reject) => {
    debug('Connecting to database...', { DB_PATH });
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logError('Failed to connect to database', err);
        reject(err);
        return;
      }
      debug('Database connected successfully');
      resolve(db);
    });
  });
}


/**
 * 解析 HTML，提取学校信息
 * @param {string} html - HTML 内容
 * @param {string} baseUrl - 基础 URL (用于解析相对链接)
 */
function parseHtml(html, baseUrl = 'https://study1.jp') {
  debug('Parsing HTML...', { htmlLength: html.length });

  const schools = [];
  let deviation = null;

  // 匹配外层 tr，包含偏差值 td 和学校列表 table
  const rowPattern =/<tr>\s*<td[^>]*class="dev"[^>]*>(\d+)<\/td>\s*<td[^>]*colspan="3"[^>]*>([\s\S]*?<\/table>)[\s\S]*?<\/td>\s*<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    // 提取偏差值
    const devValue = rowMatch[1];
    if (devValue === '-' || devValue === '') continue; // 跳过无效偏差值
    deviation = parseInt(devValue);
    const tableContent = rowMatch[2]; // 整个 <table>...</table>

    debug('Processing deviation', { deviation, tableLength: tableContent.length });

    // 从表格中提取学校 tr - 去掉 <table> 和 </table> 标签
    const tableBody = tableContent.replace(/<\/?table>/g, '');
    const schoolPattern = /<tr\b[^>]*>([\s\S]*?)(?=<tr\b|$)/gi;
    let schoolMatch;

    while ((schoolMatch = schoolPattern.exec(tableBody)) !== null) {
      const schoolRow = schoolMatch[1];

      // 提取学校名称和链接
      const nameMatch = /<td[^>]*class="name"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/.exec(schoolRow);
      if (!nameMatch) continue;

      const schoolUrl = nameMatch[1]; // 如 /kanto/school/B13P009/
      const schoolCode = schoolUrl.replace(/\/$/, '').split('/').pop();
      const name = nameMatch[2].trim();

      // 提取类型图标 alt 属性 (img 是自闭合的 />)
      const typeMatches = schoolRow.match(/<img[^>]*alt="([^"]+)"[^>]*\/?>/g) || [];
      let sexType = '共通';
      let category = '私立';

      for (const img of typeMatches) {
        const altMatch = /alt="([^"]+)"/.exec(img);
        if (altMatch) {
          const alt = altMatch[1];
          if (SEX_MAP[alt]) {
            sexType = SEX_MAP[alt];
          } else if (CATEGORY_MAP[alt]) {
            category = CATEGORY_MAP[alt];
          }
        }
      }

      // 提取地区
      const adMatch =/<td[^>]*class="ad"[^>]*>\s*([^<\n\r]+)/i.exec(schoolRow);
      const prefecture = adMatch ? adMatch[1].trim() : '';

      const school = {
        school_code: schoolCode,
        name: name,
        deviation: deviation,
        prefecture: prefecture,
        category: category,
        sex_type: sexType,
        website: '',
        schoolUrl: schoolUrl,
      };

      debug('School found', {
        code: schoolCode,
        name: name,
        deviation: deviation,
        prefecture: prefecture,
        category: category,
        sex_type: sexType,
      });

      schools.push(school);
    }
  }

  debug('HTML parsing complete', { schoolCount: schools.length });
  return schools;
}


/**
 * 调用 API 获取 HTML
 * @param {string} url - 要获取的 URL
 */
async function fetchHtml(url) {
  debug('Fetching URL via API', { url });

  const apiUrl = `${API_URL}?url=${encodeURIComponent(url)}&raw=true`;
  debug('API endpoint', { apiUrl });

  const response = await fetch(apiUrl);

  if (!response.ok) {
    logError('API request failed', { status: response.status, url });
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  debug('API response received', { htmlLength: html.length });

  return html;
}


/**
 * 保存到数据库
 * @param {object} db - 数据库连接
 * @param {Array} schools - 学校数组
 */
async function saveToDb(db, schools) {
  return new Promise((resolve, reject) => {
    debug('Starting database save', { schoolCount: schools.length });

    db.serialize(() => {
      let processed = 0;

      for (const school of schools) {
        debug('Processing school', {
          school_code: school.school_code,
          name: school.name,
          deviation: school.deviation,
          progress: `${processed + 1}/${schools.length}`,
        });

        // 检查学校是否已存在
        db.get(
          'SELECT id FROM schools WHERE school_code = ?',
          [school.school_code],
          (err, row) => {
            if (err) {
              logError('Database query failed', err);
              reject(err);
              return;
            }

            if (row) {
              // 更新现有学校
              debug('Updating existing school', { school_code: school.school_code, dbId: row.id });
              db.run(
                `UPDATE schools SET
                  name = ?,
                  deviation = ?,
                  prefecture = ?,
                  category = ?,
                  sex_type = ?,
                  source_url = ?
                WHERE id = ?`,
                [
                  school.name,
                  school.deviation,
                  school.prefecture,
                  school.category,
                  school.sex_type,
                  school.source_url,
                  row.id,
                ],
                (err) => {
                  if (err) {
                    logError('Update failed', err);
                    reject(err);
                    return;
                  }
                  debug('School updated successfully', { school_code: school.school_code });
                  processed++;
                  if (processed === schools.length) {
                    resolve();
                  }
                }
              );
            } else {
              // 插入新学校
              debug('Inserting new school', {
                school_code: school.school_code,
                name: school.name,
              });
              db.run(
                `INSERT INTO schools (
                  school_code,
                  name,
                  deviation,
                  prefecture,
                  category,
                  sex_type,
                  source_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  school.school_code,
                  school.name,
                  school.deviation,
                  school.prefecture,
                  school.category,
                  school.sex_type,
                  school.source_url,
                ],
                function (err) {
                  if (err) {
                    logError('Insert failed', err);
                    reject(err);
                    return;
                  }
                  debug('School inserted', {
                    school_code: school.school_code,
                    newId: this.lastID,
                  });
                  processed++;
                  if (processed === schools.length) {
                    resolve();
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}


/**
 * 显示统计信息
 * @param {object} db - 数据库连接
 */
function showStats(db) {
  return new Promise((resolve) => {
    debug('Fetching statistics...');

    db.get('SELECT COUNT(*) as count FROM schools', (err, row) => {
      if (err) {
        logError('Failed to get schools count', err);
        resolve();
        return;
      }

      const schoolCount = row.count;
      debug('Statistics', { totalSchools: schoolCount });
      console.log(`\n📊 学校总数: ${schoolCount}`);

      // 按偏差值统计
      db.all(
        'SELECT deviation, COUNT(*) as cnt FROM schools GROUP BY deviation ORDER BY deviation DESC',
        (err, rows) => {
          if (err) {
            logError('Failed to get deviation stats', err);
            resolve();
            return;
          }

          console.log('\n📈 偏差值分布:');
          rows.forEach((r) => {
            console.log(`  ${r.deviation}: ${r.cnt} 所学校`);
          });

          // 显示学校列表
          console.log('\n📋 学校列表:');
          db.all(
            'SELECT school_code, name, deviation, prefecture, sex_type FROM schools ORDER BY deviation DESC LIMIT 20',
            (err, rows) => {
              if (err) {
                logError('Failed to get school list', err);
                resolve();
                return;
              }

              rows.forEach((r) => {
                console.log(
                  `  ${r.deviation} - ${r.name} (${r.prefecture}) [${r.sex_type}]`
                );
              });

              if (schoolCount > 20) {
                console.log(`  ... 及其他 ${schoolCount - 20} 所学校`);
              }

              resolve();
            }
          );
        }
      );
    });
  });
}


/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();

  console.log('='.repeat(50));
  console.log('study1.jp 偏差値データ - バッチ取得');
  console.log('='.repeat(50));
  debug('Script started', { DB_PATH, API_URL });

  // 要获取的页面
  const pageUrl = 'https://study1.jp/kanto/list/deviation.html';
  const pageName = '関東 偏差値一覧';

  try {
    // 连接数据库
    debug('Connecting to database...');
    const db = await connectDb();

    let allSchools = [];
    let totalFetched = 0;
    let totalErrors = 0;

    // 获取页面
    debug('Fetching page', { url: pageUrl, name: pageName });

    try {
      const html = await fetchHtml(pageUrl);
      const schools = parseHtml(html, 'https://study1.jp');

      totalFetched = schools.length;
      debug('Page parsed', { schoolsFound: schools.length });
      console.log(`\n🌐 ${pageName}`);
      console.log(`  解析到 ${schools.length} 所学校`);
      allSchools = schools;
    } catch (error) {
      totalErrors++;
      logError('Failed to fetch page', error);
      console.error(`  ❌ 获取失败: ${error.message}`);
    }



    if (allSchools.length > 0) {
      console.log(`\n💾 保存到数据库...`);
      debug('Starting database save', { schoolCount: allSchools.length });

      await saveToDb(db, allSchools);

      console.log(`✅ 保存完成`);
      debug('Database save completed');

      await showStats(db);
    } else {
      console.log('\n⚠️ 没有获取到任何数据');
      debug('No data was fetched', { totalErrors });
    }

    // 关闭数据库
    debug('Closing database connection...');
    db.close((err) => {
      if (err) {
        logError('Error closing database', err);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      debug('Script completed', { duration: `${duration}s`, totalFetched, totalErrors });
      console.log(
        `\n✅ 完成! (耗时: ${duration}秒, 获取: ${totalFetched}所学校, 错误: ${totalErrors})`
      );
    });
  } catch (error) {
    logError('Fatal error', error);
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
}


// 导出函数供其他模块使用
module.exports = { parseHtml, fetchHtml, saveToDb };

// 运行主函数
main();
