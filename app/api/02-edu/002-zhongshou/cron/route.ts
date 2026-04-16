// API 路由：定时自动执行任务
// 更新数据 → AI分析 → AI分类汇总
// 可通过 cron 服务定时调用此接口

import { NextResponse } from 'next/server';

// 模拟 fetchNews 功能
async function fetchNews() {
  const awsUrl = 'https://kmacsxuphh.execute-api.ap-northeast-1.amazonaws.com/dev/updates?limit=100';
  const response = await fetch(awsUrl);
  const data = await response.json();

  // 获取前一天日期
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 筛选前一天的数据
  const filteredItems = data.updates?.filter((item: any) => {
    return item.posted_date && item.posted_date.startsWith(targetDateStr);
  }) || [];

  console.log(`[Cron] 获取到 ${filteredItems.length} 条数据`);

  return filteredItems;
}

// 模拟 analyzeNews 功能
async function analyzeNews(title: string, textContent: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个新闻摘要助手，请用简短的几句话总结以下新闻的要点。' },
          { role: 'user', content: `标题: ${title}\n内容: ${textContent?.substring(0, 3000)}` }
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      summary: summary,
      importance: summary.length > 50 ? '高' : '低',
    };
  } catch (error) {
    console.error('[Cron] AI分析失败:', error);
    return { success: false, error: String(error) };
  }
}

export async function POST(request: Request) {
  try {
    // 验证请求是否来自授权的 cron 服务（可以通过环境变量配置）
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] ========== 开始执行定时任务 ==========');
    console.log('[Cron] 时间:', new Date().toISOString());

    // 步骤1：获取数据
    console.log('[Cron] 步骤1: 获取数据...');
    const items = await fetchNews();

    if (items.length === 0) {
      console.log('[Cron] 没有新数据，任务结束');
      return NextResponse.json({
        success: true,
        message: 'No new data to process',
        steps: ['fetch']
      });
    }

    // 步骤2：保存到数据库并分析
    console.log(`[Cron] 步骤2: 保存 ${items.length} 条数据到数据库并分析...`);
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        // 获取详细内容
        const contentResponse = await fetch(`/api/02-edu/002-zhongshou/fetch-url-content?url=${encodeURIComponent(item.url)}`);
        const contentData = await contentResponse.json();

        // 保存到数据库
        const saveResponse = await fetch('/api/02-edu/002-zhongshou/school-news-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolName: item.school?.name || '',
            schoolUrl: item.school?.website_url || '',
            url: item.url || '',
            title: item.title || '',
            newsDate: item.posted_date || '',
            content: contentData.content || '',
            textContent: contentData.textContent || '',
          }),
        });

        const saveResult = await saveResponse.json();

        // AI 分析
        if (saveResult.id && contentData.textContent) {
          const analyzeResult = await analyzeNews(item.title, contentData.textContent);

          if (analyzeResult.success) {
            // 更新分析结果
            await fetch('/api/02-edu/002-zhongshou/school-news-db/update-analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: saveResult.id,
                summary: analyzeResult.summary,
                importance: analyzeResult.importance,
              }),
            });
            successCount++;
          }
        }
      } catch (err) {
        console.error('[Cron] 处理单条数据失败:', err);
        errorCount++;
      }
    }

    console.log(`[Cron] 数据处理完成: 成功 ${successCount}, 失败 ${errorCount}`);

    console.log('[Cron] ========== 定时任务执行完成 ==========');

    return NextResponse.json({
      success: true,
      message: 'Task completed',
      steps: ['fetch', 'analyze'],
      results: {
        fetched: items.length,
        analyzed: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('[Cron] 执行失败:', error);
    return NextResponse.json(
      { error: 'Task failed', details: String(error) },
      { status: 500 }
    );
  }
}

// GET 请求也可以触发（用于测试）
export async function GET() {
  return POST(new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({})
  }) as any);
}
