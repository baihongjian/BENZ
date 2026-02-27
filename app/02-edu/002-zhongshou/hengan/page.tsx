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

  useEffect(() => {
    fetchExams(selectedCategories);
  }, [selectedCategories]);

  const fetchExams = async (categories: string[] = []) => {
    setLoading(true);
    try {
      let categoryParam = '';
      if (categories.length > 0) {
        categoryParam = '&category=' + categories.join(',');
      }
      const response = await fetch(`/api/02-edu/002-zhongshou/exams?limit=10000${categoryParam}`);
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
        setSchoolCount(result.data.length);
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
          <h1 className="text-2xl font-bold">試験日程一覧</h1>
          <p className="mt-1 opacity-90">私立中学校の試験日程を表示</p>
        </div>
      </header>

      {/* 考试列表 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div>
            {!loading && (
            <span className="text-sm text-gray-600">偏差値グループ数: {deviationGroups.length} グループ</span>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700 w-20">偏差値</th>
                    {EXAM_COLUMNS.map(col => (
                      <th key={col.key} className="text-left py-3 px-2 text-sm font-semibold text-gray-700">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviationGroups.map((group, groupIndex) => (
                    <tr key={groupIndex} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-sm align-top">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getDeviationClass(group.deviation)}`}>
                          {group.deviation || '-'}
                        </span>
                      </td>
                      {group.schools.map((schoolsInColumn, colIndex) => (
                        <td key={colIndex} className="py-3 px-2 text-sm align-top">
                          {schoolsInColumn.length > 0 ? (
                            <div className="text-xs">
                              {schoolsInColumn.map((school, idx) => (
                                <div key={idx} className="text-gray-700">{hideSchoolSuffix(school.name)}</div>
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

        <p className="mt-4 text-sm text-gray-500">合計: {exams.length} 件</p>
      </div>
    </div>
  );
}
