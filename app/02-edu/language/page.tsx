"use client";

import { useState } from "react";

interface Word {
  german: string;
  chinese: string;
  pronunciation: string;
  category: string;
}

const words: Word[] = [
  // 问候语
  { german: "Hallo", chinese: "你好", pronunciation: "哈喽", category: "greeting" },
  { german: "Guten Morgen", chinese: "早上好", pronunciation: "古腾 莫根", category: "greeting" },
  { german: "Guten Tag", chinese: "你好", pronunciation: "古腾 塔克", category: "greeting" },
  { german: "Guten Abend", chinese: "晚上好", pronunciation: "古腾 阿本特", category: "greeting" },
  { german: "Gute Nacht", chinese: "晚安", pronunciation: "古特 纳赫特", category: "greeting" },
  { german: "Auf Wiedersehen", chinese: "再见", pronunciation: "奥夫 维德尔塞恩", category: "greeting" },
  { german: "Danke", chinese: "谢谢", pronunciation: "丹克", category: "greeting" },
  { german: "Bitte", chinese: "不客气/请", pronunciation: "比特", category: "greeting" },
  { german: "Entschuldigung", chinese: "对不起", pronunciation: "恩特舒尔迪贡", category: "greeting" },

  // 数字
  { german: "Eins", chinese: "一", pronunciation: "艾因斯", category: "number" },
  { german: "Zwei", chinese: "二", pronunciation: "茨维", category: "number" },
  { german: "Drei", chinese: "三", pronunciation: "德赖", category: "number" },
  { german: "Vier", chinese: "四", pronunciation: "菲尔", category: "number" },
  { german: "Fünf", chinese: "五", pronunciation: "芬夫", category: "number" },
  { german: "Sechs", chinese: "六", pronunciation: "泽克斯", category: "number" },
  { german: "Sieben", chinese: "七", pronunciation: "西本", category: "number" },
  { german: "Acht", chinese: "八", pronunciation: "阿赫特", category: "number" },
  { german: "Neun", chinese: "九", pronunciation: "诺因", category: "number" },
  { german: "Zehn", chinese: "十", pronunciation: "茨恩", category: "number" },

  // 颜色
  { german: "Rot", chinese: "红色", pronunciation: "罗特", category: "color" },
  { german: "Blau", chinese: "蓝色", pronunciation: "布劳", category: "color" },
  { german: "Grün", chinese: "绿色", pronunciation: "格林", category: "color" },
  { german: "Gelb", chinese: "黄色", pronunciation: "格尔普", category: "color" },
  { german: "Schwarz", chinese: "黑色", pronunciation: "施瓦茨", category: "color" },
  { german: "Weiß", chinese: "白色", pronunciation: "魏斯", category: "color" },
  { german: "Orange", chinese: "橙色", pronunciation: "奥朗热", category: "color" },
  { german: "Lila", chinese: "紫色", pronunciation: "里拉", category: "color" },

  // 家庭
  { german: "Mutter", chinese: "妈妈", pronunciation: "穆特", category: "family" },
  { german: "Vater", chinese: "爸爸", pronunciation: "法特", category: "family" },
  { german: "Eltern", chinese: "父母", pronunciation: "埃尔滕", category: "family" },
  { german: "Bruder", chinese: "兄弟/哥哥", pronunciation: "布鲁德", category: "family" },
  { german: "Schwester", chinese: "姐妹/姐姐", pronunciation: "施韦斯特", category: "family" },
  { german: "Kind", chinese: "孩子", pronunciation: "金特", category: "family" },
  { german: "Sohn", chinese: "儿子", pronunciation: "佐恩", category: "family" },
  { german: "Tochter", chinese: "女儿", pronunciation: "托赫特", category: "family" },
];

const categories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候语" },
  { id: "number", name: "数字" },
  { id: "color", name: "颜色" },
  { id: "family", name: "家庭" },
];

export default function GermanLearning() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredWords = selectedCategory === "all"
    ? words
    : words.filter(w => w.category === selectedCategory);

  const currentWord = filteredWords[currentIndex];

  const nextWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    }, 150);
  };

  const prevWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, 150);
  };

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-amber-50">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">🇩🇪 德语学习</h1>
          <p className="text-gray-600">点击卡片查看释义和发音</p>
        </header>

        {/* 分类筛选 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 rounded-full transition ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 单词卡片 */}
        <div className="mb-6 text-center text-gray-600">
          {filteredWords.length} 个单词
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={prevWord}
            className="p-3 bg-white rounded-full shadow hover:shadow-md hover:bg-gray-50 transition"
          >
            ←
          </button>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-80 h-64 perspective cursor-pointer"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
              {/* 正面 - 德语 */}
              <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-2 border-blue-100">
                <span className="text-sm text-gray-400 mb-4">德语</span>
                <h2 className="text-5xl font-bold text-blue-800 mb-4">{currentWord?.german}</h2>
                <span className="text-gray-500">点击查看释义 →</span>
              </div>

              {/* 背面 - 中文和发音 */}
              <div className="absolute w-full h-full backface-hidden bg-amber-50 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-2 border-amber-100 rotate-y-180">
                <span className="text-sm text-amber-600 mb-4">中文 · 发音</span>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">{currentWord?.chinese}</h3>
                <p className="text-xl text-amber-600">{currentWord?.pronunciation}</p>
              </div>
            </div>
          </div>

          <button
            onClick={nextWord}
            className="p-3 bg-white rounded-full shadow hover:shadow-md hover:bg-gray-50 transition"
          >
            →
          </button>
        </div>

        {/* 进度指示器 */}
        <div className="flex justify-center gap-2 mb-8">
          {filteredWords.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 单词列表 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">单词列表</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredWords.map((word, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  idx === currentIndex
                    ? "bg-blue-100 border-2 border-blue-400"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <div className="font-bold text-blue-800">{word.german}</div>
                <div className="text-sm text-gray-600">{word.chinese}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
        </div>
      </div>

      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  );
}
