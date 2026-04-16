'use client';

import { useState, useEffect, useMemo } from 'react';

interface NewsItem {
  id: number;
  school_name: string;
  school_url: string;
  url: string;
  title: string;
  news_date: string;
  summary: string;
  category: string;
}

export default function NewsListPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // 按日期分组新闻
  const groupedNews = useMemo(() => {
    const groups: { [key: string]: NewsItem[] } = {};
    news.forEach((item) => {
      const date = item.news_date || 'Unknown';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    // 按日期倒序排列
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [news]);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError('');
    try {
      // 获取最近3天的新闻
      const response = await fetch('/api/02-edu/002-zhongshou/school-news-db?limit=100&days=3');
      const result = await response.json();

      console.log('=== API 返回结果 ===');
      console.log('success:', result.success);
      console.log('data:', result.data);
      console.log('data length:', result.data?.length);
      console.log('data[0]:', result.data?.[0]);

      if (result.success) {
        setNews(result.data || []);
      } else {
        setError(result.error || '加载失败');
      }
    } catch (err) {
      console.error('加载失败:', err);
      setError('加载失败: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">中学受験ナビ - 最新情報</h1>
          <p className="mt-1 opacity-90">私立中学校の更新情報を集約（過去3日間）</p>
        </div>
      </header>

      {/* 内容 */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* 学校信息大卡片 - 单条新闻显示 */}
        {news.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-blue-500 shadow-lg p-6 mb-8">
            {/* 导航按钮和计数 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentIndex((currentIndex - 1 + news.length) % news.length)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                ← 前へ
              </button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {news.length}
              </span>
              <button
                onClick={() => setCurrentIndex((currentIndex + 1) % news.length)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                次へ →
              </button>
            </div>

            {/* 当前新闻详情 */}
            {news[currentIndex] && (
              <div>
                {/* 新闻标题 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    {news[currentIndex].title}
                  </h2>
                  {news[currentIndex].summary && (
                    <p className="text-gray-600">{news[currentIndex].summary}</p>
                  )}
                </div>

                {/* 学校信息 */}
                <div className="flex items-start gap-4">
                  <div className="w-1/3 text-left">
                    <h3 className="text-xl font-bold text-blue-600">
                      {news[currentIndex].school_name}
                    </h3>
                  </div>
                  <div className="w-2/3 text-right">
                    <p className="text-gray-600 mb-1">{news[currentIndex].summary}</p>
                    <div className="flex items-center justify-end gap-3 text-sm text-gray-500">
                      <time>{news[currentIndex].news_date}</time>
                      {news[currentIndex].category && (
                        <>
                          <span>•</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {news[currentIndex].category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
          <div className="space-y-6">
            {groupedNews.map(([date, items]) => (
              <div key={date}>
                {/* 日期标题 */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-bold text-gray-800">{date}</h2>
                  <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {items.length}件
                  </span>
                </div>
                {/* 新闻列表 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="py-3 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-1">
                        {/* 学校名和日期 */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-blue-600">
                            {item.school_name}
                          </span>
                          <span>•</span>
                          <time>{item.news_date}</time>
                          {item.category && (
                            <>
                              <span>•</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.category}</span>
                            </>
                          )}
                        </div>
                        {/* 标题 */}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-800 hover:text-blue-600 font-medium"
                        >
                          {item.title}
                        </a>
                        {/* 摘要 */}
                        {item.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            过去3天没有新闻数据
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-12">
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-500">
            © 中学受験ナビ - All rights reserved.
        </div>
      </footer>
    </div>
  );
}
