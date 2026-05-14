/**
 * API 路由：DeepSeek 德语对话练习
 */

export const dynamic = 'force-dynamic';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: '缺少消息' }, { status: 400 });
    }

    if (!API_KEY) {
      return Response.json({ error: 'API 密钥未配置' }, { status: 500 });
    }

    // 构建对话历史
    const chatMessages = [
      {
        role: 'system',
        content: '你是一位友好的德语老师，帮助学生学习德语。请用德语回复学生（德语部分限制在10个单词以内），然后在下一行提供中文翻译。如果学生用中文或英文提问，你也用相应的语言回复。请保持回复简洁，适合初学者理解。格式：\n德语：...\n中文：...'
      },
      ...messages
    ];

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API 错误:', errorData);
      return Response.json({ error: '调用 DeepSeek 失败' }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return Response.json({ reply });
  } catch (error) {
    console.error('对话错误:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}