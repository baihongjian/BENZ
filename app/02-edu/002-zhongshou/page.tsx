'use client';

import { useState, useEffect, useCallback } from 'react';

// 学校类型
interface School {
  id: number;
  school_code: string;
  name: string;
  deviation: number;
  sex_type: string;
  prefecture: string;
  category: string;
  website: string;
  region: string;
  // 学费信息
  first_year_total: string;
  annual_fee: string;
  // 进学实绩
  university_todai_keidai: number;
  university_ichihashi_tokyo_5: number;
  university_national_public: number;
  university_waseda_keio_socie: number;
  university_gmarch: number;
  university_medical: number;
  exams: Exam[];
}

interface Exam {
  id: number;
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 学校详情类型
interface SchoolDetail {
  school: School;
  exams: Exam[];
}

export default function ZhongshouPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // 学校详情弹窗状态
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 筛选条件
  const [filters, setFilters] = useState({
    minDeviation: '',
    maxDeviation: '',
    sex: 'all',
    region: 'all',
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
      if (filters.region !== 'all') params.append('region', filters.region);
      if (filters.examDate) params.append('examDate', filters.examDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?${params}`);
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
        const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?limit=9999`);
        const data = await response.json();
        if (data.success) {
          const schools = data.data;
          const male = schools.filter((s: School) => s.sex_type === '男子').length;
          const female = schools.filter((s: School) => s.sex_type === '女子').length;
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

  // 筛选条件变更
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      minDeviation: '',
      maxDeviation: '',
      sex: 'all',
      region: 'all',
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

  // 地区徽章
  const getRegionBadge = (region: string) => {
    switch (region) {
      case '関東': return 'bg-blue-100 text-blue-700';
      case '関西': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 获取学校详情
  const fetchSchoolDetail = async (schoolId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1/${schoolId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedSchool(data.data);
      }
    } catch (error) {
      console.error('获取学校详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 关闭详情弹窗
  const closeDetail = () => {
    setSelectedSchool(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">中学受験 偏差値排行榜</h1>
          <p className="mt-1 opacity-90">スタディ データ</p>
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">筛选条件</h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

            {/* 地区筛选 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">地区</label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="関東">関東</option>
                <option value="関西">関西</option>
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
            学校列表
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">地区</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">考试信息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr
                    key={school.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => fetchSchoolDetail(school.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-sm font-bold rounded ${getDeviationColor(school.deviation)}`}>
                        {school.deviation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{school.name}</div>
                      <div className="text-xs text-gray-500">{school.prefecture}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getSexBadge(school.sex_type)}`}>
                        {school.sex_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRegionBadge(school.region)}`}>
                        {school.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {school.exams && school.exams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {school.exams.slice(0, 3).map((exam, i) => (
                            <span key={i} className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                              {exam.exam_date}
                            </span>
                          ))}
                          {school.exams.length > 3 && (
                            <span className="text-xs text-gray-500">+{school.exams.length - 3}</span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 学校详情弹窗 */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDetail}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">{selectedSchool.school.name}</h3>
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
              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-500">加载中...</p>
                </div>
              ) : (
                <>
                  {/* 学校信息 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">学校信息</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">偏差値</div>
                        <div className={`text-2xl font-bold ${selectedSchool.school.deviation >= 70 ? 'text-red-600' : selectedSchool.school.deviation >= 60 ? 'text-orange-600' : 'text-green-600'}`}>
                          {selectedSchool.school.deviation}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">学校类型</div>
                        <div className="text-lg font-bold text-gray-800">{selectedSchool.school.category}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">性别类型</div>
                        <div className="text-lg font-bold text-gray-800">{selectedSchool.school.sex_type}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">区域</div>
                        <div className="text-lg font-bold text-gray-800">{selectedSchool.school.region}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">地区</div>
                        <div className="text-lg font-bold text-gray-800">{selectedSchool.school.prefecture}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">学校代码</div>
                        <div className="text-lg font-bold text-gray-800">{selectedSchool.school.school_code}</div>
                      </div>
                      {selectedSchool.school.website && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">官网</div>
                          <a href={selectedSchool.school.website} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-blue-600 hover:underline">
                            访问官网
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 学费信息 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">学费信息</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">初年度納入金合計</div>
                        <div className="text-xl font-bold text-green-700">
                          {selectedSchool.school.first_year_total || '-'}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">年間学費</div>
                        <div className="text-xl font-bold text-green-700">
                          {selectedSchool.school.annual_fee || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 进学实绩 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">大学合格実績</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">東大・京大</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_todai_keidai || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">一橋・東京科学・旧５帝大</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_ichihashi_tokyo_5 || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">国公立大学</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_national_public || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">早稲田・慶應・上智</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_waseda_keio_socie || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">GMARCH</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_gmarch || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">医学部</div>
                        <div className="text-xl font-bold text-purple-700">{selectedSchool.school.university_medical || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* 考试信息 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">考试日期</h4>
                    <div className="space-y-2">
                      {selectedSchool.exams.length > 0 ? (
                        selectedSchool.exams.map((exam, index) => (
                          <div key={exam.id || index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800">{exam.exam_name}</div>
                              <div className="text-sm text-gray-600">
                                {exam.exam_date} {exam.start_time}
                              </div>
                              {exam.source_url && (
                                <a href={exam.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  入試要项
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          暂无考试信息
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t flex justify-end">
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
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-70">データソース: スタディ</p>
          <p className="text-xs opacity-50 mt-2">© 2025 中学受験ガイド</p>
        </div>
      </footer>
    </div>
  );
}
