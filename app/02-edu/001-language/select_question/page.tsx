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

// 对话选择题数据：题干是A的问题，选项是B的回答
interface DialogQuiz {
  id: number;
  question: string;      // A 说的话（德语）
  questionZh: string;    // A 说的话的中文翻译
  correctAnswer: string; // B 的正确回答（德语）
  options: string[];     // 选项（B 的回答，德语）
}

const dialogQuizzes: DialogQuiz[] = [
  {
    id: 1,
    question: "Wie heißen Sie?",
    questionZh: "您叫什么名字？",
    correctAnswer: "Ich heiße Olga Minakova.",
    options: [
      "Ich heiße Olga Minakova.",
      "Ich komme aus Russland, aus Moskau.",
      "Ich wohne in Moskau.",
      "Guten Tag!",
    ],
  },
  {
    id: 2,
    question: "Woher kommen Sie?",
    questionZh: "您来自哪里？",
    correctAnswer: "Ich komme aus Russland, aus Moskau.",
    options: [
      "Ich komme aus Russland, aus Moskau.",
      "Ich heiße Olga Minakova.",
      "Ich wohne in Deutschland.",
      "Bis morgen!",
    ],
  },
  {
    id: 3,
    question: "Wie heißen Sie?",
    questionZh: "您叫什么名字？",
    correctAnswer: "Ich heiße Li Wei.",
    options: [
      "Ich heiße Li Wei.",
      "Ich komme aus China, aus Beijing.",
      "Ich wohne in China.",
      "Guten Morgen!",
    ],
  },
  {
    id: 4,
    question: "Woher kommen Sie, Herr Li?",
    questionZh: "李先生，您来自哪里？",
    correctAnswer: "Ich komme aus China, aus Beijing.",
    options: [
      "Ich komme aus China, aus Beijing.",
      "Ich heiße Li Wei.",
      "Ich wohne in Wien.",
      "Auf Wiedersehen!",
    ],
  },
  {
    id: 5,
    question: "Wie heißt du?",
    questionZh: "你叫什么名字？",
    correctAnswer: "Ich bin Hans.",
    options: [
      "Ich bin Hans.",
      "Ich wohne in Wien.",
      "Ich komme aus Österreich.",
      "Guten Abend!",
    ],
  },
  {
    id: 6,
    question: "Wo wohnst du?",
    questionZh: "你住在哪里？",
    correctAnswer: "Ich wohne in Wien.",
    options: [
      "Ich wohne in Wien.",
      "Ich bin Hans.",
      "Ich komme aus Deutschland.",
      "Tschüss!",
    ],
  },
  {
    id: 7,
    question: "Guten Tag!",
    questionZh: "您好！",
    correctAnswer: "Guten Tag! Bitte sehr.",
    options: [
      "Guten Tag! Bitte sehr.",
      "Guten Morgen!",
      "Auf Wiedersehen!",
      "Danke schön!",
    ],
  },
  // 疑问词练习
  {
    id: 8,
    question: "Wer ist das?",
    questionZh: "这个人是谁？",
    correctAnswer: "Das ist Herr Li.",
    options: [
      "Das ist Herr Li.",
      "Er kommt aus China.",
      "Er wohnt in Beijing.",
      "Guten Tag!",
    ],
  },
  {
    id: 9,
    question: "Wie geht es Ihnen?",
    questionZh: "您好吗？",
    correctAnswer: "Danke, mir geht es gut.",
    options: [
      "Danke, mir geht es gut.",
      "Ich heiße Li Wei.",
      "Ich komme aus China.",
      "Auf Wiedersehen!",
    ],
  },
  {
    id: 10,
    question: "Woher kommst du?",
    questionZh: "你来自哪里？",
    correctAnswer: "Ich komme aus Deutschland.",
    options: [
      "Ich komme aus Deutschland.",
      "Ich heiße Hans.",
      "Ich wohne in Wien.",
      "Ja, ich bin Student.",
    ],
  },
  {
    id: 11,
    question: "Was ist das?",
    questionZh: "这是什么？",
    correctAnswer: "Das ist ein Buch.",
    options: [
      "Das ist ein Buch.",
      "Er heißt Peter.",
      "Ich komme aus Berlin.",
      "Guten Morgen!",
    ],
  },
  {
    id: 12,
    question: "Wo wohnst du?",
    questionZh: "你住在哪里？",
    correctAnswer: "Ich wohne in München.",
    options: [
      "Ich wohne in München.",
      "Ich heiße Maria.",
      "Ich komme aus Österreich.",
      "Danke schön!",
    ],
  },
];

// 疑问词数据
const questionWords: Sentence[] = [
  { id: 1, german: "Wer?", chinese: "谁？", category: "question" },
  { id: 2, german: "Wie?", chinese: "怎样？/如何？", category: "question" },
  { id: 3, german: "Woher?", chinese: "从哪里？", category: "question" },
  { id: 4, german: "Was?", chinese: "什么？", category: "question" },
  { id: 5, german: "Wo?", chinese: "在哪里？", category: "question" },
  { id: 6, german: "Wann?", chinese: "什么时候？", category: "question" },
  { id: 7, german: "Warum?", chinese: "为什么？", category: "question" },
  { id: 8, german: "Welcher?", chinese: "哪个？", category: "question" },
];

// 德语时刻数据
const timeExpressions: Sentence[] = [
  { id: 1, german: "Es ist ein Uhr.", chinese: "1点", category: "hour" },
  { id: 2, german: "Es ist zwei Uhr.", chinese: "2点", category: "hour" },
  { id: 3, german: "Es ist drei Uhr.", chinese: "3点", category: "hour" },
  { id: 4, german: "Es ist vier Uhr.", chinese: "4点", category: "hour" },
  { id: 5, german: "Es ist fünf Uhr.", chinese: "5点", category: "hour" },
  { id: 6, german: "Es ist sechs Uhr.", chinese: "6点", category: "hour" },
  { id: 7, german: "Es ist sieben Uhr.", chinese: "7点", category: "hour" },
  { id: 8, german: "Es ist acht Uhr.", chinese: "8点", category: "hour" },
  { id: 9, german: "Es ist neun Uhr.", chinese: "9点", category: "hour" },
  { id: 10, german: "Es ist zehn Uhr.", chinese: "10点", category: "hour" },
  { id: 11, german: "Es ist elf Uhr.", chinese: "11点", category: "hour" },
  { id: 12, german: "Es ist zwölf Uhr.", chinese: "12点", category: "hour" },
  { id: 13, german: "Es ist dreizehn Uhr.", chinese: "13点", category: "hour" },
  { id: 14, german: "Es ist vierzehn Uhr.", chinese: "14点", category: "hour" },
  { id: 15, german: "Es ist fünfzehn Uhr.", chinese: "15点", category: "hour" },
  { id: 16, german: "Es ist sechzehn Uhr.", chinese: "16点", category: "hour" },
  { id: 17, german: "Es ist siebzehn Uhr.", chinese: "17点", category: "hour" },
  { id: 18, german: "Es ist achtzehn Uhr.", chinese: "18点", category: "hour" },
  { id: 19, german: "Es ist neunzehn Uhr.", chinese: "19点", category: "hour" },
  { id: 20, german: "Es ist zwanzig Uhr.", chinese: "20点", category: "hour" },
  { id: 21, german: "Es ist einundzwanzig Uhr.", chinese: "21点", category: "hour" },
  { id: 22, german: "Es ist zweiundzwanzig Uhr.", chinese: "22点", category: "hour" },
  { id: 23, german: "Es ist dreiundzwanzig Uhr.", chinese: "23点", category: "hour" },
  { id: 24, german: "Es ist null Uhr.", chinese: "0点/24点", category: "hour" },
  // 半点
  { id: 25, german: "Es ist halb zwei.", chinese: "1点半", category: "half" },
  { id: 26, german: "Es ist halb drei.", chinese: "2点半", category: "half" },
  { id: 27, german: "Es ist halb vier.", chinese: "3点半", category: "half" },
  { id: 28, german: "Es ist halb fünf.", chinese: "4点半", category: "half" },
  { id: 29, german: "Es ist halb sechs.", chinese: "5点半", category: "half" },
  // 刻
  { id: 30, german: "Es ist Viertel zwei.", chinese: "1点15分", category: "quarter" },
  { id: 31, german: "Es ist Viertel drei.", chinese: "2点15分", category: "quarter" },
  { id: 32, german: "Es ist dreiviertel zwei.", chinese: "1点45分", category: "quarter" },
  { id: 33, german: "Es ist dreiviertel drei.", chinese: "2点45分", category: "quarter" },
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
  const [vocabQuizType, setVocabQuizType] = useState<"german" | "chinese">("german");
  const [quizCount, setQuizCount] = useState<5 | 10 | 15 | 20>(10);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);

  // 对话模式相关状态
  const [quizMode, setQuizMode] = useState<"sentence" | "dialog" | "vocab" | "time">("sentence");
  const [currentDialogQuiz, setCurrentDialogQuiz] = useState<DialogQuiz | null>(null);
  const [dialogWrongBook, setDialogWrongBook] = useState<DialogQuiz[]>([]);
  const [vocabWrongBook, setVocabWrongBook] = useState<Sentence[]>([]);
  const [currentVocabQuiz, setCurrentVocabQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 时刻模式相关状态
  const [timeQuizType, setTimeQuizType] = useState<"german" | "chinese">("german");
  const [timeWrongBook, setTimeWrongBook] = useState<Sentence[]>([]);
  const [currentTimeQuiz, setCurrentTimeQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);

  // 从 localStorage 加载错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wrongBook");
      if (saved) {
        try {
          setWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (wrongBook.length > 0) {
        localStorage.setItem("wrongBook", JSON.stringify(wrongBook));
      } else {
        localStorage.removeItem("wrongBook");
      }
    }
  }, [wrongBook]);

  // 清空错题本
  const clearWrongBook = () => {
    if (confirm("确定要清空错题本吗？")) {
      setWrongBook([]);
      localStorage.removeItem("wrongBook");
    }
  };

  // 从 localStorage 加载对话错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dialogWrongBook");
      if (saved) {
        try {
          setDialogWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载对话错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存对话错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (dialogWrongBook.length > 0) {
        localStorage.setItem("dialogWrongBook", JSON.stringify(dialogWrongBook));
      } else {
        localStorage.removeItem("dialogWrongBook");
      }
    }
  }, [dialogWrongBook]);

  // 清空对话错题本
  const clearDialogWrongBook = () => {
    if (confirm("确定要清空对话错题本吗？")) {
      setDialogWrongBook([]);
      localStorage.removeItem("dialogWrongBook");
    }
  };

  // 从 localStorage 加载疑问词错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vocabWrongBook");
      if (saved) {
        try {
          setVocabWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载疑问词错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存疑问词错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (vocabWrongBook.length > 0) {
        localStorage.setItem("vocabWrongBook", JSON.stringify(vocabWrongBook));
      } else {
        localStorage.removeItem("vocabWrongBook");
      }
    }
  }, [vocabWrongBook]);

  // 清空疑问词错题本
  const clearVocabWrongBook = () => {
    if (confirm("确定要清空疑问词错题本吗？")) {
      setVocabWrongBook([]);
      localStorage.removeItem("vocabWrongBook");
    }
  };

  // 从 localStorage 加载时刻错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timeWrongBook");
      if (saved) {
        try {
          setTimeWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载时刻错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存时刻错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (timeWrongBook.length > 0) {
        localStorage.setItem("timeWrongBook", JSON.stringify(timeWrongBook));
      } else {
        localStorage.removeItem("timeWrongBook");
      }
    }
  }, [timeWrongBook]);

  // 清空时刻错题本
  const clearTimeWrongBook = () => {
    if (confirm("确定要清空时刻错题本吗？")) {
      setTimeWrongBook([]);
      localStorage.removeItem("timeWrongBook");
    }
  };

  // 监听键盘事件 - 按回车键下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && quizResult !== null) {
        if (quizMode === "vocab" && currentVocabQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateVocabQuiz();
          }
        } else if (quizMode === "dialog" && currentDialogQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateDialogQuiz();
          }
        } else if (quizMode === "time" && currentTimeQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateTimeQuiz();
          }
        } else if (quizMode === "sentence" && currentQuiz) {
          generateQuiz();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, currentQuiz, currentVocabQuiz, currentDialogQuiz, currentTimeQuiz, quizMode, currentQuestionCount, quizCount]);

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

  // 生成对话题目
  const generateDialogQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const idx = Math.floor(Math.random() * dialogQuizzes.length);
    const quiz = dialogQuizzes[idx];
    // 打乱选项
    const shuffledOptions = [...quiz.options].sort(() => Math.random() - 0.5);
    setCurrentDialogQuiz({ ...quiz, options: shuffledOptions });
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成疑问词题目
  const generateVocabQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const available = questionWords;
    const idx = Math.floor(Math.random() * available.length);
    const question = available[idx];

    // 生成错误选项（从其他疑问词中选择）
    const wrong: Sentence[] = [];
    const others = available.filter(s => s.id !== question.id);
    while (wrong.length < 3 && others.length > 0) {
      const r = Math.floor(Math.random() * others.length);
      wrong.push(others[r]);
      others.splice(r, 1);
    }

    const options = [question, ...wrong].sort(() => Math.random() - 0.5);
    setCurrentVocabQuiz({ question, options });
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成时刻题目
  const generateTimeQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const available = timeExpressions;
    const idx = Math.floor(Math.random() * available.length);
    const question = available[idx];

    // 生成错误选项
    const wrong: Sentence[] = [];
    const others = available.filter(s => s.id !== question.id);
    while (wrong.length < 3 && others.length > 0) {
      const r = Math.floor(Math.random() * others.length);
      wrong.push(others[r]);
      others.splice(r, 1);
    }

    const options = [question, ...wrong].sort(() => Math.random() - 0.5);
    setCurrentTimeQuiz({ question, options });
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
    if (quizMode === "dialog") {
      generateDialogQuiz();
    } else if (quizMode === "vocab") {
      generateVocabQuiz();
    } else if (quizMode === "time") {
      generateTimeQuiz();
    } else {
      generateQuiz();
    }
  };

  // 对话模式 - 选择答案
  const handleDialogSelect = (index: number) => {
    if (quizResult !== null || !currentDialogQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentDialogQuiz.options[index];
    const isCorrect = selectedOption === currentDialogQuiz.correctAnswer;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setDialogWrongBook(prev => {
        if (prev.some(d => d.id === currentDialogQuiz.id)) return prev;
        return [...prev, currentDialogQuiz];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  // 疑问词模式 - 选择答案
  const handleVocabSelect = (index: number) => {
    if (quizResult !== null || !currentVocabQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentVocabQuiz.options[index];
    const isCorrect = selectedOption.id === currentVocabQuiz.question.id;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setVocabWrongBook(prev => {
        if (prev.some(s => s.id === currentVocabQuiz.question.id)) return prev;
        return [...prev, currentVocabQuiz.question];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  // 时刻模式 - 选择答案
  const handleTimeSelect = (index: number) => {
    if (quizResult !== null || !currentTimeQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentTimeQuiz.options[index];
    const isCorrect = selectedOption.id === currentTimeQuiz.question.id;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setTimeWrongBook(prev => {
        if (prev.some(s => s.id === currentTimeQuiz.question.id)) return prev;
        return [...prev, currentTimeQuiz.question];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
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
        {/* 模式选择：基础句子 vs 对话练习 vs 疑问词 */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => { setQuizMode("sentence"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "sentence" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            基础句子
          </button>
          <button
            onClick={() => { setQuizMode("vocab"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "vocab" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            疑问词
          </button>
          <button
            onClick={() => { setQuizMode("time"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "time" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            时刻
          </button>
          <button
            onClick={() => { setQuizMode("dialog"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "dialog" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            对话练习
          </button>
        </div>

        {/* 句子模式：题型选择 */}
        {quizMode === "sentence" && (
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
        )}

        {/* 疑问词模式：题型选择 */}
        {quizMode === "vocab" && (
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => { setVocabQuizType("german"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${vocabQuizType === "german" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看中文选德语
            </button>
            <button
              onClick={() => { setVocabQuizType("chinese"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${vocabQuizType === "chinese" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看德语选中文
            </button>
          </div>
        )}

        {/* 时刻模式：题型选择 */}
        {quizMode === "time" && (
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => { setTimeQuizType("german"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${timeQuizType === "german" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看中文选德语
            </button>
            <button
              onClick={() => { setTimeQuizType("chinese"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${timeQuizType === "chinese" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看德语选中文
            </button>
          </div>
        )}

        {/* 句子模式：分类筛选 */}
        {quizMode === "sentence" && (
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
        )}

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
            📚 错题本 ({quizMode === "dialog" ? dialogWrongBook.length : quizMode === "vocab" ? vocabWrongBook.length : quizMode === "time" ? timeWrongBook.length : wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {quizMode === "dialog" ? "对话错题本" : quizMode === "vocab" ? "疑问词错题本" : quizMode === "time" ? "时刻错题本" : "错题本"}
              </h2>
              {quizMode === "dialog" ? (
                dialogWrongBook.length > 0 && (
                  <button onClick={clearDialogWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : quizMode === "vocab" ? (
                vocabWrongBook.length > 0 && (
                  <button onClick={clearVocabWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : quizMode === "time" ? (
                timeWrongBook.length > 0 && (
                  <button onClick={clearTimeWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : (
                wrongBook.length > 0 && (
                  <button onClick={clearWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              )}
            </div>
            {quizMode === "dialog" ? (
              dialogWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {dialogWrongBook.map(d => (
                    <div key={d.id} className="bg-red-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500">A: {d.question}</p>
                      <p className="text-xs text-gray-400 mb-1">{d.questionZh}</p>
                      <p className="font-bold text-gray-800">正确回答: {d.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              )
            ) : quizMode === "vocab" ? (
              vocabWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {vocabWrongBook.map(s => (
                    <div key={s.id} className="bg-red-50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{s.german}</p>
                        <p className="text-gray-600">{s.chinese}</p>
                      </div>
                      <button onClick={() => speak(s.german)} className="p-2 bg-amber-100 rounded-full">🔊</button>
                    </div>
                  ))}
                </div>
              )
            ) : quizMode === "time" ? (
              timeWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {timeWrongBook.map(s => (
                    <div key={s.id} className="bg-red-50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{s.german}</p>
                        <p className="text-gray-600">{s.chinese}</p>
                      </div>
                      <button onClick={() => speak(s.german)} className="p-2 bg-amber-100 rounded-full">🔊</button>
                    </div>
                  ))}
                </div>
              )
            ) : wrongBook.length === 0 ? (
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
          quizMode === "vocab" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-xl font-bold mb-4">德语疑问词练习</h2>
              <p className="text-gray-600 mb-6">
                {vocabQuizType === "german" ? "看中文，选择正确的德语疑问词" : "看德语，选择正确的中文翻译"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {questionWords.length} 个疑问词</p>
            </div>
          ) : quizMode === "time" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🕐</div>
              <h2 className="text-xl font-bold mb-4">德语时刻练习</h2>
              <p className="text-gray-600 mb-6">
                {timeQuizType === "german" ? "看中文，选择正确的德语时刻表达" : "看德语时刻表达，选择正确的中文"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {timeExpressions.length} 个时刻表达</p>
            </div>
          ) : quizMode === "dialog" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-bold mb-4">德语对话选择题</h2>
              <p className="text-gray-600 mb-6">
                A 会说一句话，你需要选择 B 正确的回答
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {dialogQuizzes.length} 道题</p>
            </div>
          ) : (
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
          )
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
        ) : quizMode === "vocab" && currentVocabQuiz ? (
          /* 疑问词答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {vocabQuizType === "german" ? "请选择正确的德语疑问词" : "请选择正确的中文翻译"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {vocabQuizType === "german" ? currentVocabQuiz.question.chinese : currentVocabQuiz.question.german}
              </p>
              {vocabQuizType === "german" && (
                <button onClick={() => speak(currentVocabQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                  🔊 播放发音
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentVocabQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === currentVocabQuiz.question.id;

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
                    onClick={() => handleVocabSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{vocabQuizType === "german" ? option.german : option.chinese}</span>
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
                      generateVocabQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        ) : quizMode === "time" && currentTimeQuiz ? (
          /* 时刻答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {timeQuizType === "german" ? "请选择正确的德语时刻表达" : "请选择正确的中文"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {timeQuizType === "german" ? currentTimeQuiz.question.chinese : currentTimeQuiz.question.german}
              </p>
              {timeQuizType === "german" && (
                <button onClick={() => speak(currentTimeQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                  🔊 播放发音
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentTimeQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === currentTimeQuiz.question.id;

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
                    onClick={() => handleTimeSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{timeQuizType === "german" ? option.german : option.chinese}</span>
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
                      generateTimeQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        ) : quizMode === "dialog" && currentDialogQuiz ? (
          /* 对话答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* A 说的话（题干） */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-blue-600 font-bold mb-1">A 说：</p>
              <p className="text-xl font-bold text-gray-800">{currentDialogQuiz.question}</p>
              <p className="text-sm text-gray-500">{currentDialogQuiz.questionZh}</p>
              <button onClick={() => speak(currentDialogQuiz.question)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                🔊 播放
              </button>
            </div>

            {/* 问题提示 */}
            <p className="text-center text-gray-500 mb-4">B 应该怎么回答？</p>

            {/* 选项 */}
            <div className="space-y-3">
              {currentDialogQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option === currentDialogQuiz.correctAnswer;

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
                    key={idx}
                    onClick={() => handleDialogSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{option}</span>
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
                      generateDialogQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
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
        {quizMode === "vocab"
          ? `共 ${questionWords.length} 个疑问词`
          : quizMode === "time"
            ? `共 ${timeExpressions.length} 个时刻表达`
            : quizMode === "dialog"
              ? `共 ${dialogQuizzes.length} 道对话题`
              : `共 ${sentences.length} 个基础句子`}
      </footer>
    </div>
  );
}
