"use client";

import { useState, useEffect, useMemo } from "react";

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

const DAYS: { key: DayOfWeek; label: string; ja: string; short: string }[] = [
  { key: "monday", label: "周一", ja: "月曜日", short: "月" },
  { key: "tuesday", label: "周二", ja: "火曜日", short: "火" },
  { key: "wednesday", label: "周三", ja: "水曜日", short: "水" },
  { key: "thursday", label: "周四", ja: "木曜日", short: "木" },
  { key: "friday", label: "周五", ja: "金曜日", short: "金" },
  { key: "saturday", label: "周六", ja: "土曜日", short: "土" },
  { key: "sunday", label: "周日", ja: "日曜日", short: "日" },
];

// 時間快捷オプション
const TIME_SLOTS = [
  { label: "深夜", time: "00:00" },
  { label: "朝", time: "06:00" },
  { label: "昼", time: "12:00" },
  { label: "夕方", time: "17:00" },
  { label: "夜", time: "21:00" },
  { label: "真夜中", time: "24:00" },
];

// チャンネル分類
const CHANNEL_TYPES = [
  { key: "all", label: "全", color: "#4fc3f7" },
  { key: "action", label: "アクション", color: "#e53935" },
  { key: "adventure", label: "アドベンチャー", color: "#43a047" },
  { key: "comedy", label: "コメディ", color: "#fb8c00" },
  { key: "drama", label: "ドラマ", color: "#1e88e5" },
  { key: "slice-of-life", label: "日常", color: "#e91e63" },
  { key: "fantasy", label: "ファンタジー", color: "#8e24aa" },
  { key: "horror", label: "ホラー", color: "#424242" },
  { key: "mecha", label: "メカ", color: "#6d4c41" },
  { key: "mystery", label: "ミステリー", color: "#546e7a" },
  { key: "psychological", label: "心理", color: "#263238" },
  { key: "romance", label: "ロマンス", color: "#f06292" },
  { key: "sci-fi", label: "SF", color: "#00acc1" },
  { key: "sports", label: "スポーツ", color: "#4caf50" },
  { key: "supernatural", label: "超自然", color: "#5d4037" },
];

const getCurrentDayKey = (): DayOfWeek => {
  const days: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
};

export default function TVGuide() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDayKey());
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedChannelType, setSelectedChannelType] = useState("all");
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnimeSchedule();
  }, [selectedDay]);

  const fetchAnimeSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.jikan.moe/v4/schedules?filter=tv`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setAnimeList(data.data || []);
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // アニメをフィルタリング
  const filteredAnime = useMemo(() => {
    return animeList.filter((anime) => {
      const broadcastDay = anime.broadcast?.day?.toLowerCase() as DayOfWeek | undefined;
      const matchesDay = broadcastDay === selectedDay;

      const matchesSearch =
        searchTerm === "" ||
        anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anime.title_english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anime.title_japanese?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesChannelType =
        selectedChannelType === "all" ||
        anime.genres.some((g) => g.name.toLowerCase().replace(/[^a-z]/g, "-") === selectedChannelType);

      return matchesDay && matchesSearch && matchesChannelType;
    });
  }, [animeList, selectedDay, searchTerm, selectedChannelType]);

  // 時間で並べ替え
  const sortedAnime = [...filteredAnime].sort((a, b) => {
    const timeA = a.broadcast?.time || "";
    const timeB = b.broadcast?.time || "";
    return timeA.localeCompare(timeB);
  });

  // 時間フォーマット
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "--:--";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  // ジャンルから色を取得
  const getGenreColor = (anime: Anime) => {
    const mainGenre = anime.genres[0]?.name.toLowerCase().replace(/[^a-z]/g, "-");
    const channel = CHANNEL_TYPES.find((c) => c.key === mainGenre);
    return channel?.color || "#4fc3f7";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部ナビゲーション */}
      <header className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM6 10h2v2H6zm0-4h2v2H6zm4 0h8v2h-8zm0 4h8v2h-8z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">J:COM テレビ番組表</h1>
                <p className="text-xs text-cyan-100">日本のアニメ放送時間</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                お気に入り
              </button>
              <button
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                onClick={() => say("選択してください")}
              >
                番組提醒
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 地域選択（模擬） */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">地域：</span>
            <button
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              onClick={() => say("選択してください")}
            >
              <span className="text-gray-800 font-medium">関東・甲信越</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <span className="text-gray-400">|</span>
            <span className="text-cyan-600">関東地域の番組を表示中</span>
          </div>
        </div>
      </div>

      {/* 曜日ナビゲーション */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex overflow-x-auto py-3 gap-2 scrollbar-hide">
              {DAYS.map((day) => {
                const isToday = day.key === getCurrentDayKey();
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`flex-shrink-0 px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedDay === day.key
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md transform scale-105"
                        : "bg-gray-100 text-gray-600 hover:bg-cyan-50"
                    }`}
                  >
                    <span className="block text-sm">{day.short}</span>
                    <span className={`text-xs ${isToday && selectedDay !== day.key ? "text-cyan-600" : ""}`}>
                      {day.label}
                    </span>
                    {isToday && (
                      <span className="block text-[10px] opacity-75">本日</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 時間快捷切换 */}
            <div className="hidden lg:flex items-center gap-2 ml-4">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${
                    selectedTime === slot.time
                      ? "bg-cyan-100 text-cyan-700 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 検索欄 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="番組を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
              />
            </div>
            <span className="text-sm text-gray-500">
              {DAYS.find((d) => d.key === selectedDay)?.ja} ·
              現在 {sortedAnime.length} 番組
            </span>
          </div>
        </div>
      </div>

      {/* チャンネル分類筛选 */}
      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">チャンネル：</span>
            {CHANNEL_TYPES.slice(0, 8).map((type) => (
              <button
                key={type.key}
                onClick={() => setSelectedChannelType(type.key)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  selectedChannelType === type.key
                    ? "text-white shadow-md"
                    : "bg-white text-gray-600 hover:shadow-sm"
                }`}
                style={{
                  backgroundColor: selectedChannelType === type.key ? type.color : undefined,
                }}
              >
                {type.label}
              </button>
            ))}
            <button
              className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-100 rounded-full transition"
              onClick={() => say("選択してください")}
            >
              更多...
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 加载状態 */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-cyan-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4">読み込み中...</p>
          </div>
        )}

        {/* エラー状態 */}
        {error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnimeSchedule}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
              再試行
            </button>
          </div>
        )}

        {/* アニメリスト */}
        {!loading && !error && (
          <>
            {sortedAnime.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-600">この日付に番組はありません</p>
                <p className="text-sm text-gray-400 mt-1">他の日付またはフィルター条件を選択してください</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedAnime.map((anime) => (
                  <div
                    key={anime.mal_id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelectedAnime(anime)}
                  >
                    <div className="flex">
                      {/* 左側タイムライン */}
                      <div className="w-24 md:w-32 bg-gradient-to-br from-cyan-500 to-teal-500 text-white flex flex-col items-center justify-center p-4 flex-shrink-0">
                        <span className="text-2xl font-bold">
                          {formatTime(anime.broadcast?.time || "")}
                        </span>
                        <span className="text-xs opacity-80 mt-1">放送開始</span>
                        <div className="w-full h-px bg-white/30 mt-3"></div>
                        <div className="mt-2 flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getGenreColor(anime) }}
                          ></div>
                          <span className="text-xs">{anime.genres[0]?.name || "アニメ"}</span>
                        </div>
                      </div>

                      {/* 中央画像 */}
                      <div className="w-24 h-32 md:w-28 md:h-36 flex-shrink-0 relative overflow-hidden">
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        {anime.score && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-sm font-bold">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {anime.score}
                          </div>
                        )}
                      </div>

                      {/* 右側コンテンツ */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg group-hover:text-cyan-600 transition">
                            {anime.title}
                          </h3>
                          {(anime.title_english || anime.title_japanese) && (
                            <p className="text-sm text-gray-500 mt-1">
                              {anime.title_english || anime.title_japanese}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {anime.genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre.name}
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: `${getGenreColor(anime)}20`,
                                color: getGenreColor(anime),
                              }}
                            >
                              {genre.name}
                            </span>
                          ))}
                        </div>

                        {anime.synopsis && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {anime.synopsis}
                          </p>
                        )}
                      </div>

                      {/* 右側矢印 */}
                      <div className="hidden md:flex items-center justify-center w-12 flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-gray-300 group-hover:text-cyan-500 transition"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ホームに戻る */}
        <div className="text-center mt-8">
          <a href="/" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </a>
        </div>
      </div>

      {/* アニメ詳細ポップアップ */}
      {selectedAnime && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnime(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー画像 */}
            <div className="relative h-56">
              <img
                src={selectedAnime.images.jpg.large_image_url || selectedAnime.images.jpg.image_url}
                alt={selectedAnime.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <button
                onClick={() => setSelectedAnime(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white">{selectedAnime.title}</h2>
                {(selectedAnime.title_english || selectedAnime.title_japanese) && (
                  <p className="text-white/80 text-sm mt-1">
                    {selectedAnime.title_english || selectedAnime.title_japanese}
                  </p>
                )}
              </div>
            </div>

            {/* コンテンツ */}
            <div className="p-6 overflow-y-auto max-h-[40vh]">
              <div className="flex flex-wrap items-center gap-4">
                {selectedAnime.score && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xl font-bold text-yellow-700">{selectedAnime.score}</span>
                  </div>
                )}
                {selectedAnime.broadcast?.string && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedAnime.broadcast.string}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {selectedAnime.genres.map((genre) => (
                  <span
                    key={genre.name}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{
                      backgroundColor: `${getGenreColor(selectedAnime)}20`,
                      color: getGenreColor(selectedAnime),
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {selectedAnime.synopsis && (
                <div className="mt-4">
                  <h3 className="font-bold text-gray-800 mb-2">あらすじ</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedAnime.synopsis}</p>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="p-4 border-t bg-gray-50">
              <a
                href={`https://myanimelist.net/anime/${selectedAnime.mal_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-teal-600 transition"
              >
                <span>MyAnimeListで見る</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
