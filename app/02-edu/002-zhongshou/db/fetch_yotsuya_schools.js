#!/usr/bin/env node
/**
 * 四谷大塚偏差値数据 - 批量获取并保存到 SQLite
 * 调试信息已启用
 */

const path = require('path');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, 'yotsuya.db');

// 性别映射
const SEX_MAP = { 'm': '男子', 'w': '女子', 'c': '共通' };

// API 基础 URL
const API_URL = 'http://localhost:3000/api/02-edu/002-zhongshou/school';


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
 * 解析 HTML，提取学校和考试信息
 */
function parseHtml(html) {
  debug('Parsing HTML...', { htmlLength: html.length });

  const schools = {};
  let rowCount = 0;
  let itemCount = 0;

  // 匹配每一行 tr
  const rowPattern = /<tr[^>]*>\s*<td[^>]*class="dev-head"[^>]*>(\d+)<\/td>\s*<td[^>]*class="exams-in-dev-wrapper"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g;

  let rowMatch;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    rowCount++;
    const deviation = parseInt(rowMatch[1]);
    const content = rowMatch[2];

    // 匹配每个学校条目
    const itemPattern = /<div[^>]*class="exam-of-dev-container"[^>]*>[\s\S]*?<div[^>]*class="exam-of-dev-container-right"[^>]*>[\s\S]*?<span[^>]*class="exam-of-dev-sex-([mwc])"[^>]*>[\s\S]*?<\/span>[\s\S]*?<span[^>]*class="exam-of-dev-date"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="exam-of-dev-school"[^>]*>[\s\S]*?<a[^>]*href="\/njc\/school\.php\?school_id=(\d+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/span>([^<]*)/g;

    let itemMatch;
    while ((itemMatch = itemPattern.exec(content)) !== null) {
      itemCount++;
      const sexCode = itemMatch[1];
      const examDate = itemMatch[2].trim();
      const schoolId = itemMatch[3];
      const name = itemMatch[4];
      const extra = itemMatch[5].trim();

      if (!schools[schoolId]) {
        schools[schoolId] = {
          school_id: schoolId,
          name: name,
          deviation: deviation,
          sex: SEX_MAP[sexCode] || '共通',
          exams: []
        };
        debug('New school found', {
          school_id: schoolId,
          name: name,
          deviation: deviation,
          sex: SEX_MAP[sexCode]
        });
      }

      schools[schoolId].exams.push({
        exam_date: examDate,
        extra: extra
      });
    }
  }

  const result = Object.values(schools);
  debug('HTML parsing complete', {
    rowCount,
    itemCount,
    uniqueSchools: result.length
  });

  return result;
}


/**
 * 调用 API 获取 HTML
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
 * 从详情页获取官网 URL
 * @param {string} schoolId - 学校 ID
 */
async function fetchSchoolWebUrl(schoolId) {
  const url = `https://www.yotsuyaotsuka.com/juken/data/?code=${schoolId}`;

  try {
    const html = await fetchHtml(url);

    // 匹配 公式サイト 的 URL
    // 常见模式: <a href="http://xxx" target="_blank">公式サイト</a>
    // 或者: <a href="xxx" class="official-link">公式サイト</a>
    const patterns = [
      // 匹配包含 "公式サイト" 的链接
      /<a[^>]*href="([^"]+)"[^>]*>公式サイト<\/a>/i,
      /<a[^>]*>公式サイト<\/a[^>]*href="([^"]+)"/i,
      // 匹配可能在 td 或 div 中的官方链接
      /<td[^>]*class="[^"]*official[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/i,
      // 匹配 data-detail 或类似结构中的 URL
      /"official_url"\s*:\s*"([^"]+)"/i,
      /"url"\s*:\s*"([^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match) {
        return match[1];
      }
    }

    // 如果没有匹配到，尝试匹配任何指向外部的链接（不是 yotsuyaotsuka.com 的）
    const externalLinkPattern = /<a[^>]*href="(https?:\/\/(?!.*yotsuyaotsuka\.com)[^"]+)"[^>]*>/i;
    const externalMatch = externalLinkPattern.exec(html);
    if (externalMatch) {
      return externalMatch[1];
    }

    return null;
  } catch (error) {
    logError(`Failed to fetch web URL for school ${schoolId}`, error);
    return null;
  }
}


/**
 * 保存到数据库
 */
async function saveToDb(db, schools) {
  return new Promise((resolve, reject) => {
    debug('Starting database save', { schoolCount: schools.length });

    db.serialize(() => {
      let processed = 0;

      for (const school of schools) {
        debug('Processing school', {
          school_id: school.school_id,
          name: school.name,
          deviation: school.deviation,
          examsCount: school.exams.length,
          progress: `${processed + 1}/${schools.length}`
        });

        db.get('SELECT id FROM schools WHERE school_id = ?', [school.school_id], (err, row) => {
          if (err) {
            logError('Database query failed', err);
            reject(err);
            return;
          }

          if (row) {
            // 更新学校信息
            debug('Updating existing school', { school_id: school.school_id, dbId: row.id });
            db.run(
              'UPDATE schools SET name = ?, deviation = ?, sex = ?, webURL = ? WHERE id = ?',
              [school.name, school.deviation, school.sex, school.webURL || null, row.id],
              (err) => {
                if (err) {
                  logError('Update failed', err);
                  reject(err);
                  return;
                }
                debug('School updated successfully', { school_id: school.school_id });
                saveExams(db, row.id, school.exams, processed++, schools.length, resolve, reject);
              }
            );
          } else {
            // 插入新学校
            debug('Inserting new school', { school_id: school.school_id, name: school.name });
            db.run(
              'INSERT OR REPLACE INTO schools (school_id, name, deviation, sex, webURL) VALUES (?, ?, ?, ?, ?)',
              [school.school_id, school.name, school.deviation, school.sex, school.webURL || null],
              function (err) {
                if (err) {
                  logError('Insert failed', err);
                  reject(err);
                  return;
                }
                debug('School saved (insert or replace)', { school_id: school.school_id, lastID: this.lastID });
                saveExams(db, row?.id || this.lastID, school.exams, processed++, schools.length, resolve, reject);
              }
            );
          }
        });
      }
    });
  });
}


/**
 * 保存考试信息
 */
function saveExams(db, schoolId, exams, processed, total, resolve, reject) {
  debug('Saving exams', { schoolId, examsCount: exams.length, progress: `${processed + 1}/${total}` });

  db.run('DELETE FROM exams WHERE school_id = ?', [schoolId], (err) => {
    if (err) {
      logError('Failed to delete existing exams', err);
      reject(err);
      return;
    }

    if (exams.length === 0) {
      debug('No exams to save for school', { schoolId });
      if (processed === total - 1) {
        resolve();
      }
      return;
    }

    let examProcessed = 0;
    const stmt = db.prepare('INSERT INTO exams (school_id, exam_date, extra) VALUES (?, ?, ?)');

    for (const exam of exams) {
      stmt.run(schoolId, exam.exam_date, exam.extra, (err) => {
        if (err) {
          logError('Failed to insert exam', err);
          reject(err);
          return;
        }

        examProcessed++;
        debug('Exam saved', {
          schoolId,
          exam_date: exam.exam_date,
          examProgress: `${examProcessed}/${exams.length}`
        });

        if (examProcessed === exams.length && processed === total - 1) {
          stmt.finalize();
          debug('All schools and exams saved successfully');
          resolve();
        }
      });
    }
  });
}


/**
 * 显示统计信息
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

      db.get('SELECT COUNT(*) as count FROM exams', (err, row) => {
        if (err) {
          logError('Failed to get exams count', err);
          resolve();
          return;
        }

        const examCount = row.count;
        debug('Statistics', { totalExams: examCount });
        console.log(`📅 考试记录总数: ${examCount}`);

        console.log('\n📋 学校列表:');
        db.all('SELECT school_id, name, deviation, sex FROM schools ORDER BY deviation DESC', (err, rows) => {
          if (err) {
            logError('Failed to get school list', err);
            resolve();
            return;
          }

          debug('School list retrieved', { count: rows.length });
          rows.forEach(row => {
            console.log(`  ${row.deviation} - ${row.name} (${row.sex})`);
          });
          resolve();
        });
      });
    });
  });
}


/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();

  console.log('='.repeat(50));
  console.log('四谷大塚偏差値データ - バッチ取得');
  console.log('='.repeat(50));
  debug('Script started', { DB_PATH, API_URL });

  // 要获取的页面 - current=0 到 current=45
  const urls = [];
  const startPage = 0;
  const endPage = 45;
  for (let i = startPage; i <= endPage; i++) {
    urls.push(`https://www.yotsuyaotsuka.com/njc/deviation_top.php?current=${i}#search-box`);
  }
  console.log(`将获取 ${endPage - startPage + 1} 个页面 (${startPage} ~ ${endPage})`);

  debug('URLs to fetch', { count: urls.length, urls });

  try {
    // 连接数据库
    debug('Connecting to database...');
    const db = await connectDb();

    let allSchools = [];
    let totalFetched = 0;
    let totalErrors = 0;

    // 获取每个页面
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      debug(`Fetching page ${i + 1}/${urls.length}`, { url });

      try {
        const html = await fetchHtml(url);
        const schools = parseHtml(html);
        totalFetched += schools.length;
        debug(`Page ${i + 1} parsed`, { schoolsFound: schools.length });
        console.log(`\n🌐 [${i + 1}/${urls.length}] ${url}`);
        console.log(`  解析到 ${schools.length} 所学校`);
        allSchools = allSchools.concat(schools);
      } catch (err) {
        totalErrors++;
        logError(`Failed to fetch page ${i + 1}`, err);
        console.error(`  ❌ 获取失败: ${err.message}`);
      }
    }

    debug('All pages fetched', { totalUrls: urls.length, totalErrors, totalSchools: allSchools.length });

    if (allSchools.length > 0) {
      // 获取每个学校的官网 URL
      console.log(`\n🌐 开始获取学校官网 URL...`);
      for (let i = 0; i < allSchools.length; i++) {
        const school = allSchools[i];
        try {
          const webUrl = await fetchSchoolWebUrl(school.school_id);
          if (webUrl) {
            school.webURL = webUrl;
            console.log(`  [${i + 1}/${allSchools.length}] ${school.name}: ${webUrl}`);
          } else {
            console.log(`  [${i + 1}/${allSchools.length}] ${school.name}: 无官网链接`);
          }
        } catch (error) {
          console.log(`  [${i + 1}/${allSchools.length}] ${school.name}: 获取失败`);
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200));
      }

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
      console.log(`\n✅ 完成! (耗时: ${duration}秒, 获取: ${totalFetched}所学校, 错误: ${totalErrors})`);
    });

  } catch (err) {
    logError('Fatal error', err);
    console.error(`\n❌ 错误: ${err.message}`);
    process.exit(1);
  }
}


// 导出函数供其他模块使用
module.exports = { parseHtml, fetchHtml, saveToDb };

// 运行主函数
main();
