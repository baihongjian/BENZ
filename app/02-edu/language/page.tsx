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

// 倒计时滴滴声
const playTickSound = () => {
  if (typeof window === "undefined") return;

  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

interface Word {
  german: string;
  chinese: string;
  pronunciation: string;
  category: string;
  gender?: "der" | "die" | "das"; // 词性（仅名词需要）
}

interface QuizOption {
  word: Word;
  isCorrect: boolean;
}

interface QuizRecord {
  german: string;
  chinese: string;
  selected: string | null;
  isCorrect: boolean;
  isTimeout: boolean;
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
  { german: "Mutter", chinese: "妈妈", pronunciation: "穆特", category: "family", gender: "die" },
  { german: "Vater", chinese: "爸爸", pronunciation: "法特", category: "family", gender: "der" },
  { german: "Eltern", chinese: "父母", pronunciation: "埃尔滕", category: "family", gender: "die" },
  { german: "Bruder", chinese: "兄弟", pronunciation: "布鲁德", category: "family", gender: "der" },
  { german: "Schwester", chinese: "姐妹", pronunciation: "施韦斯特", category: "family", gender: "die" },
  { german: "Kind", chinese: "孩子", pronunciation: "金特", category: "family", gender: "das" },
  { german: "Sohn", chinese: "儿子", pronunciation: "佐恩", category: "family", gender: "der" },
  { german: "Tochter", chinese: "女儿", pronunciation: "托赫特", category: "family", gender: "die" },
  { german: "Familie", chinese: "家庭", pronunciation: "法米利", category: "family", gender: "die" },
  { german: "Frau", chinese: "女人/妻子", pronunciation: "弗劳", category: "family", gender: "die" },
  { german: "Mann", chinese: "男人/丈夫", pronunciation: "曼恩", category: "family", gender: "der" },
  { german: "Geschwister", chinese: "兄弟姐妹", pronunciation: "盖施维斯特", category: "family", gender: "die" },
  { german: "Tante", chinese: "姑母/姨母", pronunciation: "坦特", category: "family", gender: "die" },
  { german: "Onkel", chinese: "叔叔/舅舅", pronunciation: "昂克尔", category: "family", gender: "der" },
  { german: "Mädchen", chinese: "女孩", pronunciation: "梅德欣", category: "family", gender: "das" },
  { german: "Junge", chinese: "男孩", pronunciation: "永格", category: "family", gender: "der" },
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
  const [quizTimeout, setQuizTimeout] = useState(false); // 是否超时未作答
  const [quizStarted, setQuizStarted] = useState(false); // 是否已开始答题
  const [quizRecords, setQuizRecords] = useState<QuizRecord[]>([]); // 答题记录
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
          setQuizTimeout(true);
          setQuizResult("wrong");
          playSound("wrong");
          // 记录超时未答题
          setQuizRecords(prev => [...prev, {
            german: quizWord!.german,
            chinese: quizWord!.chinese,
            selected: null,
            isCorrect: false,
            isTimeout: true
          }]);
          return 0;
        }
        // 最后3秒播放滴滴声
        if (prev <= 4) {
          playTickSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, quizTimer, selectedOption, quizWord]);

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
    setQuizTimeout(false);
    setTimeLeft(quizTimer);
    setTimerActive(quizTimer > 0);
  };

  // 切换到答题模式
  const handleModeChange = (newMode: "learn" | "quiz") => {
    setMode(newMode);
    if (newMode === "quiz") {
      setQuizStarted(false);
      setQuizFinished(false);
      setCurrentQuizNumber(1);
      setQuizWord(null);
      setQuizOptions([]);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
    }
  };

  // 开始答题
  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuizNumber(1);
    setQuizFinished(false);
    setQuizTimeout(false);
    setQuizRecords([]); // 清空答题记录
    generateQuiz();
  };

  // 选择答案
  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // 已选择过

    setSelectedOption(index);

    if (quizOptions[index].isCorrect) {
      setQuizResult("correct");
      playSound("correct");
      // 记录正确答题
      setQuizRecords(prev => [...prev, {
        german: quizWord!.german,
        chinese: quizWord!.chinese,
        selected: quizOptions[index].word.chinese,
        isCorrect: true,
        isTimeout: false
      }]);
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      // 记录错误答题
      setQuizRecords(prev => [...prev, {
        german: quizWord!.german,
        chinese: quizWord!.chinese,
        selected: quizOptions[index].word.chinese,
        isCorrect: false,
        isTimeout: false
      }]);
    }
  };

  // 下一题
  const nextQuiz = () => {
    if (currentQuizNumber >= quizCount) {
      setQuizFinished(true);
      setTimerActive(false);
    } else {
      setCurrentQuizNumber(prev => prev + 1);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);
      generateQuiz();
    }
  };

  // 重新开始（返回开始界面）
  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuizNumber(1);
    setQuizWord(null);
    setQuizOptions([]);
    setSelectedOption(null);
    setQuizResult(null);
    setQuizTimeout(false);
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

        {/* 答题模式：开始界面 */}
        {mode === "quiz" && !quizStarted && !quizFinished && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">德语单词测验</h2>

            {/* 设置选项 */}
            <div className="mb-6">
              <div className="mb-4">
                <span className="text-gray-700 font-medium block mb-2">题数</span>
                <div className="flex justify-center gap-2">
                  {[5, 10, 15, 20].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizCount(num)}
                      className={`w-12 h-12 rounded-full font-bold transition ${
                        quizCount === num
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-amber-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-gray-700 font-medium block mb-2">难度</span>
                <div className="flex justify-center gap-2">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizDifficulty(num as 2 | 3 | 4)}
                      className={`w-12 h-12 rounded-full font-bold transition ${
                        quizDifficulty === num
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-amber-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-gray-700 font-medium block mb-2">倒计时</span>
                <div className="flex justify-center gap-2">
                  {[0, 5, 7, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizTimer(num as 0 | 5 | 7 | 10)}
                      className={`w-14 h-10 rounded-full font-medium transition ${
                        quizTimer === num
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-red-50"
                      }`}
                    >
                      {num === 0 ? "∞" : `${num}秒`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition text-lg"
            >
              开始答题 →
            </button>
          </div>
        )}

        {/* 答题模式：答题中显示进度 */}
        {mode === "quiz" && quizStarted && !quizFinished && (
          <div className="flex justify-center gap-4 mb-6">
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
              {cat.id !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({words.filter(w => w.category === cat.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 学习模式：词汇统计 */}
        {mode === "learn" && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">📊 词汇统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const count = cat.id === "all"
                  ? words.length
                  : words.filter(w => w.category === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className={`text-center p-2 rounded-lg ${
                      selectedCategory === cat.id ? "bg-blue-100" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-600">{cat.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 答题模式：完成界面 */}
        {mode === "quiz" && quizFinished && (
          <div className="max-w-2xl mx-auto">
            {/* 统计信息 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">答题完成！</h2>

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {quizRecords.filter(r => r.isCorrect).length}
                  </div>
                  <div className="text-gray-500">正确</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">
                    {quizRecords.filter(r => !r.isCorrect).length}
                  </div>
                  <div className="text-gray-500">错误</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800">
                    {quizCount}
                  </div>
                  <div className="text-gray-500">总计</div>
                </div>
              </div>

              <div className="text-lg text-gray-600 mb-4">
                正确率：
                <span className="font-bold text-amber-600">
                  {Math.round((quizRecords.filter(r => r.isCorrect).length / quizCount) * 100)}%
                </span>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={restartQuiz}
                  className="px-6 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition"
                >
                  再来一轮 →
                </button>
                <button
                  onClick={() => setMode("learn")}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition"
                >
                  返回学习
                </button>
              </div>
            </div>

            {/* 答题记录列表 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">答题详情</h3>
              <div className="space-y-3">
                {quizRecords.map((record, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      record.isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-800 text-lg">
                          {record.german}
                        </div>
                        <div className="text-gray-600">
                          正确答案：{record.chinese}
                        </div>
                      </div>
                      <div className="text-right">
                        {record.isCorrect ? (
                          <span className="text-green-600 font-medium">
                            ✅ 正确
                            {record.selected && `（选择了 ${record.selected}）`}
                          </span>
                        ) : record.isTimeout ? (
                          <span className="text-red-600 font-medium">
                            ⏱️ 超时
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            ❌ 错误（选择了 {record.selected}）
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 答题模式：左右布局 */}
        {mode === "quiz" && quizStarted && quizWord && !quizFinished && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* 左侧：题目和选项 */}
            <div className="flex-1">
              {/* 德语单词显示 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-4 border-2 border-amber-100">
                <span className="text-sm text-gray-400 mb-2 block">请选择对应的中文翻译</span>
                <div className="flex items-center justify-center gap-4">
                  {quizWord.gender && (
                    <span className={`px-3 py-1 rounded-full text-xl font-bold ${
                      quizWord.gender === "der" ? "bg-blue-100 text-blue-700" :
                      quizWord.gender === "die" ? "bg-red-100 text-red-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {quizWord.gender}
                    </span>
                  )}
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

                  // 有选择答案 或 超时未作答
                  if (selectedOption !== null || quizTimeout) {
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
              {selectedOption !== null || quizTimeout ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center sticky top-4">
                  <p className={`text-2xl font-bold mb-4 ${
                    quizResult === "correct" ? "text-green-600" : "text-red-600"
                  }`}>
                    {quizResult === "correct" ? "✅ 正确" : "❌ 超时"}
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
                <div className="flex items-center gap-3 mb-4">
                  {currentWord?.gender && (
                    <span className={`px-3 py-1 rounded-full text-lg font-bold ${
                      currentWord.gender === "der" ? "bg-blue-100 text-blue-700" :
                      currentWord.gender === "die" ? "bg-red-100 text-red-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {currentWord.gender}
                    </span>
                  )}
                  <h2 className="text-5xl font-bold text-blue-800">{currentWord?.german}</h2>
                </div>
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
                <div className="flex items-center gap-2">
                  {word.gender && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      word.gender === "der" ? "bg-blue-100 text-blue-700" :
                      word.gender === "die" ? "bg-red-100 text-red-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {word.gender}
                    </span>
                  )}
                  <span className="font-bold text-blue-800">{word.german}</span>
                </div>
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
