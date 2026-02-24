'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  school: string;
  schoolUrl: string;
  url: string;
  title: string;
  content?: string;
  textContent?: string;
  summary?: string;
}

interface NewsDate {
  date: string;
  count: number;
  items: NewsItem[];
}

interface ArticleContent {
  title: string;
  content: string;
  textContent: string;
}

export default function ChugakuNewsPage() {
  const [news, setNews] = useState<NewsDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateInfo, setDateInfo] = useState('');

  // 详情弹窗状态
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [articleContent, setArticleContent] = useState<ArticleContent | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  // 获取单条新闻的详细内容
  const fetchArticleContent = async (url: string): Promise<{ content: string; textContent: string }> => {
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/fetch-url-content?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.success) {
        return { content: data.content || '', textContent: data.textContent || '' };
      }
    } catch (err) {
      console.error('获取内容失败:', err);
    }
    return { content: '', textContent: '' };
  };

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. 通过 AWS API 获取前一天的数据
      const response = await fetch('https://kmacsxuphh.execute-api.ap-northeast-1.amazonaws.com/dev/updates?limit=50');
      const data = await response.json();

      console.log('AWS API 返回数据:', data);

      // 获取前一天日期
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const targetDateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      console.log('目标日期:', targetDateStr);

      // 筛选前一天的数据
      const filteredItems = data.updates.filter((item: any) => {
        return item.posted_date && item.posted_date.startsWith(targetDateStr);
      });

      console.log('筛选后的数据:', filteredItems.length);

      // 使用筛选后的数据
      const items: NewsItem[] = filteredItems.map((item: any) => ({
        school: item.school.name || '',
        schoolUrl: item.school.website_url || '',
        url: item.url || '',
        title: item.title || '',
      }));

      console.log('提取到的新闻项:', items.length);

      // 去重
      const seen = new Set();
      const uniqueItems: NewsItem[] = [];

      setLoading(true);

      for (const item of items) {
        const key = `${item.school}-${item.title}`;
        if (!seen.has(key)) {
          seen.add(key);

          // 获取详细内容
          const contentData = await fetchArticleContent(item.url);
          uniqueItems.push({
            school: item.school,
            schoolUrl: item.schoolUrl,
            url: item.url,
            title: item.title,
            content: contentData.content,
            textContent: contentData.textContent,
          });
        }
      }

      // 3. 保存到数据库（包含详细内容）
      const saveResponse = await fetch('/api/02-edu/002-zhongshou/school-news-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: uniqueItems, newsDate: targetDateStr }),
      });
      const saveResult = await saveResponse.json();
      console.log('保存结果:', saveResult);

      // 4. 从数据库加载（获取已分析的数据）
      const loadResponse = await fetch('/api/02-edu/002-zhongshou/school-news-db?limit=100');
      const loadResult = await loadResponse.json();

      if (loadResult.success && loadResult.data) {
        // 将数据库数据转换为页面需要的格式
        const dbNews = loadResult.data;

        // 按日期分组
        const newsByDate: { [key: string]: NewsItem[] } = {};
        for (const item of dbNews) {
          const dateKey = item.news_date || targetDateStr;
          if (!newsByDate[dateKey]) {
            newsByDate[dateKey] = [];
          }
          newsByDate[dateKey].push({
            school: item.school_name,
            schoolUrl: item.school_url,
            url: item.url,
            title: item.title,
            content: item.content,
            textContent: item.text_content,
            summary: item.summary,
          });
        }

        // 转换为数组
        const newsDates: NewsDate[] = Object.entries(newsByDate).map(([date, items]) => ({
          date,
          count: items.length,
          items,
        }));

        setNews(newsDates);
      } else {
        // 如果没有数据库数据，直接显示抓取的数据
        setNews([{ date: targetDateStr, count: uniqueItems.length, items: uniqueItems }]);
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 打开文章详情弹窗
  const openArticleModal = async (item: NewsItem) => {
    if (!item.url) return;

    setSelectedArticle(item);
    setArticleLoading(true);
    setArticleContent(null);

    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/fetch-url-content?url=${encodeURIComponent(item.url)}`);
      const data = await response.json();

      if (data.success) {
        setArticleContent({
          title: data.title,
          content: data.content,
          textContent: data.textContent,
        });
      } else {
        setArticleContent({
          title: item.title,
          content: `<p>获取内容失败: ${data.error}</p>`,
          textContent: '',
        });
      }
    } catch (err) {
      setArticleContent({
        title: item.title,
        content: '<p>网络错误</p>',
        textContent: '',
      });
    } finally {
      setArticleLoading(false);
    }
  };

  // 关闭详情弹窗
  const closeDetail = () => {
    setSelectedArticle(null);
    setArticleContent(null);
  };

  // 分析单条新闻
  const analyzeNews = async (item: NewsItem) => {
    if (!item.textContent) {
      alert('没有内容可分析');
      return;
    }

    try {
      const response = await fetch('/api/02-edu/002-zhongshou/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          textContent: item.textContent,
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert(`概要: ${data.summary}\n分类: ${data.category}\n重要性: ${data.importance}`);
      } else {
        alert(`分析失败: ${data.error}`);
      }
    } catch (err) {
      alert('分析请求失败');
    }
  };

  // 批量分析所有新闻
  const analyzeAllNews = async () => {
    // 从数据库加载未分析的记录
    const loadResponse = await fetch('/api/02-edu/002-zhongshou/school-news-db?limit=100');
    const loadResult = await loadResponse.json();

    if (!loadResult.success || !loadResult.data) {
      alert('没有数据');
      return;
    }

    console.log('加载的新闻数据:', loadResult.data.map(item => ({ id: item.id, title: item.title?.substring(0, 20), summary: item.summary })));
    const unanalyzedItems = loadResult.data.filter(item => !item.summary);
    console.log('未分析的项目:', unanalyzedItems.map(item => ({ id: item.id, title: item.title?.substring(0, 20) })));
    if (unanalyzedItems.length === 0) {
      alert('所有新闻已分析完成');
      return;
    }

    if (!confirm(`将分析 ${unanalyzedItems.length} 条新闻，是否继续？`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of unanalyzedItems) {
      try {
        const response = await fetch('/api/02-edu/002-zhongshou/analyze-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            textContent: item.text_content,
          }),
        });
        const data = await response.json();

        if (data.success) {
          console.log('保存分析结果:', { id: item.id, summary: data.summary, importance: data.importance });
          // 保存分析结果到数据库
          await fetch('/api/02-edu/002-zhongshou/school-news-db/update-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id,
              summary: data.summary,
              importance: data.importance,
            }),
          });
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    setLoading(false);
    alert(`分析完成: 成功 ${successCount}, 失败 ${errorCount}`);

    // 刷新数据
    fetchNews();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">中学受験ナビ - 最新情報</h1>
          <p className="mt-1 opacity-90">私立中学校の更新情報を集約</p>
        </div>
      </header>

      {/* 刷新按钮和分析按钮 */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex gap-2">
        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? '更新中...' : '更新'}
        </button>
        <button
          onClick={analyzeAllNews}
          disabled={loading}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? '分析中...' : 'AI分析'}
        </button>
      </div>

      {/* 内容 */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : news.length > 0 ? (
          news.map((newsDate, index) => (
            <div key={index} className="mb-6">
              {/* 日期标题 */}
              <div className="flex items-center gap-3 mt-6 mb-4 first:mt-0">
                <time className="text-[15px] font-semibold text-gray-700 whitespace-nowrap">
                  {newsDate.date}
                </time>
                <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {newsDate.items.length}件
                </span>
                <span className="flex-1 h-px bg-gray-200"></span>
              </div>

              {/* 新闻列表 */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {newsDate.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="py-3 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={item.schoolUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline whitespace-nowrap"
                        >
                          {item.school}
                        </a>
                      </div>
                      {item.title && (
                        <button
                          onClick={() => openArticleModal(item)}
                          className="text-left text-gray-700 hover:text-blue-600 text-sm cursor-pointer"
                        >
                          {item.title}
                        </button>
                      )}
                      {item.summary && (
                        <p className="text-xs text-gray-500 mt-1">{item.summary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            暂无数据
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDetail}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold truncate flex-1 mr-4">{selectedArticle.title}</h3>
              <button
                onClick={closeDetail}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6">
              {articleLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-500">获取内容中...</p>
                </div>
              ) : articleContent ? (
                <div>
                  <h1 className="text-xl font-bold mb-4">{articleContent.title}</h1>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: articleContent.content }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    原文链接
                  </a>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t flex justify-between items-center">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                访问原文
              </a>
              <button
                onClick={closeDetail}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm opacity-70">データソース: chugaku-juken-navi.com</p>
          <p className="text-xs opacity-50 mt-2">© 2026 中学受験ナビ</p>
        </div>
      </footer>
    </div>
  );
}
