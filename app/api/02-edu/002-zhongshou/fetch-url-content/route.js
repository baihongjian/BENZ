/**
 * API 路由：获取URL的内容并使用cheerio解析
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return Response.json({ success: false, error: '缺少URL参数' }, { status: 400 });
  }

  try {
    console.log('Fetching URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      },
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const html = await response.text();

    // 使用 cheerio 解析
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    // 提取标题
    const title = $('title').text() ||
                  $('h1').first().text() ||
                  $('meta[property="og:title"]').attr('content') ||
                  '';

    // 提取主要内容 - 尝试常见的文章内容选择器
    let content = '';

    // 方法1: 查找 article 标签
    const article = $('article').first();
    if (article.length > 0) {
      content = article.html() || '';
    }

    // 方法2: 查找 main 标签
    if (!content) {
      const main = $('main').first();
      if (main.length > 0) {
        content = main.html() || '';
      }
    }

    // 方法3: 查找 class 包含 content, article, post, entry 的 div
    if (!content) {
      const contentDiv = $('[class*="content"], [class*="article"], [class*="post"], [class*="entry"]').first();
      if (contentDiv.length > 0) {
        content = contentDiv.html() || '';
      }
    }

    // 清理内容 - 移除脚本和样式
    $('script, style, nav, header, footer, aside').remove();

    // 获取纯文本内容
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    // 提取摘要
    const excerpt = $('meta[name="description"]').attr('content') ||
                    $('meta[property="og:description"]').attr('content') ||
                    textContent.substring(0, 200);

    return Response.json({
      success: true,
      title: title.trim(),
      content: content || $('body').html()?.substring(0, 10000) || '',
      textContent: textContent.substring(0, 5000),
      excerpt: excerpt.substring(0, 200),
    });
  } catch (error) {
    console.error('获取内容失败:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
