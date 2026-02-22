'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  school: string;
  schoolUrl: string;
  url: string;
  title: string;
}

interface NewsDate {
  date: string;
  count: number;
  items: NewsItem[];
}

export default function ChugakuNewsPage() {
  const [news, setNews] = useState<NewsDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateInfo, setDateInfo] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/02-edu/002-zhongshou/chugaku-news');
      const data = await response.json();

      if (data.success) {
        setDateInfo(data.date);

        if (data.news && data.news.length > 0) {
          // 去重 - 根据学校名和标题
          const seen = new Set();
          const uniqueItems: NewsItem[] = [];

          for (const item of data.news[0].items) {
            const key = `${item.school}-${item.title}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueItems.push(item);
            }
          }

          setNews([{ ...data.news[0], items: uniqueItems }]);
        }

        if (!data.found && data.availableDates) {
          setError(`未找到 ${data.date} 的数据，可用日期: ${data.availableDates.join(', ')}`);
        }
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误');
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
          <p className="mt-1 opacity-90">私立中学校の更新情報を集約</p>
        </div>
      </header>

      {/* 刷新按钮 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? '更新中...' : '更新'}
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
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-blue-600 text-sm"
                        >
                          {item.title}
                        </a>
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
