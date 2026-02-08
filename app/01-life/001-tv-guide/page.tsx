"use client";

import { useState, useEffect } from "react";

interface Anime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
  synopsis?: string;
  score?: number;
  genres: Array<{ name: string }>;
  airing: boolean;
  aired?: {
    string?: string;
  };
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  producers?: Array<{ name: string }>;
}

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: { key: DayOfWeek; label: string; ja: string }[] = [
  { key: "monday", label: "周一", ja: "月曜日" },
  { key: "tuesday", label: "周二", ja: "火曜日" },
  { key: "wednesday", label: "周三", ja: "水曜日" },
  { key: "thursday", label: "周四", ja: "木曜日" },
  { key: "friday", label: "周五", ja: "金曜日" },
  { key: "saturday", label: "周六", ja: "土曜日" },
  { key: "sunday", label: "周日", ja: "日曜日" },
];

// 获取当前星期的key
const getCurrentDayKey = (): DayOfWeek => {
  const days: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
};

export default function TVGuide() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDayKey());
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  // 过滤条件
  const [filterScore, setFilterScore] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnimeSchedule();
  }, [selectedDay]);

  const fetchAnimeSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.jikan.mojo/v4/schedules?filter=tv`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setAnimeList(data.data || []);
    } catch (err) {
      setError("获取数据失败，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 根据星期过滤动画
  const filteredAnime = animeList.filter((anime) => {
    const broadcastDay = anime.broadcast?.day?.toLowerCase() as DayOfWeek | undefined;
    const matchesDay = broadcastDay === selectedDay || !broadcastDay; // 如果没有广播信息，显示所有

    const matchesSearch = searchTerm === "" ||
      anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anime.title_english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anime.title_japanese?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScore = filterScore === null || (anime.score && anime.score >= filterScore);

    return matchesDay && matchesSearch && matchesScore;
  });

  // 按时间排序
  const sortedAnime = [...filteredAnime].sort((a, b) => {
    const timeA = a.broadcast?.time || "";
    const timeB = b.broadcast?.time || "";
    return timeA.localeCompare(timeB);
  });

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">🇯🇵 日本动画时间表</h1>
          <p className="text-gray-600">
            每周 {DAYS.find(d => d.key === selectedDay)?.ja} ({DAYS.find(d => d.key === selectedDay)?.label}) 放送的动画
          </p>
        </header>

        {/* 星期选择器 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedDay === day.key
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-purple-50"
              }`}
            >
              {day.label} ({day.ja})
            </button>
          ))}
        </div>

        {/* 搜索和过滤 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="搜索动画名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={filterScore || ""}
              onChange={(e) => setFilterScore(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">所有评分</option>
              <option value="8">8分以上</option>
              <option value="7">7分以上</option>
              <option value="6">6分以上</option>
            </select>
            <span className="text-gray-500">
              共 {sortedAnime.length} 部动画
            </span>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchAnimeSchedule}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
            >
              重试
            </button>
          </div>
        )}

        {/* 动画列表 */}
        {!loading && !error && (
          <div className="grid gap-4">
            {sortedAnime.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                <div className="text-gray-400 text-6xl mb-4">📺</div>
                <p className="text-gray-600">该日期暂无动画播出</p>
              </div>
            ) : (
              sortedAnime.map((anime) => (
                <div
                  key={anime.mal_id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAnime(anime)}
                >
                  <div className="flex">
                    {/* 左侧图片 */}
                    <div className="w-32 h-40 flex-shrink-0">
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 右侧内容 */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{anime.title}</h3>
                          {anime.title_english && anime.title_english !== anime.title && (
                            <p className="text-sm text-gray-500">{anime.title_english}</p>
                          )}
                          {anime.title_japanese && (
                            <p className="text-sm text-gray-400">{anime.title_japanese}</p>
                          )}
                        </div>
                        {anime.score && (
                          <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                            <span className="text-yellow-600">⭐</span>
                            <span className="font-bold text-yellow-700">{anime.score}</span>
                          </div>
                        )}
                      </div>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {anime.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre.name}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>

                      {/* 广播时间 */}
                      {anime.broadcast?.string && (
                        <p className="text-sm text-gray-500 mt-2">
                          📡 {anime.broadcast.string}
                        </p>
                      )}

                      {/* 简介 */}
                      {anime.synopsis && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {anime.synopsis}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <a href="/" className="text-purple-600 hover:underline">← 返回首页</a>
        </div>

        {/* 动画详情弹窗 */}
        {selectedAnime && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAnime(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部图片 */}
              <div className="relative h-64">
                <img
                  src={selectedAnime.images.jpg.large_image_url || selectedAnime.images.jpg.image_url}
                  alt={selectedAnime.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                >
                  ✕
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800">{selectedAnime.title}</h2>
                {selectedAnime.title_english && (
                  <p className="text-gray-500">{selectedAnime.title_english}</p>
                )}
                {selectedAnime.title_japanese && (
                  <p className="text-gray-400">{selectedAnime.title_japanese}</p>
                )}

                <div className="flex items-center gap-4 mt-4">
                  {selectedAnime.score && (
                    <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                      <span className="text-yellow-600">⭐</span>
                      <span className="font-bold text-yellow-700">{selectedAnime.score}</span>
                    </div>
                  )}
                  {selectedAnime.broadcast?.string && (
                    <span className="text-gray-500">📡 {selectedAnime.broadcast.string}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedAnime.genres.map((genre) => (
                    <span
                      key={genre.name}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {selectedAnime.synopsis && (
                  <div className="mt-4">
                    <h3 className="font-bold text-gray-800 mb-2">简介</h3>
                    <p className="text-gray-600 leading-relaxed">{selectedAnime.synopsis}</p>
                  </div>
                )}

                {selectedAnime.producers && selectedAnime.producers.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-bold text-gray-800 mb-2">制作方</h3>
                    <p className="text-gray-600">
                      {selectedAnime.producers.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className="p-4 border-t bg-gray-50">
                <a
                  href={`https://myanimelist.net/anime/${selectedAnime.mal_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-purple-600 text-white text-center rounded-full font-medium hover:bg-purple-700 transition"
                >
                  在 MyAnimeList 查看详情 →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CSS */}
        <style jsx global>{`
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </main>
  );
}
