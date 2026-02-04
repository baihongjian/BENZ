"use client";

import { useState, useCallback, useEffect } from "react";

// 发音函数
const speak = (text: string) => {
  if (typeof window === "undefined") return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE"; // 德语
  utterance.rate = 0.8; // 稍慢一点
  utterance.pitch = 1;

  // 尝试选择德语语音
  const voices = speechSynthesis.getVoices();
  const germanVoice = voices.find(v => v.lang.includes("de"));
  if (germanVoice) {
    utterance.voice = germanVoice;
  }

  speechSynthesis.speak(utterance);
};

// 播放音效
const playSound = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;

  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (type === "correct") {
    // 正确：清脆的"叮"声，音调上升
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } else {
    // 错误：低沉的"咚"声
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }
};

interface Word {
  german: string;
  chinese: string;
  pronunciation: string;
  category: string;
}

interface QuizOption {
  word: Word;
  isCorrect: boolean;
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
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [quizDifficulty, setQuizDifficulty] = useState<2 | 3 | 4>(3);
  const [quizCount, setQuizCount] = useState(10); // 答题数量
  const [quizTimer, setQuizTimer] = useState<0 | 5 | 7 | 10>(0); // 倒计时秒数
  const [currentQuizNumber, setCurrentQuizNumber] = useState(1); // 当前第几题
  const [quizWord, setQuizWord] = useState<Word | null>(null);
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizFinished, setQuizFinished] = useState(false); // 是否完成
  const [timeLeft, setTimeLeft] = useState<number>(0); // 剩余时间
  const [timerActive, setTimerActive] = useState(false); // 计时器是否运行

  const filteredWords = selectedCategory === "all"
    ? words
    : words.filter(w => w.category === selectedCategory);

  const currentWord = filteredWords[currentIndex];

  // 倒计时逻辑
  useEffect(() => {
    if (!timerActive || quizTimer === 0 || selectedOption !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到，自动判定失败
          clearInterval(timer);
          setTimerActive(false);
          if (selectedOption === null) {
            setQuizResult("wrong");
            playSound("wrong");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, quizTimer, selectedOption]);

  // 生成随机题目
  const generateQuiz = () => {
    if (filteredWords.length < 2) return;

    // 随机选择正确答案
    const correctIndex = Math.floor(Math.random() * filteredWords.length);
    const correctWord = filteredWords[correctIndex];

    // 获取干扰项（排除正确答案）
    const otherWords = filteredWords.filter((_, idx) => idx !== correctIndex);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);

    // 根据难度选择干扰项数量
    const wrongCount = quizDifficulty - 1;
    const wrongWords = shuffledOthers.slice(0, wrongCount);

    // 合并并打乱选项
    const options: QuizOption[] = [
      { word: correctWord, isCorrect: true },
      ...wrongWords.map(w => ({ word: w, isCorrect: false })),
    ];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    setQuizWord(correctWord);
    setQuizOptions(shuffledOptions);
    setSelectedOption(null);
    setQuizResult(null);
    setTimeLeft(quizTimer);
    setTimerActive(quizTimer > 0);
  };

  // 切换到答题模式时生成第一道题
  const handleModeChange = (newMode: "learn" | "quiz") => {
    setMode(newMode);
    if (newMode === "quiz") {
      setCurrentQuizNumber(1);
      setQuizFinished(false);
      generateQuiz();
    }
  };

  // 选择答案
  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // 已选择过

    setSelectedOption(index);

    if (quizOptions[index].isCorrect) {
      setQuizResult("correct");
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
    }
  };

  // 下一题
  const nextQuiz = () => {
    if (currentQuizNumber >= quizCount) {
      setQuizFinished(true);
      setTimerActive(false);
    } else {
      setCurrentQuizNumber(prev => prev + 1);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);
      generateQuiz();
    }
  };

  // 重新开始
  const restartQuiz = () => {
    setCurrentQuizNumber(1);
    setQuizFinished(false);
    setTimeLeft(quizTimer);
    setTimerActive(quizTimer > 0);
    generateQuiz();
  };

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
          <p className="text-gray-600">
            {mode === "learn" ? "点击卡片查看释义和发音" : "选择正确的中文翻译"}
          </p>
        </header>

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleModeChange("learn")}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "learn"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50"
            }`}
          >
            📖 学习模式
          </button>
          <button
            onClick={() => handleModeChange("quiz")}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "quiz"
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-amber-50"
            }`}
          >
            🎯 答题模式
          </button>
        </div>

        {/* 答题模式：设置 */}
        {mode === "quiz" && !quizFinished && (
          <div className="flex flex-wrap justify-center items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">题数：</span>
              {[5, 10, 15, 20].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setQuizCount(num);
                    setCurrentQuizNumber(1);
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    quizCount === num
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-amber-50"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">难度：</span>
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setQuizDifficulty(num as 2 | 3 | 4);
                  }}
                  className={`w-10 h-10 rounded-full font-bold transition ${
                    quizDifficulty === num
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-amber-50"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">倒计时：</span>
              {[0, 5, 7, 10].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setQuizTimer(num as 0 | 5 | 7 | 10);
                  }}
                  className={`px-3 py-2 rounded-full font-medium transition ${
                    quizTimer === num
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-red-50"
                  }`}
                >
                  {num === 0 ? "∞" : `${num}秒`}
                </button>
              ))}
            </div>
            <span className="text-gray-500">
              第 <span className="font-bold text-amber-600">{currentQuizNumber}</span> / {quizCount} 题
            </span>
          </div>
        )}

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

        {/* 答题模式：完成界面 */}
        {mode === "quiz" && quizFinished && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">答题完成！</h2>
            <p className="text-gray-600 mb-6">共 {quizCount} 道题</p>
            <button
              onClick={restartQuiz}
              className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition"
            >
              再来一轮 →
            </button>
            <button
              onClick={() => setMode("learn")}
              className="block mx-auto mt-4 text-gray-500 hover:text-gray-700"
            >
              返回学习模式
            </button>
          </div>
        )}

        {/* 答题模式：左右布局 */}
        {mode === "quiz" && quizWord && !quizFinished && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* 左侧：题目和选项 */}
            <div className="flex-1">
              {/* 德语单词显示 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-4 border-2 border-amber-100">
                <span className="text-sm text-gray-400 mb-2 block">请选择对应的中文翻译</span>
                <div className="flex items-center justify-center gap-4">
                  <h2 className="text-4xl font-bold text-blue-800">{quizWord.german}</h2>
                  <button
                    onClick={() => speak(quizWord.german)}
                    className="p-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
                    title="发音"
                  >
                    🔊
                  </button>
                </div>
                {/* 倒计时显示 */}
                {quizTimer > 0 && (
                  <div className={`mt-4 text-2xl font-bold ${
                    timeLeft <= 3 ? "text-red-600 animate-pulse" : "text-red-500"
                  }`}>
                    ⏱️ {timeLeft} 秒
                  </div>
                )}
              </div>

              {/* 选项列表 */}
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((option, idx) => {
                  let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                  let disabled = false;

                  if (selectedOption !== null) {
                    disabled = true;
                    if (option.isCorrect) {
                      buttonClass += "bg-green-100 border-green-500 text-green-800";
                    } else if (idx === selectedOption && !option.isCorrect) {
                      buttonClass += "bg-red-100 border-red-500 text-red-800";
                    } else {
                      buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                    }
                  } else {
                    buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={disabled}
                      className={buttonClass}
                    >
                      {option.word.chinese}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 右侧：结果和下一题 */}
            <div className="lg:w-48 flex-shrink-0">
              {selectedOption !== null ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center sticky top-4">
                  <p className={`text-2xl font-bold mb-4 ${
                    quizResult === "correct" ? "text-green-600" : "text-red-600"
                  }`}>
                    {quizResult === "correct" ? "✅ 正确" : "❌ 错误"}
                  </p>
                  {quizResult === "wrong" && (
                    <p className="text-gray-600 mb-4">
                      正确：{quizOptions.find(o => o.isCorrect)?.word.chinese}
                    </p>
                  )}
                  <button
                    onClick={nextQuiz}
                    className="w-full py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition"
                  >
                    下一题 →
                  </button>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-2xl p-6 text-center text-gray-400">
                  选择答案...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 学习模式：单词卡片 */}
        {mode === "learn" && (
          <>
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
                <span className="text-sm text-gray-400 mb-2">德语</span>
                <h2 className="text-5xl font-bold text-blue-800 mb-4">{currentWord?.german}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    currentWord && speak(currentWord.german);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
                >
                  🔊 发音
                </button>
                <span className="text-gray-400 text-sm mt-3">点击卡片查看释义</span>
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
          </>
        )}
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
