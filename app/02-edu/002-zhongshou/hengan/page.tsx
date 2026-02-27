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

interface DeviationGroup {
  deviation: number;
  schools: { name: string; exams: { exam_name: string; exam_date: string; start_time: string }[] }[];
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolCount, setSchoolCount] = useState(0);
  const [deviationGroups, setDeviationGroups] = useState<DeviationGroup[]>([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/02-edu/002-zhongshou/exams?limit=10000');
      const result = await response.json();

      if (result.success && result.data) {
        setExams(result.data);

        // 按偏差值分组
        const deviationMap = new Map<number, Map<string, { exam_name: string; exam_date: string; start_time: string }[]>>();

        result.data.forEach((e: Exam) => {
          const deviation = e.deviation || 0;
          if (!deviationMap.has(deviation)) {
            deviationMap.set(deviation, new Map());
          }
          const schoolMap = deviationMap.get(deviation)!;
          if (!schoolMap.has(e.school_name)) {
            schoolMap.set(e.school_name, []);
          }
          schoolMap.get(e.school_name)!.push({
            exam_name: e.exam_name,
            exam_date: e.exam_date,
            start_time: e.start_time
          });
        });

        // 转换为数组并按偏差值排序
        const groups: DeviationGroup[] = [];
        const sortedDeviations = Array.from(deviationMap.keys()).sort((a, b) => b - a);

        sortedDeviations.forEach(deviation => {
          const schoolMap = deviationMap.get(deviation)!;
          const schools = Array.from(schoolMap.entries()).map(([name, exams]) => ({
            name,
            exams
          }));
          groups.push({ deviation, schools });
        });

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
        {!loading && (
          <p className="mb-4 text-lg font-semibold text-gray-700">偏差値グループ数: {deviationGroups.length} グループ</p>
        )}
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
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">学校名・試験日</th>
                  </tr>
                </thead>
                <tbody>
                  {deviationGroups.map((group, groupIndex) => (
                    <tr key={groupIndex} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-sm align-top">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getDeviationClass(group.deviation)}`}>
                          {group.deviation || '-'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{group.schools.length}校</p>
                      </td>
                      <td className="py-3 px-3">
                        {group.schools.map((school, schoolIndex) => (
                          <div key={schoolIndex} className="mb-2 pb-2 border-b border-gray-100 last:border-b-0">
                            <div className="text-sm font-medium text-gray-800">{school.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {school.exams.map((exam, examIndex) => (
                                <span key={examIndex} className="mr-2">
                                  {exam.exam_date} {exam.start_time}
                                  {examIndex < school.exams.length - 1 ? '、' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </td>
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
