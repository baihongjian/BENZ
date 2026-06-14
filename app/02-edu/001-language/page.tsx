"use client";

import Link from "next/link";

export default function GermanLearning() {
  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-amber-50">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">🇩🇪 德语学习</h1>
        </header>
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          
          <Link
            href="/02-edu/001-language/select_question_2"
            className="px-6 py-3 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition font-medium"
          >
            5️⃣ 🔤 新 选择题 →
          </Link>
          <Link
            href="/02-edu/001-language/spelling_test_2"
            className="px-6 py-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition font-medium"
          >
            6️⃣ ✍️ 新拼写 →
          </Link>
          <Link
            href="/02-edu/001-language/dialog-ai"
            className="px-6 py-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition font-medium"
          >
            7️⃣ 💬 AI 对话 →
          </Link>
          <Link
            href="/02-edu/001-language/dergame1"
            className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition font-medium"
          >
            8️⃣ 🧬 词性游戏 →
          </Link>
        </div>
      </div>
    </main>
  );
}
