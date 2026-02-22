/**
 * API 路由：搜索学校最新消息
 * 使用 SearXNG 搜索 API
 */

const SEARXNG_URL = 'https://searxng-docker-zhongshou-1.onrender.com';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const schoolName = searchParams.get('name');

  if (!schoolName) {
    return Response.json({ success: false, error: '缺少学校名称' }, { status: 400 });
  }

  try {
    // 搜索关键词：学校名 + 入試 + 2025 或 学校名 + お知らせ
    const query = `${schoolName} 入試 2025`;
    const encodedQuery = encodeURIComponent(query);

    const url = `${SEARXNG_URL}/search?q=${encodedQuery}&format=json`;

    console.log('Searching:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search results:', data);

    // 提取搜索结果
    const results = (data.results || []).slice(0, 10).map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content?.substring(0, 200) || '',
      engine: result.engine,
    }));

    return Response.json({
      success: true,
      results,
      query,
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
