'use client';

import { useState, useEffect } from 'react';

interface Exam {
  id: number;
  school_code: string;
  school_name: string;
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/02-edu/002-zhongshou/exams');
      const result = await response.json();

      if (result.success && result.data) {
        setExams(result.data);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    }
    setLoading(false);
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">学校名</th>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">試験名</th>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">試験日</th>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">時間</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, index) => (
                    <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-800 font-medium">{exam.school_name}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{exam.exam_name}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{exam.exam_date}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{exam.start_time}</td>
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
