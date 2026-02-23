/**
 * API 路由：使用 DeepSeek 分析新闻内容
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { textContent, title } = body;

    console.log('[Analyze] 收到分析请求:', { title: title?.substring(0, 50), contentLength: textContent?.length });

    if (!textContent) {
      console.log('[Analyze] 错误: 缺少内容');
      return Response.json({ success: false, error: '缺少内容' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

    console.log('[Analyze] API Key 状态:', DEEPSEEK_API_KEY ? '已配置' : '未配置');

    if (!DEEPSEEK_API_KEY) {
      console.log('[Analyze] 错误: API Key 未配置');
      return Response.json({ success: false, error: 'API Key 未配置' }, { status: 500 });
    }

    const prompt = `请分析以下日本中学新闻，提取关键信息。

新闻标题: ${title}
新闻内容: ${textContent.substring(0, 2000)}

请返回JSON格式的分析结果（只返回JSON，不要其他内容）：
{
  "summary": "50字以内的概要",
  "importance": 重要性评分 1-5
}`;

    console.log('[Analyze] 发送请求到 DeepSeek...');

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    console.log('[Analyze] DeepSeek 响应状态:', response.status);

    const data = await response.json();
    console.log('[Analyze] DeepSeek 响应数据:', JSON.stringify(data).substring(0, 200));

    const result = data.choices?.[0]?.message?.content || '';

    // 去除 markdown 代码块格式
    let jsonStr = result.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    console.log('[Analyze] 清洗后的 JSON:', jsonStr);

    // 解析 JSON
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('[Analyze] 解析成功:', parsed);

      return Response.json({
        success: true,
        summary: parsed.summary || '',
        importance: parsed.importance || 1,
      });
    } catch (parseError) {
      console.log('[Analyze] JSON 解析失败:', result);
      return Response.json({
        success: false,
        error: '解析失败',
        raw: result,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Analyze] DeepSeek 分析失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
