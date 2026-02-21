#!/usr/bin/env node
/**
 * study1.jp 获取首都圈的学校数据 - 批量获取并保存到 SQLite
 */

const path = require("path");
const sqlite3 = require("sqlite3");
const cheerio = require("cheerio");

const DB_PATH = path.join(__dirname, "study1.db");

// 性别类型映射 (从 alt 属性)
const SEX_MAP = {
  男子校: "男子",
  女子校: "女子",
  共学校: "共通",
};

// 办学类型映射 (从 alt 属性)
const CATEGORY_MAP = {
  私立中学: "私立",
  国立中学: "国立",
  公立中学: "公立",
};

// API 基础 URL (当前服务)
const API_URL = "http://localhost:3000/api/02-edu/002-zhongshou/school";

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
    debug("Connecting to database...", { DB_PATH });
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logError("Failed to connect to database", err);
        reject(err);
        return;
      }
      debug("Database connected successfully");
      resolve(db);
    });
  });
}

/**
 * 解析 HTML，提取学校信息
 * @param {string} html - HTML 内容
 * @param {string} baseUrl - 基础 URL (用于解析相对链接)
 */
function parseHtml(html, baseUrl = "https://study1.jp") {
  debug("Parsing HTML...", { htmlLength: html.length });

  const schools = [];
  let deviation = null;

  // 匹配外层 tr，包含偏差值 td 和学校列表 table
  const rowPattern =
    /<tr>\s*<td[^>]*class="dev"[^>]*>(\d+)<\/td>\s*<td[^>]*colspan="3"[^>]*>([\s\S]*?<\/table>)[\s\S]*?<\/td>\s*<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    // 提取偏差值
    const devValue = rowMatch[1];
    if (devValue === "-" || devValue === "") continue; // 跳过无效偏差值
    deviation = parseInt(devValue);
    const tableContent = rowMatch[2]; // 整个 <table>...</table>

    debug("Processing deviation", {
      deviation,
      tableLength: tableContent.length,
    });

    // 从表格中提取学校 tr - 去掉 <table> 和 </table> 标签
    const tableBody = tableContent.replace(/<\/?table>/g, "");
    const schoolPattern = /<tr\b[^>]*>([\s\S]*?)(?=<tr\b|$)/gi;
    let schoolMatch;

    while ((schoolMatch = schoolPattern.exec(tableBody)) !== null) {
      const schoolRow = schoolMatch[1];

      // 提取学校名称和链接
      const nameMatch =
        /<td[^>]*class="name"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/.exec(
          schoolRow
        );
      if (!nameMatch) continue;

      const schoolUrl = nameMatch[1]; // 如 /kanto/school/B13P009/
      const schoolCode = schoolUrl.replace(/\/$/, "").split("/").pop();
      const name = nameMatch[2].trim();

      // 提取类型图标 alt 属性 (img 是自闭合的 />)
      const typeMatches =
        schoolRow.match(/<img[^>]*alt="([^"]+)"[^>]*\/?>/g) || [];
      let sexType = "共通";
      let category = "私立";

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
      const adMatch = /<td[^>]*class="ad"[^>]*>\s*([^<\n\r]+)/i.exec(schoolRow);
      const prefecture = adMatch ? adMatch[1].trim() : "";

      const school = {
        school_code: schoolCode,
        name: name,
        deviation: deviation,
        prefecture: prefecture,
        category: category,
        sex_type: sexType,
        website: "",
        schoolUrl: schoolUrl,
      };

      debug("School found", {
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

  debug("HTML parsing complete", { schoolCount: schools.length });
  return schools;
}

/**
 * 调用 API 获取 HTML
 * @param {string} url - 要获取的 URL
 */
async function fetchHtml(url) {
  debug("Fetching URL via API", { url });

  const apiUrl = `${API_URL}?url=${encodeURIComponent(url)}&raw=true`;
  debug("API endpoint", { apiUrl });

  const response = await fetch(apiUrl);

  if (!response.ok) {
    logError("API request failed", { status: response.status, url });
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  debug("API response received", { htmlLength: html.length });

  return html;
}


/**
 * 保存考试信息到数据库
 * @param {object} db - 数据库连接
 * @param {string} schoolCode - 学校代码
 * @param {Array} exams - 考试信息数组
 */
function saveExamsToDb(db, schoolCode, exams, website) {
  return new Promise((resolve, reject) => {
    if (!exams || exams.length === 0) {
      resolve();
      return;
    }

    let processed = 0;
    for (const exam of exams) {
      // 使用学校官网的入試要项URL，如果不存在则使用 学校的website
      const sourceUrl = exam.source_url || website;

      db.run(
        `INSERT OR REPLACE INTO exams (
          school_code,
          exam_name,
          exam_date,
          start_time,
          source_url
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          schoolCode,
          exam.exam_name || null,
          exam.exam_date || null,
          exam.start_time || null,
          sourceUrl,
        ],
        function (err) {
          if (err) {
            logError("Exam insert failed", err);
            reject(err);
            return;
          }
          processed++;
          if (processed === exams.length) {
            resolve();
          }
        }
      );
    }
  });
}

/**
 * 保存单个学校信息到数据库（包含考试信息）
 * @param {object} db - 数据库连接
 * @param {object} school - 学校信息对象
 */
function saveSchoolToDb(db, school) {
  return new Promise((resolve, reject) => {
    // 检查学校是否已存在
    db.get(
      "SELECT id FROM schools WHERE school_code = ?",
      [school.school_code],
      (err, row) => {
        if (err) {
          logError("Database query failed", err);
          reject(err);
          return;
        }

        if (row) {
          // 更新现有学校
          db.run(
            `UPDATE schools SET
              name = ?,
              deviation = ?,
              prefecture = ?,
              category = ?,
              sex_type = ?,
              website = ?,
              first_year_total = ?,
              annual_fee = ?,
              university_todai_keidai = ?,
              university_ichihashi_tokyo_5 = ?,
              university_national_public = ?,
              university_waseda_keio_socie = ?,
              university_gmarch = ?,
              university_medical = ?,
              source_url = ?,
              region = '関東'
            WHERE id = ?`,
            [
              school.name,
              school.deviation,
              school.prefecture,
              school.category,
              school.sex_type,
              school.website || null,
              school.first_year_total || null,
              school.annual_fee || null,
              school.university_todai_keidai || 0,
              school.university_ichihashi_tokyo_5 || 0,
              school.university_national_public || 0,
              school.university_waseda_keio_socie || 0,
              school.university_gmarch || 0,
              school.university_medical || 0,
              school.schoolUrl || school.source_url || null,
              row.id,
            ],
            (err) => {
              if (err) {
                logError("Update failed", err);
                reject(err);
                return;
              }
              // 保存考试信息
              saveExamsToDb(db, school.school_code, school.exams, school.website)
                .then(resolve)
                .catch(reject);
            }
          );
        } else {
          // 插入新学校
          db.run(
            `INSERT INTO schools (
              school_code,
              name,
              deviation,
              prefecture,
              category,
              sex_type,
              website,
              first_year_total,
              annual_fee,
              university_todai_keidai,
              university_ichihashi_tokyo_5,
              university_national_public,
              university_waseda_keio_socie,
              university_gmarch,
              university_medical,
              source_url,
              region
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '関東')`,
            [
              school.school_code,
              school.name,
              school.deviation,
              school.prefecture,
              school.category,
              school.sex_type,
              school.website || null,
              school.first_year_total || null,
              school.annual_fee || null,
              school.university_todai_keidai || 0,
              school.university_ichihashi_tokyo_5 || 0,
              school.university_national_public || 0,
              school.university_waseda_keio_socie || 0,
              school.university_gmarch || 0,
              school.university_medical || 0,
              school.schoolUrl || school.source_url || null,
            ],
            function (err) {
              if (err) {
                logError("Insert failed", err);
                reject(err);
                return;
              }
              // 保存考试信息
              saveExamsToDb(db, school.school_code, school.exams, school.website)
                .then(resolve)
                .catch(reject);
            }
          );
        }
      }
    );
  });
}

/**
 * 显示统计信息
 * @param {object} db - 数据库连接
 */
function showStats(db) {
  return new Promise((resolve) => {
    debug("Fetching statistics...");

    db.get("SELECT COUNT(*) as count FROM schools", (err, row) => {
      if (err) {
        logError("Failed to get schools count", err);
        resolve();
        return;
      }

      const schoolCount = row.count;
      debug("Statistics", { totalSchools: schoolCount });
      console.log(`\n📊 学校总数: ${schoolCount}`);

      // 按偏差值统计
      db.all(
        "SELECT deviation, COUNT(*) as cnt FROM schools GROUP BY deviation ORDER BY deviation DESC",
        (err, rows) => {
          if (err) {
            logError("Failed to get deviation stats", err);
            resolve();
            return;
          }

          console.log("\n📈 偏差值分布:");
          rows.forEach((r) => {
            console.log(`  ${r.deviation}: ${r.cnt} 所学校`);
          });

          // 显示学校列表
          console.log("\n📋 学校列表:");
          db.all(
            "SELECT school_code, name, deviation, prefecture, sex_type FROM schools ORDER BY deviation DESC LIMIT 20",
            (err, rows) => {
              if (err) {
                logError("Failed to get school list", err);
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

  console.log("=".repeat(50));
  console.log("study1.jp 偏差値データ - バッチ取得");
  console.log("=".repeat(50));
  debug("Script started", { DB_PATH, API_URL });

  // 要获取的页面
  const pageUrl = "https://study1.jp/kanto/list/deviation.html";
  const pageName = "関東 偏差値一覧";

  try {
    // 连接数据库
    debug("Connecting to database...");
    const db = await connectDb();

    let allSchools = [];
    let totalFetched = 0;
    let totalErrors = 0;

    // 获取页面
    debug("Fetching page", { url: pageUrl, name: pageName });

    try {
      const html = await fetchHtml(pageUrl);
      const schools = parseHtml(html, "https://study1.jp");

      totalFetched = schools.length;
      debug("Page parsed", { schoolsFound: schools.length });
      console.log(`\n🌐 ${pageName}`);
      console.log(`  解析到 ${schools.length} 所学校`);

      // 获取每个学校的详情页
      console.log(`\n📋 开始获取学校详情...`);
      for (let i = 0; i < schools.length; i++) {
        const school = schools[i];
        const detailUrl = "https://study1.jp" + school.schoolUrl;

        console.log(`  [${i + 1}/${schools.length}] ${school.name}`);

        try {
          const detailHtml = await fetchHtml(detailUrl);

          // 使用 cheerio 解析
          const $detail = cheerio.load(detailHtml);

          // 提取学校官网 URL
          const urlMatch =
            /<td[^>]*id="url"[^>]*>[\s\S]*?href="([^"]+)"[^>]*>[\s\S]*?<\/a>/i.exec(
              detailHtml
            );
          if (urlMatch) {
            school.website = urlMatch[1];
            console.log(`    ✓ 官网: ${school.website}`);
          } else {
            console.log(`    - 无官网链接`);
          }

          // 使用 cheerio 解析学费信息
          const tuitionSection = $detail("#tuition");

          if (tuitionSection.length > 0) {
            const tuitionRow = tuitionSection.find("table tr").eq(1);
            const tds = tuitionRow.find("td");

            if (tds.length >= 2) {
              let firstYearText = $detail(tds[0]).text().trim();
              let annualText = $detail(tds[1]).text().trim();

              if (firstYearText === "-") firstYearText = "0";
              if (annualText === "-") annualText = "0";

              school.first_year_total = firstYearText;
              school.annual_fee = annualText;

              console.log(
                `    ✓ 初年度: ${school.first_year_total} 円, 年間: ${school.annual_fee} 円`
              );
            } else {
              console.log(`    - 无学费信息`);
            }
          } else {
            console.log(`    - 无学费信息`);
          }

          // 获取大学合格実績
          const univPassUrl = detailUrl + "univ_pass/";
          console.log(`    📊 获取大学合格実績...`);

          const univHtml = await fetchHtml(univPassUrl);
          const $univ = cheerio.load(univHtml);

          // 查找包含 6 个分类的表格
          const univTable = $univ("div#summary");

          if (univTable.length > 0) {
            const rows = univTable.find("tr").toArray();

            // 获取第一行数据（最新年份）
            if (rows.length >= 2) {
              const firstRow = $univ(rows[1]);
              const tds = firstRow.find("td").toArray();

              // tds 顺序: 東大・京大, 一橋・東京科学・旧５帝大, 国公立大学, 早稲田・慶應・上智, GMARCH, 医学部
              if (tds.length >= 6) {
                school.university_todai_keidai = parseInt($univ(tds[0]).text().trim()) || 0;
                school.university_ichihashi_tokyo_5 = parseInt($univ(tds[1]).text().trim()) || 0;
                school.university_national_public = parseInt($univ(tds[2]).text().trim()) || 0;
                school.university_waseda_keio_socie = parseInt($univ(tds[3]).text().trim()) || 0;
                school.university_gmarch = parseInt($univ(tds[4]).text().trim()) || 0;
                school.university_medical = parseInt($univ(tds[5]).text().trim()) || 0;

                console.log(
                  `    ✓ 東大・京大: ${school.university_todai_keidai}, GMARCH: ${school.university_gmarch}, 医学部: ${school.university_medical}`
                );
              }
            }
          } else {
            console.log(`    - 无大学合格実績`);
          }

          // 获取考试信息
          const examUrl = detailUrl + "exam/";
          console.log(`    📝 获取考试信息...`);

          const examHtml = await fetchHtml(examUrl);
          const $exam = cheerio.load(examHtml);

          // 解析考试信息表格
          const exams = [];
          const examTable = $exam("table.info.mb20");

          // 获取学校官网入試要项 URL
          let examSourceUrl = "";
          const infoUrlDiv = $exam("div.info_url");
          if (infoUrlDiv.length > 0) {
            const link = infoUrlDiv.find("a").attr("href");
            if (link) {
              examSourceUrl = link;
              console.log(`    ✓ 入試要项: ${examSourceUrl}`);
            }
          }

          if (examTable.length > 0) {
            // 查找包含 rowspan 的 td (考试名称和日期)
            const examNameTds = examTable.find("td.da3-td").toArray();

            for (const nameTd of examNameTds) {
              const $nameTd = $exam(nameTd);
              const examName = $nameTd.text().trim();


              // 获取同一行的日期 td
              const parentRow = $nameTd.closest("tr");
              const dateTd = parentRow.find("td.da3-td").eq(1); // 第二个 da3-td 是日期

              // 解析日期和时间
              let examDate = "";
              let startTime = "";
              if (dateTd.length > 0) {
                const dateHtml = dateTd.html() || "";
                const parts = dateHtml.split(/<br\s*\/?>/i);
                examDate = parts[0] ? parts[0].trim() : "";
                startTime = parts[1] ? parts[1].trim() : "";
              }


              exams.push({
                exam_name: examName,
                exam_date: examDate,
                start_time: startTime,
                source_url: examSourceUrl,
              });

              console.log(
                `    ✓ 試験: ${examName} - ${examDate} ${startTime}`
              );
            }
          } else {
            console.log(`    - 无考试信息`);
          }

          // 输出该学校所有考试时间列表
          school.exams = exams;
          if (exams.length > 0) {
            const examList = exams.map(e => `${e.exam_name}(${e.exam_date})`).join(', ');
            console.log(`    📋 考试列表: ${examList}`);
          }

          // 立即保存到数据库
          console.log(`    💾 保存到数据库...`);
          await saveSchoolToDb(db, school);
          console.log(`    ✅ 保存完成`);
        } catch (error) {
          totalErrors++;
          console.error(`    ✗ 获取失败: ${error.message}`);
        }

        // 避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error) {
      totalErrors++;
      logError("Failed to fetch page", error);
      console.error(`  ❌ 获取失败: ${error.message}`);
    }

    // 显示统计信息
    console.log(`\n📊 统计信息`);
    await showStats(db);
    console.log(`\n✅ 完成! (获取: ${totalFetched}所学校, 错误: ${totalErrors})`);
  } catch (error) {
    logError("Fatal error", error);
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }

  // 关闭数据库
  debug("Closing database connection...");
  db.close((err) => {
    if (err) {
      logError("Error closing database", err);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    debug("Script completed", {
      duration: `${duration}s`,
      totalFetched,
      totalErrors,
    });
    console.log(`\n✅ 完成! (耗时: ${duration}秒)`);
  });
}

// 导出函数供其他模块使用
module.exports = { parseHtml, fetchHtml };

// 运行主函数
main();
