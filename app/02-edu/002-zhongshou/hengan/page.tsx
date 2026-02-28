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

// 考试日期列定义
const EXAM_COLUMNS = [
  { key: '1月', label: '１月中' },
  { key: '2月1日-午前', label: '２月１日午前' },
  { key: '2月1日-午後', label: '２月１日午後' },
  { key: '2月2日-午前', label: '２月２日午前' },
  { key: '2月2日-午後', label: '２月２日午後' },
  { key: '2月3日-午前', label: '２月３日午前' },
  { key: '2月3日-午後', label: '２月３日午後' },
  { key: '2月4日以降', label: '２月４日以降' },
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

  useEffect(() => {
    fetchExams(selectedCategories, selectedSexTypes, selectedPrefectures);
  }, [selectedCategories, selectedSexTypes, selectedPrefectures]);

  const fetchExams = async (categories: string[] = [], sexTypes: string[] = [], prefectures: string[] = []) => {
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
      const response = await fetch(`/api/02-edu/002-zhongshou/exams?limit=10000${categoryParam}${sexTypeParam}${prefectureParam}`);
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
        const deviationMap = new Map<number, Map<string, Set<string>>>();

        result.data.forEach((e: Exam) => {
          const deviation = e.deviation || 0;
          const examDateKey = getExamColumnKey(e.exam_date, e.start_time);

          if (!deviationMap.has(deviation)) {
            deviationMap.set(deviation, new Map());
          }
          const dateMap = deviationMap.get(deviation)!;

          if (!dateMap.has(examDateKey)) {
            dateMap.set(examDateKey, new Set());
          }
          dateMap.get(examDateKey)!.add(e.school_name);
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
              schoolSet.forEach(schoolName => {
                schoolsByDate[colIndex].push({ name: schoolName, examDateKey });
              });
            }
          });

          groups.push({ deviation, schools: schoolsByDate });
        });

        console.log('分组结果:', groups.slice(0, 3));

        setDeviationGroups(groups);
        // 计算去重后的学校数量
        const uniqueSchools = new Set(result.data.map((e: Exam) => e.school_name));
        setSchoolCount(uniqueSchools.size);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    }
    setLoading(false);
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
                    <th className="text-left py-3 px-2 text-sm font-bold text-gray-800 w-16 border-r border-gray-300">偏差値</th>
                    {EXAM_COLUMNS.map(col => (
                      <th key={col.key} className="text-left py-3 px-2 text-sm font-bold text-gray-800 border-r border-gray-300 w-[110px]">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviationGroups.map((group, groupIndex) => (
                    <tr key={groupIndex} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="py-3 px-2 text-sm align-top border-r border-gray-300 bg-gray-50">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getDeviationClass(group.deviation)}`}>
                          {group.deviation || '-'}
                        </span>
                      </td>
                      {group.schools.map((schoolsInColumn, colIndex) => (
                        <td key={colIndex} className="py-3 px-2 text-sm align-top border-r border-gray-200 align-top">
                          {schoolsInColumn.length > 0 ? (
                            <div className="text-xs">
                              {schoolsInColumn.map((school, idx) => (
                                <div key={idx} className="text-gray-700 truncate" title={hideSchoolSuffix(school.name)}>{hideSchoolSuffix(school.name)}</div>
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
    </div>
  );
}
