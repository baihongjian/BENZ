'use client';

import { useState, useEffect } from 'react';

// 简单德语句子数据
interface Sentence {
  id: number;
  german: string;
  chinese: string;
  pronunciation: string;
  category: string;
}

const sentences: Sentence[] = [
  // 基本问候
  { id: 1, german: "Guten Morgen!", chinese: "早上好！", pronunciation: "古腾 莫根", category: "greeting" },
  { id: 2, german: "Guten Tag!", chinese: "你好！", pronunciation: "古腾 塔克", category: "greeting" },
  { id: 3, german: "Guten Abend!", chinese: "晚上好！", pronunciation: "古腾 阿本特", category: "greeting" },
  { id: 4, german: "Gute Nacht!", chinese: "晚安！", pronunciation: "古特 纳希特", category: "greeting" },
  { id: 5, german: "Auf Wiedersehen!", chinese: "再见！", pronunciation: "奥弗 维德尔泽恩", category: "greeting" },
  { id: 6, german: "Tschüss!", chinese: "拜拜！", pronunciation: "丘斯", category: "greeting" },

  // 感谢与道歉
  { id: 7, german: "Danke!", chinese: "谢谢！", pronunciation: "丹克", category: "thanks" },
  { id: 8, german: "Danke schön!", chinese: "非常感谢！", pronunciation: "丹克 舍恩", category: "thanks" },
  { id: 9, german: "Vielen Dank!", chinese: "衷心感谢！", pronunciation: "菲伦 丹克", category: "thanks" },
  { id: 10, german: "Entschuldigung!", chinese: "对不起！", pronunciation: "恩特舒尔迪贡", category: "thanks" },
  { id: 11, german: "Es tut mir leid.", chinese: "我很抱歉。", pronunciation: "埃斯 敦特 米尔 莱特", category: "thanks" },
  { id: 12, german: "Kein Problem!", chinese: "没问题！", pronunciation: "凯因 普罗blem", category: "thanks" },

  // 日常用语
  { id: 13, german: "Ja.", chinese: "是。", pronunciation: "呀", category: "daily" },
  { id: 14, german: "Nein.", chinese: "不是。", pronunciation: "奈因", category: "daily" },
  { id: 15, german: "Ich verstehe.", chinese: "我明白。", pronunciation: "伊希 菲尔施泰赫", category: "daily" },
  { id: 16, german: "Ich verstehe nicht.", chinese: "我不明白。", pronunciation: "伊希 菲尔施泰赫 尼希特", category: "daily" },
  { id: 17, german: "Könnten Sie das wiederholen?", chinese: "您能再说一遍吗？", pronunciation: "克因ten 贼 达斯 维德尔霍伦", category: "daily" },
  { id: 18, german: "Langsamer, bitte.", chinese: "请说慢一点。", pronunciation: "朗萨默尔, 比特", category: "daily" },
  { id: 19, german: "Wie bitte?", chinese: "什么？", pronunciation: "维 比特", category: "daily" },
  { id: 20, german: "Genau!", chinese: "对的！", pronunciation: "格瑙", category: "daily" },

  // 常用疑问句
  { id: 21, german: "Wie heißen Sie?", chinese: "您叫什么名字？", pronunciation: "维 哈伊森 贼", category: "question" },
  { id: 22, german: "Woher kommen Sie?", chinese: "您来自哪里？", pronunciation: "沃黑尔 科门 贼", category: "question" },
  { id: 23, german: "Wie alt sind Sie?", chinese: "您多大了？", pronunciation: "维 阿尔特 辛德 贼", category: "question" },
  { id: 24, german: "Was kostet das?", chinese: "这个多少钱？", pronunciation: "瓦斯 科斯特特 达斯", category: "question" },
  { id: 25, german: "Wo ist der Bahnhof?", chinese: "火车站在哪里？", pronunciation: "沃 伊斯特 德尔 班霍夫", category: "question" },
  { id: 26, german: "Wie spät ist es?", chinese: "现在几点了？", pronunciation: "维 施派特 伊斯特 埃斯", category: "question" },
  { id: 27, german: "Haben Sie ...?", chinese: "您有...吗？", pronunciation: "哈本 贼", category: "question" },
  { id: 28, german: "Kann ich ...?", chinese: "我可以...吗？", pronunciation: "坎 伊希", category: "question" },

  // 数字
  { id: 29, german: "Eins, zwei, drei.", chinese: "一，二，三。", pronunciation: "艾因斯, 茨维, 德赖", category: "number" },
  { id: 30, german: "Vier, fünf, sechs.", chinese: "四，五，六。", pronunciation: "费尔, 芬夫, 泽克斯", category: "number" },
  { id: 31, german: "Sieben, acht, neun, zehn.", chinese: "七，八，九，十。", pronunciation: "齐本, 阿希特, 诺因, 蔡恩", category: "number" },

  // 时间相关
  { id: 32, german: "Heute ist Montag.", chinese: "今天是星期一。", pronunciation: "霍伊特 伊斯特 蒙塔克", category: "time" },
  { id: 33, german: "Morgen ist Dienstag.", chinese: "明天是星期二。", pronunciation: "莫根 伊斯特 丁斯塔克", category: "time" },
  { id: 34, german: "Jetzt.", chinese: "现在。", pronunciation: "耶特", category: "time" },
  { id: 35, german: "Später.", chinese: "稍后。", pronunciation: "施派特", category: "time" },
  { id: 36, german: "Gleich.", chinese: "马上。", pronunciation: "格莱希", category: "time" },

  // 餐厅用语
  { id: 37, german: "Die Speisekarte, bitte.", chinese: "请给我菜单。", pronunciation: "迪 施莱泽卡尔特, 比特", category: "restaurant" },
  { id: 38, german: "Ich möchte bestellen.", chinese: "我想点餐。", pronunciation: "伊希 梅希特 贝施泰伦", category: "restaurant" },
  { id: 39, german: "Die Rechnung, bitte.", chinese: "买单。", pronunciation: "迪 雷希农, 比特", category: "restaurant" },
  { id: 40, german: "Das ist lecker!", chinese: "好吃！", pronunciation: "达斯 伊斯特 莱克", category: "restaurant" },
  { id: 41, german: "Ich bin satt.", chinese: "我吃饱了。", pronunciation: "伊希 宾 扎特", category: "restaurant" },

  // 购物用语
  { id: 42, german: "Wie viel kostet das?", chinese: "这个多少钱？", pronunciation: "维 菲尔 科斯特特 达斯", category: "shopping" },
  { id: 43, german: "Zu teuer!", chinese: "太贵了！", pronunciation: "茨u 托伊尔", category: "shopping" },
  { id: 44, german: "Ich nehme das.", chinese: "我要这个。", pronunciation: "伊希 内梅 达斯", category: "shopping" },
  { id: 45, german: "Haben Sie das in einer anderen Größe?", chinese: "这个有其他尺寸吗？", pronunciation: "哈本 贼 达斯 因 艾纳 安德伦 格勒塞", category: "shopping" },

  // 常用短句
  { id: 46, german: "Alles klar!", chinese: "好的！", pronunciation: "阿勒斯 克拉尔", category: "phrase" },
  { id: 47, german: "Moment, bitte.", chinese: "请稍等。", pronunciation: "莫蒙特, 比特", category: "phrase" },
  { id: 48, german: "Natürlich!", chinese: "当然！", pronunciation: "那图尔利希", category: "phrase" },
  { id: 49, german: "Leider nicht.", chinese: "很遗憾，不是。", pronunciation: "莱德 尼希特", category: "phrase" },
  { id: 50, german: "Das macht nichts.", chinese: "没关系。", pronunciation: "达斯 马希特 尼希特斯", category: "phrase" },
  { id: 51, german: "Gute Idee!", chinese: "好主意！", pronunciation: "古特 伊德", category: "phrase" },
  { id: 52, german: "Keine Ahnung.", chinese: "我不知道。", pronunciation: "凯纳 阿农", category: "phrase" },
  { id: 53, german: "Ich bin müde.", chinese: "我累了。", pronunciation: "伊希 宾 吕德", category: "phrase" },
  { id: 54, german: "Ich habe Hunger.", chinese: "我饿了。", pronunciation: "伊希 哈伯 洪格尔", category: "phrase" },
  { id: 55, german: "Ich habe Durst.", chinese: "我渴了。", pronunciation: "伊希 哈伯 杜尔斯特", category: "phrase" },
  { id: 56, german: "Mir ist kalt.", chinese: "我冷。", pronunciation: "米尔 伊斯特 卡尔特", category: "phrase" },
  { id: 57, german: "Mir ist warm.", chinese: "我热。", pronunciation: "米尔 伊斯特 瓦尔姆", category: "phrase" },
];

// 句子分类
const sentenceCategories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候" },
  { id: "thanks", name: "感谢道歉" },
  { id: "daily", name: "日常用语" },
  { id: "question", name: "疑问句" },
  { id: "number", name: "数字" },
  { id: "time", name: "时间" },
  { id: "restaurant", name: "餐厅" },
  { id: "shopping", name: "购物" },
  { id: "phrase", name: "常用短句" },
];

export default function SentencePracticePage() {
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [category, setCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChinese, setShowChinese] = useState(true);
  const [showPronunciation, setShowPronunciation] = useState(true);

  // 答题相关状态
  const [quizType, setQuizType] = useState<"german" | "chinese">("german");
  const [quizSentence, setQuizSentence] = useState<Sentence | null>(null);
  const [quizOptions, setQuizOptions] = useState<{ sentence: Sentence; isCorrect: boolean }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [wrongBook, setWrongBook] = useState<Sentence[]>([]);
  const [showWrongBook, setShowWrongBook] = useState(false);

  // 筛选句子
  const filteredSentences = category === "all"
    ? sentences
    : sentences.filter(s => s.category === category);

  // 发音函数
  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.85;
    const voices = speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.includes("de"));
    if (germanVoice) utterance.voice = germanVoice;
    speechSynthesis.speak(utterance);
  };

  // 生成答题题目
  const generateQuiz = () => {
    const availableSentences = filteredSentences;
    if (availableSentences.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableSentences.length);
    const correctSentence = availableSentences[randomIndex];

    // 生成错误选项
    const wrongOptions: Sentence[] = [];
    const otherSentences = availableSentences.filter(s => s.id !== correctSentence.id);
    while (wrongOptions.length < 3 && otherSentences.length > 0) {
      const idx = Math.floor(Math.random() * otherSentences.length);
      wrongOptions.push(otherSentences[idx]);
      otherSentences.splice(idx, 1);
    }

    // 组合选项
    const options = [
      { sentence: correctSentence, isCorrect: true },
      ...wrongOptions.map(s => ({ sentence: s, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    setQuizSentence(correctSentence);
    setQuizOptions(options);
    setSelectedOption(null);
    setQuizResult(null);
    setQuizStarted(true);
  };

  // 处理选项选择
  const handleOptionSelect = (index: number) => {
    if (quizResult !== null) return;
    setSelectedOption(index);
    const isCorrect = quizOptions[index].isCorrect;
    setQuizResult(isCorrect ? "correct" : "wrong");

    // 记录错题
    if (!isCorrect && quizSentence) {
      setWrongBook(prev => {
        if (prev.some(s => s.id === quizSentence.id)) return prev;
        return [...prev, quizSentence];
      });
    }
  };

  // 下一题
  const nextQuestion = () => {
    generateQuiz();
  };

  // 当前句子
  const currentSentence = filteredSentences[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold">📝 德语简单句子练习</h1>
          <p className="mt-1 opacity-90">德语日常短句学习与练习</p>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          <button
            onClick={() => { setMode("learn"); setQuizStarted(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "learn" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📖 学习模式
          </button>
          <button
            onClick={() => { setMode("quiz"); setShowWrongBook(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "quiz" ? "bg-amber-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📝 答题模式
          </button>
          <button
            onClick={() => { setShowWrongBook(!showWrongBook); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              showWrongBook ? "bg-red-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📚 错题本 ({wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">错题本</h2>
            {wrongBook.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
            ) : (
              <div className="space-y-3">
                {wrongBook.map((sentence) => (
                  <div key={sentence.id} className="bg-red-50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-800">{sentence.german}</p>
                        <p className="text-gray-600">{sentence.chinese}</p>
                        <p className="text-sm text-gray-400">{sentence.pronunciation}</p>
                      </div>
                      <button
                        onClick={() => speak(sentence.german)}
                        className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : mode === "learn" ? (
          /* 学习模式 */
          <>
            {/* 分类筛选 */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {sentenceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setCurrentIndex(0); }}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    category === cat.id
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-blue-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 显示控制 */}
            <div className="flex justify-center gap-4 mb-4 text-sm">
              <button
                onClick={() => setShowChinese(!showChinese)}
                className={`px-3 py-1 rounded-full ${showChinese ? "bg-green-500 text-white" : "bg-gray-200"}`}
              >
                {showChinese ? "🙈 隐藏中文" : "👁️ 显示中文"}
              </button>
              <button
                onClick={() => setShowPronunciation(!showPronunciation)}
                className={`px-3 py-1 rounded-full ${showPronunciation ? "bg-purple-500 text-white" : "bg-gray-200"}`}
              >
                {showPronunciation ? "🙈 隐藏发音" : "👁️ 显示发音"}
              </button>
            </div>

            {/* 句子卡片 */}
            {currentSentence && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  {sentenceCategories.find(c => c.id === currentSentence.category)?.name}
                </div>

                <div className="text-2xl font-bold text-gray-800 mb-3">
                  {currentSentence.german}
                </div>

                {showPronunciation && (
                  <div className="text-lg text-purple-600 mb-3">
                    {currentSentence.pronunciation}
                  </div>
                )}

                {showChinese && (
                  <div className="text-xl text-green-600 mb-4">
                    {currentSentence.chinese}
                  </div>
                )}

                {/* 发音按钮 */}
                <button
                  onClick={() => speak(currentSentence.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                ← 上一句
              </button>
              <span className="px-4 py-2 text-gray-600">
                {currentIndex + 1} / {filteredSentences.length}
              </span>
              <button
                onClick={() => setCurrentIndex(i => Math.min(filteredSentences.length - 1, i + 1))}
                disabled={currentIndex === filteredSentences.length - 1}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                下一句 →
              </button>
            </div>
          </>
        ) : (
          /* 答题模式 */
          <>
            {/* 题型选择 */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => { setQuizType("german"); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${
                  quizType === "german" ? "bg-green-500 text-white" : "bg-white text-gray-600"
                }`}
              >
                看中文选德语
              </button>
              <button
                onClick={() => { setQuizType("chinese"); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${
                  quizType === "chinese" ? "bg-green-500 text-white" : "bg-white text-gray-600"
                }`}
              >
                看德语选中文
              </button>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {sentenceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setQuizStarted(false); }}
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    category === cat.id
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-600 hover:bg-amber-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 开始答题按钮 */}
            {!quizStarted ? (
              <div className="text-center">
                <button
                  onClick={generateQuiz}
                  disabled={filteredSentences.length < 4}
                  className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 disabled:bg-gray-300"
                >
                  开始答题
                </button>
                {filteredSentences.length < 4 && (
                  <p className="text-sm text-red-500 mt-2">请选择包含至少4个句子的分类</p>
                )}
              </div>
            ) : quizSentence && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* 题目 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {quizType === "german" ? "请选择正确的德语" : "请选择正确的中文"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold text-gray-800">
                      {quizType === "german" ? quizSentence.chinese : quizSentence.german}
                    </p>
                    <button
                      onClick={() => speak(quizSentence.german)}
                      className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                    >
                      🔊
                    </button>
                  </div>
                </div>

                {/* 选项 */}
                <div className="space-y-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const showResult = quizResult !== null;
                    const isCorrect = option.isCorrect;

                    let btnClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                    if (showResult) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else if (isSelected) btnClass += "bg-red-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-amber-50";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={showResult}
                        className={btnClass}
                      >
                        <div className="flex items-center justify-between px-4">
                          <span>{quizType === "german" ? option.sentence.german : option.sentence.chinese}</span>
                          {showResult && isCorrect && <span>✓</span>}
                          {showResult && isSelected && !isCorrect && <span>✗</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 结果和下一题 */}
                {quizResult !== null && (
                  <div className="mt-4 text-center">
                    <p className={`text-xl font-bold mb-4 ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                      {quizResult === "correct" ? "🎉 回答正确！" : "❌ 回答错误"}
                    </p>
                    <button
                      onClick={nextQuestion}
                      className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600"
                    >
                      下一题 →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        共 {sentences.length} 个句子 • 分类学习
      </footer>
    </div>
  );
}
