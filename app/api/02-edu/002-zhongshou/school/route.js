export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const raw = searchParams.get('raw');

  console.log('Fetching URL:', url);

  if (!url) {
    return Response.json({ error: 'url parameter required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return Response.json({ error: `HTTP ${response.status}` }, { status: response.status });
    }

    const html = await response.text();
    console.log('HTML length:', html.length);

    // 如果请求原始HTML，直接返回
    if (raw === 'true') {
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return Response.json({
      success: true,
      htmlLength: html.length,
      preview: html.substring(0, 500),
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}