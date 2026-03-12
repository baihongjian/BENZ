'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 德语数字数据
const germanNumbers = [
  { digit: '0', german: 'null', chinese: '零' },
  { digit: '1', german: 'eins', chinese: '一' },
  { digit: '2', german: 'zwei', chinese: '二' },
  { digit: '3', german: 'drei', chinese: '三' },
  { digit: '4', german: 'vier', chinese: '四' },
  { digit: '5', german: 'fünf', chinese: '五' },
  { digit: '6', german: 'sechs', chinese: '六' },
  { digit: '7', german: 'sieben', chinese: '七' },
  { digit: '8', german: 'acht', chinese: '八' },
  { digit: '9', german: 'neun', chinese: '九' },
];

// 德语疑问词数据
const questionWords = [
  { id: 1, german: "Wer?", chinese: "谁？" },
  { id: 2, german: "Wie?", chinese: "怎样？/如何？" },
  { id: 3, german: "Woher?", chinese: "从哪里？" },
  { id: 4, german: "Was?", chinese: "什么？" },
  { id: 5, german: "Wo?", chinese: "在哪里？" },
  { id: 6, german: "Wann?", chinese: "什么时候？" },
  { id: 7, german: "Warum?", chinese: "为什么？" },
  { id: 8, german: "Welcher?", chinese: "哪个？" },
];

// 德语人称代词数据
const personalPronouns = [
  { id: 1, german: "ich", chinese: "我" },
  { id: 2, german: "wir", chinese: "我们" },
  { id: 3, german: "du", chinese: "你" },
  { id: 4, german: "ihr", chinese: "你们" },
  { id: 5, german: "Sie", chinese: "您" },
];

// 德语动词kommen变位数据
const verbConjugation = [
  { id: 1, german: "ich komme", chinese: "我来" },
  { id: 2, german: "du kommst", chinese: "你来" },
  { id: 3, german: "wir kommen", chinese: "我们来" },
  { id: 4, german: "ihr kommt", chinese: "你们来" },
  { id: 5, german: "Sie kommen", chinese: "您来" },
];

// 发音函数 - 使用 Edge TTS
const speak = async (text: string) => {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch('http://localhost:8000/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'de' })
    });

    const data = await response.json();

    if (data.audio) {
      const audio = new Audio(data.audio);
      await audio.play();
      return;
    }
  } catch (error) {
    console.log('Edge TTS 不可用，使用浏览器语音');
  }

  // 回退到浏览器语音
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.includes("de"));
    if (germanVoice) utterance.voice = germanVoice;
  };

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  speechSynthesis.speak(utterance);
};

// 播放音效
const playSound = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;

  const AudioContext: typeof window.AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (type === "correct") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } else {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }
};

export default function SpellingTestPage() {
  const [contentType, setContentType] = useState<"number" | "questionWord" | "pronoun" | "verb">("number");
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [currentIndex, setCurrentIndex] = useState(0);

  // 答题相关
  const [quizType, setQuizType] = useState<"digitToWord" | "wordToDigit" | "chineseToGerman">("digitToWord");
  const [quizNumber, setQuizNumber] = useState<typeof germanNumbers[0] | null>(null);
  const [userInput, setUserInput] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [wrongBook, setWrongBook] = useState<typeof germanNumbers>([]);
  const [showWrongBook, setShowWrongBook] = useState(false);

  // 疑问词相关
  const [questionWordIndex, setQuestionWordIndex] = useState(0);
  const [questionWordQuiz, setQuestionWordQuiz] = useState<typeof questionWords[0] | null>(null);
  const [questionWordWrongBook, setQuestionWordWrongBook] = useState<typeof questionWords>([]);

  // 人称代词相关
  const [pronounIndex, setPronounIndex] = useState(0);
  const [pronounQuiz, setPronounQuiz] = useState<typeof personalPronouns[0] | null>(null);
  const [pronounWrongBook, setPronounWrongBook] = useState<typeof personalPronouns>([]);

  // 动词变位相关
  const [verbIndex, setVerbIndex] = useState(0);
  const [verbQuiz, setVerbQuiz] = useState<typeof verbConjugation[0] | null>(null);
  const [verbWrongBook, setVerbWrongBook] = useState<typeof verbConjugation>([]);

  // 当前数字
  const currentNumber = germanNumbers[currentIndex];
  // 当前疑问词
  const currentQuestionWord = questionWords[questionWordIndex];
  // 当前人称代词
  const currentPronoun = personalPronouns[pronounIndex];
  // 当前动词变位
  const currentVerb = verbConjugation[verbIndex];

  // 生成答题题目
  const generateQuiz = () => {
    if (contentType === "questionWord") {
      const randomIndex = Math.floor(Math.random() * questionWords.length);
      setQuestionWordQuiz(questionWords[randomIndex]);
    } else if (contentType === "pronoun") {
      const randomIndex = Math.floor(Math.random() * personalPronouns.length);
      setPronounQuiz(personalPronouns[randomIndex]);
    } else if (contentType === "verb") {
      const randomIndex = Math.floor(Math.random() * verbConjugation.length);
      setVerbQuiz(verbConjugation[randomIndex]);
    } else {
      const randomIndex = Math.floor(Math.random() * germanNumbers.length);
      setQuizNumber(germanNumbers[randomIndex]);
    }
    setUserInput("");
    setQuizResult(null);
    setQuizStarted(true);
  };

  // 提交答案
  const submitAnswer = () => {
    if (!userInput.trim()) return;

    let isCorrect = false;
    if (contentType === "questionWord" && questionWordQuiz) {
      // 支持小写和无问号
      const userAns = userInput.trim().toLowerCase().replace(/[?？]/g, '');
      const correctAns = questionWordQuiz.german.toLowerCase().replace(/[?？]/g, '');
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setQuestionWordWrongBook(prev => prev.some(w => w.id === questionWordQuiz.id) ? prev : [...prev, questionWordQuiz]);
      }
    } else if (contentType === "pronoun" && pronounQuiz) {
      // 支持小写
      const userAns = userInput.trim().toLowerCase();
      const correctAns = pronounQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setPronounWrongBook(prev => prev.some(w => w.id === pronounQuiz.id) ? prev : [...prev, pronounQuiz]);
      }
    } else if (contentType === "verb" && verbQuiz) {
      // 支持小写
      const userAns = userInput.trim().toLowerCase();
      const correctAns = verbQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setVerbWrongBook(prev => prev.some(w => w.id === verbQuiz.id) ? prev : [...prev, verbQuiz]);
      }
    } else if (quizNumber) {
      isCorrect = userInput.trim().toLowerCase() === quizNumber.german.toLowerCase();
      if (!isCorrect) {
        setWrongBook(prev => prev.some(n => n.digit === quizNumber.digit) ? prev : [...prev, quizNumber]);
      }
    }

    if (isCorrect) {
      setQuizResult("correct");
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
    }
  };

  // 监听键盘事件 - 按回车键下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && quizResult !== null && quizStarted && !showWrongBook) {
        generateQuiz();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, quizStarted, showWrongBook, contentType, questionWordQuiz, pronounQuiz, verbQuiz, quizNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-2">
            <Link
              href="/02-edu/001-language"
              className="text-sm px-3 py-1 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
            >
              ← 德语学习
            </Link>
          </div>
          <h1 className="text-2xl font-bold">
            {contentType === "questionWord" ? "❓ 德语疑问词拼写" : contentType === "pronoun" ? "👤 人称代词拼写" : contentType === "verb" ? "🔄 动词变位拼写" : "🔢 德语数字拼写"}
          </h1>
          <p className="mt-1 opacity-90">
            {contentType === "questionWord" ? "疑问词单词听写练习" : contentType === "pronoun" ? "人称代词单词听写练习" : contentType === "verb" ? "动词kommen变位听写练习" : "0-9 数字单词听写练习"}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 内容类型切换 */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => { setContentType("number"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "number" ? "bg-indigo-500 text-white" : "bg-white text-gray-600"}`}
          >
            🔢 数字
          </button>
          <button
            onClick={() => { setContentType("questionWord"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "questionWord" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            ❓ 疑问词
          </button>
        </div>

        {/* 语法分类 */}
        <div className="flex justify-center mb-4">
          <select
            value={contentType === "number" || contentType === "questionWord" ? "" : contentType}
            onChange={(e) => { setContentType(e.target.value as "pronoun" | "verb"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className="px-4 py-2 rounded-full text-sm font-medium border-2 border-purple-200 bg-white text-gray-700 focus:outline-none focus:border-purple-400"
          >
            <option value="">选择语法类型</option>
            <option value="pronoun">语法1: 人称代词（第1人称和第2人称）</option>
            <option value="verb">语法2: 动词变位（kommen）第1人称和第2人称</option>
          </select>
        </div>

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => { setMode("learn"); setQuizStarted(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "learn" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-300"
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
            ✍️ 答题模式
          </button>
          <button
            onClick={() => setShowWrongBook(true)}
            className={`px-6 py-2 rounded-full font-medium transition ${
              showWrongBook ? "bg-red-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📚 错题本 ({contentType === "questionWord" ? questionWordWrongBook.length : contentType === "pronoun" ? pronounWrongBook.length : contentType === "verb" ? verbWrongBook.length : wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">错题本</h2>
            {contentType === "questionWord" ? (
              questionWordWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {questionWordWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-pink-600">{word.chinese}</div>
                      <button
                        onClick={() => speak(word.german)}
                        className="mt-2 p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : contentType === "pronoun" ? (
              pronounWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {pronounWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-purple-600">{word.chinese}</div>
                      <button
                        onClick={() => speak(word.german)}
                        className="mt-2 p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : contentType === "verb" ? (
              verbWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {verbWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-orange-600">{word.chinese}</div>
                      <button
                        onClick={() => speak(word.german)}
                        className="mt-2 p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : wrongBook.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {wrongBook.map((num) => (
                  <div key={num.digit} className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">{num.digit}</div>
                    <div className="text-lg text-purple-600">{num.german}</div>
                    <button
                      onClick={() => speak(num.german)}
                      className="mt-2 p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                    >
                      🔊
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : mode === "learn" ? (
          /* 学习模式 */
          contentType === "questionWord" ? (
            /* 疑问词学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl font-bold text-pink-600 mb-4">
                  {currentQuestionWord.german}
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {currentQuestionWord.chinese}
                </div>
                <button
                  onClick={() => speak(currentQuestionWord.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setQuestionWordIndex(i => Math.max(0, i - 1))}
                  disabled={questionWordIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {questionWordIndex + 1} / {questionWords.length}
                </span>
                <button
                  onClick={() => setQuestionWordIndex(i => Math.min(questionWords.length - 1, i + 1))}
                  disabled={questionWordIndex === questionWords.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">疑问词总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {questionWords.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-pink-600 w-8">{word.german}</span>
                        <span className="text-lg text-purple-600">{word.chinese}</span>
                      </div>
                      <button
                        onClick={() => speak(word.german)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : contentType === "pronoun" ? (
            /* 人称代词学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl font-bold text-purple-600 mb-4">
                  {currentPronoun.german}
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {currentPronoun.chinese}
                </div>
                <button
                  onClick={() => speak(currentPronoun.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPronounIndex(i => Math.max(0, i - 1))}
                  disabled={pronounIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {pronounIndex + 1} / {personalPronouns.length}
                </span>
                <button
                  onClick={() => setPronounIndex(i => Math.min(personalPronouns.length - 1, i + 1))}
                  disabled={pronounIndex === personalPronouns.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">人称代词总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {personalPronouns.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-purple-600 w-8">{word.german}</span>
                        <span className="text-lg text-purple-600">{word.chinese}</span>
                      </div>
                      <button
                        onClick={() => speak(word.german)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : contentType === "verb" ? (
            /* 动词变位学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-orange-600 mb-4">
                  {currentVerb.german}
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {currentVerb.chinese}
                </div>
                <button
                  onClick={() => speak(currentVerb.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setVerbIndex(i => Math.max(0, i - 1))}
                  disabled={verbIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {verbIndex + 1} / {verbConjugation.length}
                </span>
                <button
                  onClick={() => setVerbIndex(i => Math.min(verbConjugation.length - 1, i + 1))}
                  disabled={verbIndex === verbConjugation.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">动词kommen变位总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {verbConjugation.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-orange-600 w-32">{word.german}</span>
                        <span className="text-lg text-orange-600">{word.chinese}</span>
                      </div>
                      <button
                        onClick={() => speak(word.german)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* 数字学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-8xl font-bold text-indigo-600 mb-4">
                  {currentNumber.digit}
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {currentNumber.german}
                </div>
                <div className="text-xl text-gray-500 mb-4">
                  {currentNumber.chinese}
                </div>
                <button
                  onClick={() => speak(currentNumber.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {currentIndex + 1} / {germanNumbers.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(i => Math.min(germanNumbers.length - 1, i + 1))}
                  disabled={currentIndex === germanNumbers.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">数字总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {germanNumbers.map((num) => (
                    <div key={num.digit} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-indigo-600 w-8">{num.digit}</span>
                        <span className="text-lg text-purple-600">{num.german}</span>
                      </div>
                      <button
                        onClick={() => speak(num.german)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        ) : (
          /* 答题模式 */
          <>
            {/* 题型选择 */}
            <div className="flex justify-center gap-4 mb-6">
              {contentType === "questionWord" ? (
                <button
                  onClick={() => { setQuizType("chineseToGerman"); setQuizStarted(false); }}
                  className={`px-4 py-2 rounded-full text-sm ${
                    quizType === "chineseToGerman" ? "bg-pink-500 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  中文→德语
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setQuizType("digitToWord"); setQuizStarted(false); }}
                    className={`px-4 py-2 rounded-full text-sm ${
                      quizType === "digitToWord" ? "bg-indigo-500 text-white" : "bg-white text-gray-600"
                    }`}
                  >
                    数字→德语
                  </button>
                  <button
                    onClick={() => { setQuizType("wordToDigit"); setQuizStarted(false); }}
                    className={`px-4 py-2 rounded-full text-sm ${
                      quizType === "wordToDigit" ? "bg-indigo-500 text-white" : "bg-white text-gray-600"
                    }`}
                  >
                    德语→数字
                  </button>
                </>
              )}
            </div>

            {!quizStarted ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-6">
                  {contentType === "questionWord" ? "❓" : contentType === "pronoun" ? "👤" : contentType === "verb" ? "🔄" : "🔢"}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {contentType === "questionWord" ? "德语疑问词听写" : contentType === "pronoun" ? "人称代词听写" : contentType === "verb" ? "动词变位听写" : "德语数字听写"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {contentType === "questionWord"
                    ? "听中文，写出德语疑问词"
                    : contentType === "pronoun"
                      ? "听中文，写出人称代词"
                      : contentType === "verb"
                        ? "听中文，写出动词变位"
                        : quizType === "digitToWord" ? "听数字，写出德语单词" : "听德语单词，写出数字"}
                </p>
                <button
                  onClick={generateQuiz}
                  className="px-8 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600 transition"
                >
                  开始答题
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* 题目 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {contentType === "questionWord"
                      ? "请写出这个中文对应的德语疑问词"
                      : contentType === "pronoun"
                        ? "请写出这个中文对应的人称代词"
                        : contentType === "verb"
                          ? "请写出这个中文对应的动词变位"
                          : quizType === "digitToWord" ? "请写出这个数字的德语" : "请写出这个德语对应的数字"}
                  </p>
                  <div className={`text-6xl font-bold mb-4 ${contentType === "questionWord" ? "text-pink-600" : contentType === "pronoun" ? "text-purple-600" : contentType === "verb" ? "text-orange-600" : "text-indigo-600"}`}>
                    {contentType === "questionWord"
                      ? questionWordQuiz?.chinese
                      : contentType === "pronoun"
                        ? pronounQuiz?.chinese
                        : contentType === "verb"
                          ? verbQuiz?.chinese
                          : quizType === "digitToWord" ? quizNumber?.digit : quizNumber?.german}
                  </div>
                  <button
                    onClick={() => speak(contentType === "questionWord" ? questionWordQuiz?.german || "" : contentType === "pronoun" ? pronounQuiz?.german || "" : contentType === "verb" ? verbQuiz?.german || "" : quizType === "digitToWord" ? quizNumber?.digit || "" : quizNumber?.german || "")}
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                  >
                    🔊 播放
                  </button>
                </div>

                {/* 输入框 */}
                {!quizResult && (
                  <div className="mb-6">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="请输入答案..."
                      className="w-full px-4 py-3 text-xl text-center border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                    />
                  </div>
                )}

                {/* 提交按钮 */}
                {!quizResult && (
                  <div className="text-center">
                    <button
                      onClick={submitAnswer}
                      disabled={!userInput.trim()}
                      className={`px-8 py-3 rounded-full font-medium transition ${
                        userInput.trim()
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      确认答案
                    </button>
                  </div>
                )}

                {/* 结果 */}
                {quizResult && (
                  <div className="text-center">
                    <p className={`text-2xl font-bold mb-4 ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                      {quizResult === "correct" ? "🎉 回答正确！" : "❌ 回答错误"}
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-600">正确答案：</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {contentType === "questionWord" ? questionWordQuiz?.german : contentType === "pronoun" ? pronounQuiz?.german : contentType === "verb" ? verbQuiz?.german : quizNumber?.german}
                      </p>
                      <p className="text-gray-500">
                        ({contentType === "questionWord" ? questionWordQuiz?.chinese : contentType === "pronoun" ? pronounQuiz?.chinese : contentType === "verb" ? verbQuiz?.chinese : quizNumber?.chinese})
                      </p>
                    </div>
                    <button
                      onClick={generateQuiz}
                      className="px-8 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600"
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

      <footer className="text-center py-6 text-gray-400 text-sm">
        {contentType === "questionWord" ? "德语疑问词拼写练习" : contentType === "pronoun" ? "人称代词拼写练习" : contentType === "verb" ? "动词变位拼写练习" : "德语数字 0-9 拼写练习"}
      </footer>
    </div>
  );
}
