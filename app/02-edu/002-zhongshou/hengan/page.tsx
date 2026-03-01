'use client';

import { useState, useEffect } from 'react';

interface Exam {
  id: number;
  school_code: string;
  school_name: string;
  deviation: number;
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

interface SchoolDetail {
  school_code: string;
  name: string;
  deviation: number;
  prefecture: string;
  category: string;
  sex_type: string;
  website: string;
  first_year_total: number;
  annual_fee: number;
  university_todai_keidai: number;
  university_ichihashi_tokyo_5: number;
  university_national_public: number;
  university_waseda_keio_socie: number;
  university_gmarch: number;
  university_medical: number;
  source_url: string;
}

interface SchoolExamInfo {
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

// 考试日期列定义
const EXAM_COLUMNS = [
  { key: '1月', label: '１月中' },
  { key: '2月1日-午前', label: '２月１日<br/>午前' },
  { key: '2月1日-午後', label: '２月１日<br/>午後' },
  { key: '2月2日-午前', label: '２月２日<br/>午前' },
  { key: '2月2日-午後', label: '２月２日<br/>午後' },
  { key: '2月3日-午前', label: '２月３日<br/>午前' },
  { key: '2月3日-午後', label: '２月３日<br/>午後' },
  { key: '2月4日以降', label: '２月４日<br/>以降' },
];

// 隐藏学校名中的"中学校"或"中学部"
function hideSchoolSuffix(name: string): string {
  return name.replace(/中学校|中学部|中等部|中等|中等教育学校$/, '');
}

// 获取考试日期对应的列键
function getExamColumnKey(examDate: string, startTime: string): string | null {
  if (!examDate) return null;

  // 只匹配月/日格式（如 2026/2/3 中的 2/3）
  const match = examDate.match(/\/(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);

  if (month === 1) return '1月';
  if (month === 2 && day === 1) {
    return startTime?.includes('午後') ? '2月1日-午後' : '2月1日-午前';
  }
  if (month === 2 && day === 2) {
    return startTime?.includes('午後') ? '2月2日-午後' : '2月2日-午前';
  }
  if (month === 2 && day === 3) {
    return startTime?.includes('午後') ? '2月3日-午後' : '2月3日-午前';
  }
  if ((month === 2 && day >= 4) || month >= 3) {
    return '2月4日以降';
  }
  return null;
}

interface SchoolExam {
  name: string;
  schoolCode: string;
  examDateKey: string;
}

interface DeviationGroup {
  deviation: number;
  schools: SchoolExam[][];
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolCount, setSchoolCount] = useState(0);
  const [deviationGroups, setDeviationGroups] = useState<DeviationGroup[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSexTypes, setSelectedSexTypes] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [userDeviation, setUserDeviation] = useState('');
  const [availableDeviations, setAvailableDeviations] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<'fee-asc' | 'university-desc'>('fee-asc');
  const [schoolDetailsMap, setSchoolDetailsMap] = useState<Map<string, SchoolDetail>>(new Map());

  // 学校详情弹窗状态
  const [selectedSchool, setSelectedSchool] = useState<SchoolExam | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null);
  const [schoolExams, setSchoolExams] = useState<SchoolExamInfo[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchExams(selectedCategories, selectedSexTypes, selectedPrefectures, searchKeyword);
  }, [selectedCategories, selectedSexTypes, selectedPrefectures, searchKeyword]);

  // 当排序选项改变或数据加载时，获取学校详情并排序
  useEffect(() => {
    const applySorting = async () => {
      // 收集所有学校代码
      const allSchoolCodes = new Set<string>();
      deviationGroups.forEach(group => {
        group.schools.forEach(col => {
          col.forEach(school => {
            if (school.schoolCode) {
              allSchoolCodes.add(school.schoolCode);
            }
          });
        });
      });

      if (allSchoolCodes.size === 0) return;

      try {
        const response = await fetch(`/api/02-edu/002-zhongshou/schools-batch?school_codes=${Array.from(allSchoolCodes).join(',')}`);
        const result = await response.json();

        if (result.success && result.data) {
          // 构建学校详情映射
          const detailsMap = new Map<string, SchoolDetail>();
          result.data.forEach((school: SchoolDetail) => {
            detailsMap.set(school.school_code, school);
          });
          setSchoolDetailsMap(detailsMap);

          // 计算大学进学总数
          const calcUniversityTotal = (school: SchoolDetail) => {
            return (school.university_todai_keidai || 0) +
                   (school.university_ichihashi_tokyo_5 || 0) +
                   (school.university_national_public || 0) +
                   (school.university_waseda_keio_socie || 0) +
                   (school.university_gmarch || 0) +
                   (school.university_medical || 0);
          };

          // 排序
          setDeviationGroups(prevGroups => {
            return prevGroups.map(group => ({
              ...group,
              schools: group.schools.map(col => {
                return [...col].sort((a, b) => {
                  const detailA = detailsMap.get(a.schoolCode);
                  const detailB = detailsMap.get(b.schoolCode);

                  if (!detailA || !detailB) return 0;

                  if (sortOption === 'fee-asc') {
                    // 学费从低到高
                    const feeA = detailA.first_year_total || 0;
                    const feeB = detailB.first_year_total || 0;
                    return feeA - feeB;
                  } else if (sortOption === 'university-desc') {
                    // 进学人数从高到低
                    const uniA = calcUniversityTotal(detailA);
                    const uniB = calcUniversityTotal(detailB);
                    return uniB - uniA;
                  }
                  return 0;
                });
              })
            }));
          });
        }
      } catch (err) {
        console.error('获取学校详情失败:', err);
      }
    };

    applySorting();
  }, [sortOption, deviationGroups.length]);

  const fetchExams = async (categories: string[] = [], sexTypes: string[] = [], prefectures: string[] = [], keyword: string = '') => {
    setLoading(true);
    try {
      let categoryParam = '';
      if (categories.length > 0) {
        categoryParam = '&category=' + categories.join(',');
      }
      let sexTypeParam = '';
      if (sexTypes.length > 0) {
        sexTypeParam = '&sexType=' + sexTypes.join(',');
      }
      let prefectureParam = '';
      if (prefectures.length > 0) {
        prefectureParam = '&prefecture=' + prefectures.join(',');
      }
      let keywordParam = '';
      if (keyword.trim()) {
        keywordParam = '&keyword=' + encodeURIComponent(keyword.trim());
      }
      const response = await fetch(`/api/02-edu/002-zhongshou/exams?limit=10000${categoryParam}${sexTypeParam}${prefectureParam}${keywordParam}`);
      const result = await response.json();

      if (result.success && result.data) {
        setExams(result.data);

        // 调试：检查前几个数据的解析结果
        console.log('前5条数据:');
        result.data.slice(0, 5).forEach((e: Exam) => {
          const key = getExamColumnKey(e.exam_date, e.start_time);
          console.log(`  ${e.school_name}: ${e.exam_date} ${e.start_time} -> ${key}`);
        });

        // 按偏差值和考试日期分组
        const deviationMap = new Map<number, Map<string, { name: string; code: string }[]>>();

        result.data.forEach((e: Exam) => {
          const deviation = e.deviation || 0;
          const examDateKey = getExamColumnKey(e.exam_date, e.start_time);

          if (!deviationMap.has(deviation)) {
            deviationMap.set(deviation, new Map());
          }
          const dateMap = deviationMap.get(deviation)!;

          if (!dateMap.has(examDateKey)) {
            dateMap.set(examDateKey, []);
          }
          // 避免重复添加
          const existing = dateMap.get(examDateKey)!;
          if (!existing.some(s => s.code === e.school_code)) {
            existing.push({ name: e.school_name, code: e.school_code });
          }
        });

        // 转换为数组并按偏差值排序
        const groups: DeviationGroup[] = [];
        const sortedDeviations = Array.from(deviationMap.keys()).sort((a, b) => b - a);

        sortedDeviations.forEach(deviation => {
          const dateMap = deviationMap.get(deviation)!;
          const schoolsByDate: SchoolExam[][] = EXAM_COLUMNS.map(() => []);

          dateMap.forEach((schoolSet, examDateKey) => {
            const colIndex = EXAM_COLUMNS.findIndex(c => c.key === examDateKey);
            if (colIndex >= 0) {
              schoolSet.forEach(({ name, code }) => {
                schoolsByDate[colIndex].push({ name, schoolCode: code, examDateKey });
              });
            }
          });

          groups.push({ deviation, schools: schoolsByDate });
        });

        console.log('分组结果:', groups.slice(0, 3));

        setDeviationGroups(groups);
        setAvailableDeviations(sortedDeviations);
        // 计算去重后的学校数量
        const uniqueSchools = new Set(result.data.map((e: Exam) => e.school_name));
        setSchoolCount(uniqueSchools.size);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    }
    setLoading(false);
  };

  // 获取学校详情
  const fetchSchoolDetail = async (schoolCode: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/school-detail?school_code=${schoolCode}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSchoolDetail(result.data.school);
        setSchoolExams(result.data.exams || []);
      }
    } catch (err) {
      console.error('获取学校详情失败:', err);
    }
    setDetailLoading(false);
  };

  // 点击学校名
  const handleSchoolClick = async (school: SchoolExam) => {
    setSelectedSchool(school);
    await fetchSchoolDetail(school.schoolCode);
  };

  // 关闭详情弹窗
  const closeDetail = () => {
    setSelectedSchool(null);
    setSchoolDetail(null);
    setSchoolExams([]);
  };

  // 获取偏差值的样式
  const getDeviationClass = (deviation: number) => {
    if (!deviation) return 'bg-gray-100 text-gray-700';
    if (deviation >= 70) return 'bg-red-100 text-red-700';
    if (deviation >= 65) return 'bg-orange-100 text-orange-700';
    if (deviation >= 60) return 'bg-yellow-100 text-yellow-700';
    if (deviation >= 55) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">中学受验--併願</h1>
        </div>
      </header>

      {/* 考试列表 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 关键字搜索 */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">学校名で探す:</label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="学校名を入力"
            className="px-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              クリア
            </button>
          )}
          <span className="ml-4 text-sm font-medium text-gray-700">学校並び替え:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'fee-asc' | 'university-desc')}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="fee-asc">学費安い順</option>
            <option value="university-desc">進学数が多い順</option>
          </select>
        </div>

        {/* 自身の偏差値 */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">自身の偏差値:</label>
          <select
            value={userDeviation}
            onChange={(e) => setUserDeviation(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm w-40 focus:outline-none focus:border-blue-500"
          >
            <option value="">選択してください</option>
            {availableDeviations.map(dev => (
              <option key={dev} value={dev}>{dev}</option>
            ))}
          </select>
          {userDeviation && (
            <button
              onClick={() => setUserDeviation('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              クリア
            </button>
          )}
        </div>

        {/* 筛选条件 */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">学校設置:</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes('私立')}
                onChange={(e) => {
                  let newCategories = selectedCategories.filter(c => c !== 'すべて');
                  if (e.target.checked) {
                    newCategories.push('私立');
                  } else {
                    newCategories = newCategories.filter(c => c !== '私立');
                  }
                  setSelectedCategories(newCategories);
                }}
                className="rounded"
              />
              私立
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes('国立')}
                onChange={(e) => {
                  let newCategories = selectedCategories.filter(c => c !== 'すべて');
                  if (e.target.checked) {
                    newCategories.push('国立');
                  } else {
                    newCategories = newCategories.filter(c => c !== '国立');
                  }
                  setSelectedCategories(newCategories);
                }}
                className="rounded"
              />
              国立
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes('公立中高一貫')}
                onChange={(e) => {
                  let newCategories = selectedCategories.filter(c => c !== 'すべて');
                  if (e.target.checked) {
                    newCategories.push('公立中高一貫');
                  } else {
                    newCategories = newCategories.filter(c => c !== '公立中高一貫');
                  }
                  setSelectedCategories(newCategories);
                }}
                className="rounded"
              />
              公立中高一貫
            </label>
          </div>
        </div>

        {/* 学校種別筛选条件 */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">学校種別:</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedSexTypes.includes('男子')}
                onChange={(e) => {
                  let newSexTypes = selectedSexTypes;
                  if (e.target.checked) {
                    newSexTypes.push('男子');
                  } else {
                    newSexTypes = newSexTypes.filter(c => c !== '男子');
                  }
                  setSelectedSexTypes([...newSexTypes]);
                }}
                className="rounded"
              />
              男子校
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedSexTypes.includes('女子')}
                onChange={(e) => {
                  let newSexTypes = selectedSexTypes;
                  if (e.target.checked) {
                    newSexTypes.push('女子');
                  } else {
                    newSexTypes = newSexTypes.filter(c => c !== '女子');
                  }
                  setSelectedSexTypes([...newSexTypes]);
                }}
                className="rounded"
              />
              女子校
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedSexTypes.includes('共通')}
                onChange={(e) => {
                  let newSexTypes = selectedSexTypes;
                  if (e.target.checked) {
                    newSexTypes.push('共通');
                  } else {
                    newSexTypes = newSexTypes.filter(c => c !== '共通');
                  }
                  setSelectedSexTypes([...newSexTypes]);
                }}
                className="rounded"
              />
              共学
            </label>
          </div>
        </div>

        {/* 都道府県筛选条件 */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">都道府県:</label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('東京23区')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('東京23区');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '東京23区');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              東京23区
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('東京23区外')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('東京23区外');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '東京23区外');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              東京23区以外
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('神奈川県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('神奈川県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '神奈川県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              神奈川県
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('埼玉県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('埼玉県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '埼玉県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              埼玉県
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('千葉県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('千葉県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '千葉県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              千葉県
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('茨城県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('茨城県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '茨城県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              茨城県
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('栃木県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('栃木県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '栃木県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              栃木県
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedPrefectures.includes('群馬県')}
                onChange={(e) => {
                  let newPrefectures = selectedPrefectures;
                  if (e.target.checked) {
                    newPrefectures.push('群馬県');
                  } else {
                    newPrefectures = newPrefectures.filter(c => c !== '群馬県');
                  }
                  setSelectedPrefectures([...newPrefectures]);
                }}
                className="rounded"
              />
              群馬県
            </label>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse table-fixed">
                <thead className="bg-gray-100 border-b-2 border-gray-400">
                  <tr>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-800 w-16 border-r border-gray-300">偏差値</th>
                    {EXAM_COLUMNS.map(col => (
                      <th key={col.key} className="text-center py-3 px-2 text-sm font-bold text-gray-800 border-r border-gray-300 w-[110px]" dangerouslySetInnerHTML={{ __html: col.label }}></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviationGroups.map((group, groupIndex) => (
                    <tr key={groupIndex} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="py-3 px-2 text-sm text-center align-middle border-r border-gray-300 bg-gray-50">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getDeviationClass(group.deviation)}`}>
                          {group.deviation || '-'}
                        </span>
                      </td>
                      {group.schools.map((schoolsInColumn, colIndex) => (
                        <td key={colIndex} className="py-3 px-2 text-sm align-top border-r border-gray-200 align-top">
                          {schoolsInColumn.length > 0 ? (
                            <div className="text-xs space-y-1">
                              {schoolsInColumn.map((school, idx) => (
                                <div key={idx} className="overflow-hidden">
                                  <button
                                    onClick={() => handleSchoolClick(school)}
                                    className="text-gray-700 block w-full truncate text-left hover:text-blue-600 hover:underline hover:text-base hover:font-medium"
                                    title={hideSchoolSuffix(school.name)}
                                  >
                                    <span className="text-[8px] mr-1">●</span>{hideSchoolSuffix(school.name)}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">合計: {schoolCount} 校</p>
      </div>

      {/* 学校详情弹窗 */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDetail}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold truncate flex-1 mr-4">{hideSchoolSuffix(selectedSchool.name)}</h3>
              <button onClick={closeDetail} className="text-white hover:text-gray-200">
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
                  <p className="mt-2 text-gray-500">読み込み中...</p>
                </div>
              ) : schoolDetail ? (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-2">基本情報</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">偏差値:</span> <span className="font-bold">{schoolDetail.deviation || '-'}</span></div>
                      <div><span className="text-gray-600">設置:</span> {schoolDetail.category || '-'}</div>
                      <div><span className="text-gray-600">種別:</span> {schoolDetail.sex_type || '-'}</div>
                      <div><span className="text-gray-600">所在地:</span> {schoolDetail.prefecture || '-'}</div>
                    </div>
                  </div>

                  {/* 学费信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-2">入学金・学費</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">初年度合計:</span> {schoolDetail.first_year_total ? `${schoolDetail.first_year_total.toLocaleString()}円` : '-'}</div>
                      <div><span className="text-gray-600">年間学金:</span> {schoolDetail.annual_fee ? `${schoolDetail.annual_fee.toLocaleString()}円` : '-'}</div>
                    </div>
                  </div>

                  {/* 升学情况 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-2">進学実績</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">東大一慶応:</span> {schoolDetail.university_todai_keidai || 0}人</div>
                      <div><span className="text-gray-600">一橋・東京5:</span> {schoolDetail.university_ichihashi_tokyo_5 || 0}人</div>
                      <div><span className="text-gray-600">国立公立:</span> {schoolDetail.university_national_public || 0}人</div>
                      <div><span className="text-gray-600">早慶上智:</span> {schoolDetail.university_waseda_keio_socie || 0}人</div>
                      <div><span className="text-gray-600">GMARCH:</span> {schoolDetail.university_gmarch || 0}人</div>
                      <div><span className="text-gray-600">医歯薬:</span> {schoolDetail.university_medical || 0}人</div>
                    </div>
                  </div>

                  {/* 考试信息 */}
                  {schoolExams.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-2">試験日程</h4>
                      <div className="space-y-2 text-sm">
                        {schoolExams.map((exam, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0">
                            <div>
                              <div className="font-medium">{exam.exam_name}</div>
                              <div className="text-gray-500 text-xs">{exam.exam_date} {exam.start_time}</div>
                            </div>
                            {exam.source_url && (
                              <a href={exam.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                詳細
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 官网链接 */}
                  {schoolDetail.website && (
                    <div className="text-center">
                      <a href={schoolDetail.website} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                        公式サイト
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">データがありません</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
