'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 德语基础句子数据
interface Sentence {
  id: number;
  german: string;
  chinese: string;
  category: string;
}

// 答题记录
interface QuizRecord {
  question: Sentence;
  userAnswer: Sentence;
  isCorrect: boolean;
}

const sentences: Sentence[] = [
  // 问候
  { id: 1, german: "Hallo!", chinese: "你好!(非正式)", category: "greeting" },
  { id: 2, german: "Guten Morgen!", chinese: "早上好!", category: "greeting" },
  { id: 3, german: "Guten Tag!", chinese: "你好!(正式)", category: "greeting" },
  { id: 4, german: "Guten Abend!", chinese: "晚上好!", category: "greeting" },

  // 再见
  { id: 5, german: "Tschüss!", chinese: "再见!(非正式)", category: "goodbye" },
  { id: 6, german: "Auf Wiedersehen!", chinese: "再见!(正式)", category: "goodbye" },

  // 基础回应
  { id: 7, german: "Ja", chinese: "是", category: "basic" },
  { id: 8, german: "Nein", chinese: "不是", category: "basic" },

  // 感谢
  { id: 9, german: "Danke!", chinese: "谢谢!", category: "thanks" },
  { id: 10, german: "Danke schön!", chinese: "非常感谢!", category: "thanks" },

  // 请/不客气
  { id: 11, german: "Bitte!", chinese: "请!/不客气!", category: "polite" },
  { id: 12, german: "Bitte schön!", chinese: "请!/不客气!(更礼貌)", category: "polite" },

  // 道歉
  { id: 13, german: "Entschuldigung!", chinese: "对不起!/打扰一下!", category: "sorry" },

  // 疑问
  { id: 14, german: "Wie bitte?", chinese: "什么?/请再说一次?", category: "question" },
];

const categories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候" },
  { id: "goodbye", name: "再见" },
  { id: "basic", name: "基础回应" },
  { id: "thanks", name: "感谢" },
  { id: "polite", name: "礼貌用语" },
  { id: "sorry", name: "道歉" },
  { id: "question", name: "疑问" },
];

// 发音函数
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
  } catch { console.log('使用浏览器语音'); }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
};

// 播放音效
const playSound = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  }
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export default function SelectQuestionPage() {
  const [category, setCategory] = useState("all");
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [wrongBook, setWrongBook] = useState<Sentence[]>([]);
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [quizType, setQuizType] = useState<"german" | "chinese">("german");
  const [quizCount, setQuizCount] = useState<5 | 10 | 15 | 20>(10);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);

  // 监听键盘事件 - 按回车键下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && quizResult !== null && currentQuiz) {
        generateQuiz();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, currentQuiz]);

  const filteredSentences = category === "all"
    ? sentences
    : sentences.filter(s => s.category === category);

  // 生成题目
  const generateQuiz = () => {
    const available = filteredSentences;
    if (available.length < 4) {
      alert("该分类至少需要4个句子");
      return;
    }

    // 检查是否已完成答题数量
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const questionIndex = Math.floor(Math.random() * available.length);
    const question = available[questionIndex];

    // 生成错误选项
    const wrong: Sentence[] = [];
    const others = available.filter(s => s.id !== question.id);
    while (wrong.length < 3 && others.length > 0) {
      const idx = Math.floor(Math.random() * others.length);
      wrong.push(others[idx]);
      others.splice(idx, 1);
    }

    const options = [question, ...wrong].sort(() => Math.random() - 0.5);
    setCurrentQuiz({ question, options });
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 开始新答题
  const startQuiz = () => {
    setCurrentQuestionCount(0);
    setCorrectCount(0);
    setQuizFinished(false);
    setQuizHistory([]);
    generateQuiz();
  };

  // 选择答案
  const handleSelect = (index: number) => {
    if (quizResult !== null || !currentQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentQuiz.options[index];
    const isCorrect = selectedOption.id === currentQuiz.question.id;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    // 记录答题历史
    setQuizHistory(prev => [...prev, {
      question: currentQuiz.question,
      userAnswer: selectedOption,
      isCorrect
    }]);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongBook(prev => {
        if (prev.some(s => s.id === currentQuiz.question.id)) return prev;
        return [...prev, currentQuiz.question];
      });
    }

    // 检查是否是最后一题
    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-50">
      <header className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-2">
            <Link href="/02-edu/001-language" className="text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30">
              ← 德语学习
            </Link>
          </div>
          <h1 className="text-2xl font-bold">❓ 德语选择题</h1>
          <p className="opacity-90">基础句子选择题练习</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 题型选择 */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => { setQuizType("german"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizType === "german" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            看中文选德语
          </button>
          <button
            onClick={() => { setQuizType("chinese"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizType === "chinese" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            看德语选中文
          </button>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setQuizStarted(false); }}
              className={`px-3 py-1 rounded-full text-xs ${category === cat.id ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 答题数量选择 */}
        {!quizStarted && !quizFinished && (
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-sm text-gray-600 self-center">答题数量:</span>
            {[5, 10, 15, 20].map(count => (
              <button
                key={count}
                onClick={() => { setQuizCount(count as 5|10|15|20); setQuizStarted(false); }}
                className={`px-3 py-1 rounded-full text-sm ${quizCount === count ? "bg-pink-500 text-white" : "bg-white text-gray-600 border"}`}
              >
                {count}题
              </button>
            ))}
          </div>
        )}

        {/* 进度显示 */}
        {quizStarted && !quizFinished && (
          <div className="text-center mb-4">
            <span className="text-sm text-gray-600">
              进度: {currentQuestionCount} / {quizCount} 题 | 正确: {correctCount} 题
            </span>
          </div>
        )}

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => { setShowWrongBook(false); }}
            className={`px-6 py-2 rounded-full ${!showWrongBook ? "bg-pink-500 text-white" : "bg-white text-gray-700 border"}`}
          >
            ❓ 答题模式
          </button>
          <button
            onClick={() => setShowWrongBook(true)}
            className={`px-6 py-2 rounded-full ${showWrongBook ? "bg-red-500 text-white" : "bg-white text-gray-700 border"}`}
          >
            📚 错题本 ({wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">错题本</h2>
            {wrongBook.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无错题</p>
            ) : (
              <div className="space-y-3">
                {wrongBook.map(s => (
                  <div key={s.id} className="bg-red-50 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{s.german}</p>
                      <p className="text-gray-600">{s.chinese}</p>
                    </div>
                    <button onClick={() => speak(s.german)} className="p-2 bg-amber-100 rounded-full">🔊</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !quizStarted ? (
          /* 开始页面 */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-xl font-bold mb-4">德语基础句子选择题</h2>
            <p className="text-gray-600 mb-6">
              {quizType === "german" ? "看中文，选择正确的德语翻译" : "看德语，选择正确的中文翻译"}
            </p>
            <button
              onClick={startQuiz}
              disabled={filteredSentences.length < 4}
              className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 disabled:bg-gray-300"
            >
              开始答题 ({quizCount}题)
            </button>
            {filteredSentences.length < 4 && (
              <p className="text-red-500 text-sm mt-2">该分类至少需要4个句子</p>
            )}
          </div>
        ) : quizFinished ? (
          /* 答题完成显示结果 */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-bold mb-4">答题完成!</h2>
              <div className="text-4xl font-bold text-pink-500 mb-2">
                {correctCount} / {quizCount}
              </div>
              <p className="text-gray-600 mb-6">
                正确率: {Math.round((correctCount / quizCount) * 100)}%
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={startQuiz}
                  className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
                >
                  再答{quizCount}题
                </button>
                <button
                  onClick={() => { setQuizStarted(false); setQuizFinished(false); }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300"
                >
                  重新设置
                </button>
              </div>
            </div>

            {/* 所有题目列表 */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-gray-800">答题详情</h3>
              <div className="space-y-3">
                {quizHistory.map((record, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      record.isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-lg font-bold ${
                        record.isCorrect ? "text-green-600" : "text-red-600"
                      }`}>
                        {record.isCorrect ? "✓" : "✗"}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          {quizType === "german" ? "题目：" : "题目："}
                          <span className="text-gray-800">
                            {quizType === "german" ? record.question.chinese : record.question.german}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">你的答案：</span>
                          <span className={record.isCorrect ? "text-green-600" : "text-red-600"}>
                            {quizType === "german" ? record.userAnswer.german : record.userAnswer.chinese}
                          </span>
                        </div>
                        {!record.isCorrect && (
                          <div className="text-sm">
                            <span className="text-gray-500">正确答案：</span>
                            <span className="text-green-600">
                              {quizType === "german" ? record.question.german : record.question.chinese}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => speak(record.question.german)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : currentQuiz && (
          /* 答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {quizType === "german" ? "请选择正确的德语" : "请选择正确的中文"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {quizType === "german" ? currentQuiz.question.chinese : currentQuiz.question.german}
              </p>
              <button onClick={() => speak(currentQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                🔊 播放发音
              </button>
            </div>

            <div className="space-y-3">
              {currentQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === currentQuiz.question.id;

                let btnClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                if (showResult) {
                  if (isCorrect) btnClass += "bg-green-500 text-white";
                  else if (isSelected) btnClass += "bg-red-500 text-white";
                  else btnClass += "bg-gray-100 text-gray-400";
                } else {
                  btnClass += isSelected ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700 border-2 border-pink-200 hover:bg-pink-100";
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{quizType === "german" ? option.german : option.chinese}</span>
                      {showResult && isCorrect && <span>✓</span>}
                      {showResult && isSelected && !isCorrect && <span>✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {quizResult && (
              <div className="mt-6 text-center">
                <p className={`text-xl font-bold ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                  {quizResult === "correct" ? "🎉 正确!" : "❌ 错误"}
                </p>
                <button
                  onClick={() => {
                    if (currentQuestionCount >= quizCount) {
                      setQuizFinished(true);
                    } else {
                      generateQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        共 {sentences.length} 个基础句子
      </footer>
    </div>
  );
}
