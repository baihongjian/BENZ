/**
 * API 路由：DeepSeek 德语语法检查 + 对话回复
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

    // 获取用户最后一条消息
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // 简单判断是否包含德语内容
    const isGerman = /[äöüß]/i.test(lastUserMessage) ||
      /\b(der|die|das|und|ist|nicht|ich|du|mit|auf|für|sein|haben|werden|können|machen)\b/i.test(lastUserMessage);

    let grammarCheck = '';
    let reply = '';

    if (isGerman && lastUserMessage.length > 2) {
      // 语法检查
      const checkMessages = [
        {
          role: 'system',
          content: `你是一位严格的德语老师。请检查用户回复的德语内容是否正确：

1. 首先检查德语单词拼写是否正确
2. 检查语法（冠词、动词变位、词序等）是否正确
3. 如果有错误，指出错误并给出修改建议

请按以下格式回复：
【语法检查】
- 状态：正确 ✅ 或 有错误 ❌
- 错误：具体说明错误之处（如果有）
- 建议：正确的表达方式（如果有）
如果有错误，
【解释】用中文简单解释错误原因`
        },
        { role: 'user', content: lastUserMessage }
      ];

      const checkResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: checkMessages,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        grammarCheck = checkData.choices?.[0]?.message?.content || '';
      }

      // 对话回复
      const chatMessages = [
        {
          role: 'system',
          content: '你是一位友好的德语老师，帮助学生学习德语。请用德语回复学生（德语部分限制在10个单词以内），然后在下一行提供中文翻译。如果学生用中文或英文提问，你也用相应的语言回复。请保持回复简洁，适合初学者理解。格式：\n德语：...\n中文：...'
        },
        ...messages
      ];

      const chatResponse = await fetch(DEEPSEEK_API_URL, {
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

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        reply = chatData.choices?.[0]?.message?.content || '';
      }
    }

    // 如果不是德语，只返回对话回复
    if (!isGerman) {
      const chatMessages = [
        {
          role: 'system',
          content: '你是一位友好的德语老师，帮助学生学习德语。请用德语回复学生（德语部分限制在10个单词以内），然后在下一行提供中文翻译。如果学生用中文或英文提问，你也用相应的语言回复。请保持回复简洁，适合初学者理解。格式：\n德语：...\n中文：...'
        },
        ...messages
      ];

      const chatResponse = await fetch(DEEPSEEK_API_URL, {
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

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        reply = chatData.choices?.[0]?.message?.content || '';
      }
    }

    // 如果都不是德语，提示输入德语
    if (!grammarCheck && !reply) {
      reply = '德语：Bitte schreibe einen deutschen Satz.\n中文：请写一句德语。';
    }

    return Response.json({ grammarCheck, reply });
  } catch (error) {
    console.error('错误:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}