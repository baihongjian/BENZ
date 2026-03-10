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
            href="/02-edu/001-language/select_question"
            className="px-6 py-3 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition font-medium"
          >
            1️⃣ ❓ 选择题 →
          </Link>
          <Link
            href="/02-edu/001-language/listenning"
            className="px-6 py-3 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition font-medium"
          >
            2️⃣ 📞 听力题 →
          </Link>
          <Link
            href="/02-edu/001-language/spelling-test"
            className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition font-medium"
          >
            3️⃣ 拼写题 →
          </Link>
          <Link
            href="/02-edu/001-language/SentencePractice"
            className="px-6 py-3 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition font-medium"
          >
            4️⃣ 📝 简单句子 →
          </Link>
        </div>
      </div>
    </main>
  );
}
