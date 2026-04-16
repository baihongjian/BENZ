// API 路由：使用 DeepSeek 分析昨天的新闻标题，返回有意思的总结
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { news } = await request.json();

    if (!news || news.length === 0) {
      return NextResponse.json({ error: '没有新闻数据' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 构建新闻列表
    const newsList = news.map((item: any, index: number) => {
      return `${index + 1}. ${item.school_name}: ${item.title}`;
    }).join('\n');

    // 获取新闻日期（默认昨天）
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const newsDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // 构建提示词，要求返回 JSON 格式
    const systemPrompt = `你是一个中学受验信息分析专家。请分析以下新闻标题，挑选出最多7条最有意思、最值得关注的新闻，并给出简要总结。

要求：
1. 优先选择与以下相关的内容：
   - 新的招生政策或变革
   - 重要的入学考试信息
   - 学校特色活动
   - 偏差值变化
   - 升学去向
   - 住宿制学校
2. 每条总结用中文，简洁明了
3. 最多返回7条
4. 返回 JSON 格式，结构如下：
[
  {
    "school_name": "学校名称",
    "title": "新闻标题",
    "summary": "有意思的摘要"
  }
]`;

    const userPrompt = `以下是昨天的新闻标题：\n${newsList}`;

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const summary = data.choices?.[0]?.message?.content || '';

    // 尝试解析 JSON
    let parsedResults = [];
    try {
      // 提取 JSON 部分（可能包含在 ```json ... ``` 中）
      const jsonMatch = summary.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('解析 JSON 失败:', e);
    }

    // 为每个结果添加新闻日期
    const results = parsedResults.map((item: any) => ({
      ...item,
      news_date: newsDate,
    }));

    return NextResponse.json({
      success: true,
      summary: summary,
      results: results,
      analyzedCount: news.length
    });

  } catch (error) {
    console.error('DeepSeek 分析失败:', error);
    return NextResponse.json(
      { error: '分析失败', details: String(error) },
      { status: 500 }
    );
  }
}
