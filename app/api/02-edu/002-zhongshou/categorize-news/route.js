/**
 * API 路由：使用 DeepSeek 分类汇总新闻
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { news } = body;

    if (!news || !Array.isArray(news) || news.length === 0) {
      return Response.json({ success: false, error: '缺少新闻数据' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

    // 构建新闻列表（包含id）
    const newsListWithId = news.map((item, index) => `${index + 1}. [id:${item.id}] ${item.title} (${item.school})`).join('\n');

    const prompt = `以下のチョコレ中学ニュース記事のタイトルを分析して相关新闻内容に基づいて適切なカテゴリに分類してください。

ニュース一覧:
${newsListWithId}

以下のJSON形式 で返してください（JSONのみ返し、他の内容は返さないでください）：
{
  "categories": [
    {
      "category": "あなたが考える適切なカテゴリ名",
      "description": "このカテゴリに分類した理由",
      "news": [
        { "id": 記事ID, "title": "記事タイトル", "school": "学校名", "importance": 1-5 }
      ]
    }
  ]
}

重要度(importance)は：
- 5: 非常に重要（入学試験日程、募集締切、校長インタビューなど）
- 4: 比較的重要（説明会、体験会、入試説明など）
- 3: 中程度（行事案内、修学旅行、体育祭、文化祭など）
- 2: 軽微（軽なお知らせ、更新情報など）
- 1: その他の情報

重要なポイント：
- カテゴリ名はニュースの内容に基づいてあなたが適切だと思う名前を付けてください
- 同じカテゴリ内のニュースは重要度の高い順に並べ替他一下
- 全てのニュースをいずれかのカテゴリに分類してください
- 必ず各ニュースのidを含めるてください`;

    console.log('[Categorize] DeepSeekにリクエスト送信中...');

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

    console.log('[Categorize] DeepSeek 応答状態:', response.status);

    const data = await response.json();
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

    console.log('[Categorize] 清洗後のJSON:', jsonStr);

    // 解析 JSON
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('[Categorize] 分析成功:', parsed);

      return Response.json({
        success: true,
        categories: parsed.categories || [],
      });
    } catch (ParseError) {
      console.log('[Categorize] JSON 解析失败:', jsonStr);
      return Response.json({
        success: false,
        error: '解析失败',
        raw: jsonStr,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Categorize] DeepSeek 分析失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
