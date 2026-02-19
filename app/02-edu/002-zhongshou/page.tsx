'use client';

import { useState, useEffect, useCallback } from 'react';

// 学校类型
interface School {
  id: number;
  school_id: string;
  name: string;
  deviation: number;
  sex: string;
  exam_dates: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ZhongshouPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // 筛选条件
  const [filters, setFilters] = useState({
    minDeviation: '',
    maxDeviation: '',
    sex: 'all',
    examDate: '',
    search: '',
  });

  // 统计信息
  const [stats, setStats] = useState<{
    total: number;
    avgDeviation: number;
    maleSchools: number;
    femaleSchools: number;
  } | null>(null);

  // 四谷大塚 HTML 相关状态
  const [yotsuyaHtml, setYotsuyaHtml] = useState<string>('');
  const [fetchingYotsuya, setFetchingYotsuya] = useState(false);
  const [yotsuyaUrl, setYotsuyaUrl] = useState<string>('https://www.yotsuyaotsuka.com/njc/deviation_top.php');
  const [displayMode, setDisplayMode] = useState<'text' | 'iframe'>('text');

  // 获取学校列表
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.minDeviation) params.append('minDeviation', filters.minDeviation);
      if (filters.maxDeviation) params.append('maxDeviation', filters.maxDeviation);
      if (filters.sex !== 'all') params.append('sex', filters.sex);
      if (filters.examDate) params.append('examDate', filters.examDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/02-edu/002-zhongshou/school-list?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchools(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('获取学校列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 获取统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/02-edu/002-zhongshou/school-list?limit=9999');
        const data = await response.json();
        if (data.success) {
          const schools = data.data;
          const male = schools.filter((s: School) => s.sex === '男子').length;
          const female = schools.filter((s: School) => s.sex === '女子').length;
          const avgDev = schools.length > 0
            ? Math.round(schools.reduce((sum: number, s: School) => sum + s.deviation, 0) / schools.length)
            : 0;

          setStats({
            total: data.pagination.total,
            avgDeviation: avgDev,
            maleSchools: male,
            femaleSchools: female,
          });
        }
      } catch (error) {
        console.error('获取统计信息失败:', error);
      }
    };
    fetchStats();
  }, []);

  // 获取四谷大塚页面HTML
  const fetchYotsuyaHtml = async () => {
    const url = yotsuyaUrl || 'https://www.yotsuyaotsuka.com/njc/deviation_top.php';

    try {
      setYotsuyaHtml('loading');
      setFetchingYotsuya(true);
      setDisplayMode('iframe');

      const response = await fetch(`/api/02-edu/002-zhongshou/school?url=${encodeURIComponent(url)}&raw=true`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      setYotsuyaHtml(html);

    } catch (error) {
      console.error('获取四谷大塚HTML失败:', error);
      setYotsuyaHtml('<!DOCTYPE html><html><body><h1>Error</h1><p>' + String(error) + '</p></body></html>');
      setDisplayMode('text');
    } finally {
      setFetchingYotsuya(false);
    }
  };

  // 筛选条件变更
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      minDeviation: '',
      maxDeviation: '',
      sex: 'all',
      examDate: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 偏差值颜色
  const getDeviationColor = (dev: number) => {
    if (dev >= 75) return 'bg-purple-100 text-purple-700';
    if (dev >= 70) return 'bg-red-100 text-red-700';
    if (dev >= 65) return 'bg-orange-100 text-orange-700';
    if (dev >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  // 性别徽章
  const getSexBadge = (sex: string) => {
    switch (sex) {
      case '男子': return 'bg-blue-100 text-blue-700';
      case '女子': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">🇯🇵 中学受験 偏差値排行榜</h1>
          <p className="mt-1 opacity-90">四谷大塚データ</p>
        </div>
      </header>

      {/* 统计信息 */}
      {stats && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">全校数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.avgDeviation}</div>
                <div className="text-xs text-gray-500">平均偏差値</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.maleSchools}</div>
                <div className="text-xs text-gray-500">男子校</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{stats.femaleSchools}</div>
                <div className="text-xs text-gray-500">女子校</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 筛选条件</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 学校名称搜索 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">学校名称</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="搜索学校..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* 偏差值范围 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">偏差値范围</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.minDeviation}
                  onChange={(e) => handleFilterChange('minDeviation', e.target.value)}
                  placeholder="最小"
                  className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-400 self-center">~</span>
                <input
                  type="number"
                  value={filters.maxDeviation}
                  onChange={(e) => handleFilterChange('maxDeviation', e.target.value)}
                  placeholder="最大"
                  className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* 性别筛选 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">学校类型</label>
              <select
                value={filters.sex}
                onChange={(e) => handleFilterChange('sex', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="男子">男子校</option>
                <option value="女子">女子校</option>
                <option value="共通">共学校</option>
              </select>
            </div>

            {/* 考试日期 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">考试日期</label>
              <input
                type="text"
                value={filters.examDate}
                onChange={(e) => handleFilterChange('examDate', e.target.value)}
                placeholder="如: 2/1, 2/2..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* 重置按钮 */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm transition-colors"
              >
                重置筛选
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 学校列表 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            📋 学校列表
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({pagination.total} 所学校)
            </span>
          </h2>

          {/* 分页 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">没有找到符合条件的学校</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">偏差値</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">学校名</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">考试日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-sm font-bold rounded ${getDeviationColor(school.deviation)}`}>
                        {school.deviation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{school.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getSexBadge(school.sex)}`}>
                        {school.sex}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {school.exam_dates ? school.exam_dates.split(' | ').map((date: string, i: number) => (
                        <span key={i} className="inline-block mr-2">
                          {date.trim()}
                        </span>
                      )) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-70">データソース: 四谷大塚</p>
          <p className="text-xs opacity-50 mt-2">© 2025 中学受験ガイド</p>
        </div>
      </footer>
    </div>
  );
}
