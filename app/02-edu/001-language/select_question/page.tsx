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

  // 职业 & 身份
  { id: 15, german: "der Arzt", chinese: "医生", category: "profession" },
  { id: 16, german: "der Beruf", chinese: "职业", category: "profession" },
  { id: 17, german: "die Firma", chinese: "公司", category: "profession" },
  { id: 18, german: "der Lehrer", chinese: "老师", category: "profession" },
  { id: 19, german: "der Professor", chinese: "教授", category: "profession" },
  { id: 20, german: "die Hausfrau", chinese: "家庭主妇", category: "profession" },
  { id: 21, german: "der Schüler", chinese: "学生", category: "profession" },
  { id: 22, german: "der Student", chinese: "大学生", category: "profession" },
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
  { id: "profession", name: "职业 & 身份" },
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
  // 特殊时刻：14点15分（多种正确表达）
  { id: 901, german: "14点15分（下午2:15）", chinese: "14点15分", category: "special" },
];

// 特殊时刻选择题（单选题：正确答案是14点15分，干扰项是其他时间）
interface TimeSpecialQuiz {
  id: number;
  questionZh: string;      // 题目（中文）
  correctAnswer: string;   // 正确答案（14点15分的一种表达）
  wrongAnswers: string[];  // 干扰项（3个错误选项）
  options?: string[];       // 打乱后的所有选项（动态添加）
  correctIndex?: number;   // 正确答案在选项中的索引（动态添加）
}

const timeSpecialQuizzes: TimeSpecialQuiz[] = [
  {
    id: 1,
    questionZh: "14点15分（下午2:15）",
    correctAnswer: "Es ist Viertel nach zwei.",
    wrongAnswers: ["Es ist zwei Uhr.", "Es ist halb zwei.", "Es ist dreiviertel zwei."],
  },
  {
    id: 2,
    questionZh: "14点15分（下午2:15）",
    correctAnswer: "Es ist fünfzehn nach zwei.",
    wrongAnswers: ["Es ist drei Uhr.", "Es ist Viertel nach drei.", "Es ist halb drei."],
  },
  {
    id: 3,
    questionZh: "14点15分（下午2:15）",
    correctAnswer: "Es ist vierzehn Uhr fünfzehn.",
    wrongAnswers: ["Es ist vierzehn Uhr.", "Es ist fünfzehn Uhr.", "Es ist dreizehn Uhr fünfzehn."],
  },
  {
    id: 4,
    questionZh: "14点15分（下午2:15）",
    correctAnswer: "Es ist zwei Uhr fünfzehn.",
    wrongAnswers: ["Es ist zwei Uhr.", "Es ist halb drei.", "Es ist drei Uhr fünfzehn."],
  },
];

// 德语人称代词数据
const personalPronouns: Sentence[] = [
  // 第一人称
  { id: 1, german: "ich", chinese: "我（第一人称单数）", category: "first" },
  { id: 2, german: "wir", chinese: "我们（第一人称复数）", category: "first" },
  // 第二人称非正式
  { id: 3, german: "du", chinese: "你（第二人称单数，非正式）", category: "second-informal" },
  { id: 4, german: "ihr", chinese: "你们（第二人称复数，非正式）", category: "second-informal" },
  // 第二人称正式
  { id: 5, german: "Sie", chinese: "您（第二人称单数，正式）", category: "second-formal" },
  { id: 6, german: "Sie", chinese: "您们（第二人称复数，正式）", category: "second-formal" },
];

// 德语人称代词（第3人称）数据
const personalPronouns3rd: Sentence[] = [
  // 男性
  { id: 101, german: "er", chinese: "他", category: "male" },
  // 女性
  { id: 102, german: "sie", chinese: "她", category: "female" },
  // 中性
  { id: 103, german: "es", chinese: "它", category: "neuter" },
  // 复数
  { id: 104, german: "sie", chinese: "他们/她们/它们", category: "plural" },
];

// 动词kommen变位数据
const verbConjugation: Sentence[] = [
  { id: 1, german: "ich komme", chinese: "我来", category: "1st-singular" },
  { id: 2, german: "du kommst", chinese: "你来（非正式）", category: "2nd-singular" },
  { id: 3, german: "wir kommen", chinese: "我们来", category: "1st-plural" },
  { id: 4, german: "ihr kommt", chinese: "你们来", category: "2nd-plural" },
  { id: 5, german: "Sie kommen", chinese: "您来（敬语）", category: "2nd-formal" },
];

// 动词变位数据
const verbConjugationData: Record<string, Sentence[]> = {
  kommen: [
    { id: 1, german: "Ich komme aus China.", chinese: "我来自中国", category: "1st-singular" },
    { id: 2, german: "Du kommst aus Deutschland.", chinese: "你来自德国", category: "2nd-singular" },
    { id: 3, german: "Wir kommen aus der Schule.", chinese: "我们来自学校", category: "1st-plural" },
    { id: 4, german: "Ihr kommt aus dem Büro.", chinese: "你们来自办公室", category: "2nd-plural" },
    { id: 5, german: "Sie kommen aus Berlin.", chinese: "您来自柏林", category: "formal" },
  ],
  sein: [
    { id: 201, german: "Ich bin Student.", chinese: "我是学生", category: "1st-singular" },
    { id: 202, german: "Du bist müde.", chinese: "你累了", category: "2nd-singular" },
    { id: 203, german: "Wir sind müde.", chinese: "我们累了", category: "1st-plural" },
    { id: 204, german: "Ihr seid hungrig.", chinese: "你们饿了", category: "2nd-plural" },
    { id: 205, german: "Sie sind müde.", chinese: "您累了", category: "formal" },
  ],
  heißen: [
    { id: 301, german: "Ich heiße Li Ming.", chinese: "我叫李明", category: "1st-singular" },
    { id: 302, german: "Du heißt Maria.", chinese: "你叫玛丽亚", category: "2nd-singular" },
    { id: 303, german: "Wir heißen Li Ming und Wang Tao.", chinese: "我们叫李明和王涛", category: "1st-plural" },
    { id: 304, german: "Ihr heißt Anna und Peter.", chinese: "你们叫安娜和彼得", category: "2nd-plural" },
    { id: 305, german: "Sie heißen Herr Wang.", chinese: "您叫王先生", category: "formal" },
  ],
  arbeiten: [
    { id: 401, german: "Ich arbeite in China.", chinese: "我在中国工作", category: "1st-singular" },
    { id: 402, german: "Du arbeitest in Berlin.", chinese: "你在柏林工作", category: "2nd-singular" },
    { id: 403, german: "Wir arbeiten in der Firma.", chinese: "我们在公司工作", category: "1st-plural" },
    { id: 404, german: "Ihr arbeitet in der Schule.", chinese: "你们在学校工作", category: "2nd-plural" },
    { id: 405, german: "Sie arbeiten in Shanghai.", chinese: "您在上海工作", category: "formal" },
  ],
  wohnen: [
    { id: 501, german: "Ich wohne in Beijing.", chinese: "我住在北京", category: "1st-singular" },
    { id: 502, german: "Du wohnst in München.", chinese: "你住在慕尼黑", category: "2nd-singular" },
    { id: 503, german: "Wir wohnen in Hamburg.", chinese: "我们住在汉堡", category: "1st-plural" },
    { id: 504, german: "Ihr wohnt in Köln.", chinese: "你们住在科隆", category: "2nd-plural" },
    { id: 505, german: "Sie wohnen in Frankfurt.", chinese: "您住在法兰克福", category: "formal" },
  ],
};

// 德语定冠词和名词格数数据
interface ArticleNoun {
  id: number;
  noun: string;        // 名词（单数形式）
  nounZh: string;      // 名词中文
  gender: "m" | "n" | "f" | "pl";  // 阳性/中性/阴性/复数
  nominativ: string;   // 第一格（der/das/die）
  akkusativ: string;  // 第四格（den/das/die）
}

const articleNouns: ArticleNoun[] = [
  // 阳性（m）
  { id: 1, noun: "der Mann", nounZh: "男人", gender: "m", nominativ: "der Mann", akkusativ: "den Mann" },
  // 阴性（f）
  { id: 2, noun: "die Frau", nounZh: "女人", gender: "f", nominativ: "die Frau", akkusativ: "die Frau" },
  // 中性（n）
  { id: 3, noun: "das Kind", nounZh: "孩子", gender: "n", nominativ: "das Kind", akkusativ: "das Kind" },
  // 复数（pl）
  { id: 4, noun: "die Leute", nounZh: "人们", gender: "pl", nominativ: "die Leute", akkusativ: "die Leute" },
];

// 定冠词格数练习题目
interface ArticleCaseQuiz {
  id: number;
  noun: string;        // 名词
  nounZh: string;      // 名词中文
  gender: "m" | "n" | "f" | "pl";
  caseType: "nominativ" | "akkusativ";  // 第一格或第四格
  question: string;     // 题目（德语）
  correctAnswer: string; // 正确答案（定冠词+名词）
  options: string[];   // 所有选项
  correctIndex: number; // 正确答案索引
}

const articleCaseQuizzes: ArticleCaseQuiz[] = [];

const articleCaseTypes = ["nominativ", "akkusativ"] as const;
const genderLabels: Record<string, string> = { m: "阳性", n: "中性", f: "阴性", pl: "复数" };
const caseLabels: Record<string, string> = { nominativ: "第一格", akkusativ: "第四格" };

// 生成题目
articleNouns.forEach(noun => {
  articleCaseTypes.forEach(caseType => {
    const correctAnswer = caseType === "nominativ" ? noun.nominativ : noun.akkusativ;
    const question = `${noun.nounZh}（${genderLabels[noun.gender]}）${caseLabels[caseType]}`;

    // 生成干扰选项
    const otherNouns = articleNouns.filter(n => n.id !== noun.id);
    const wrongAnswers: string[] = [];
    while (wrongAnswers.length < 3 && otherNouns.length > 0) {
      const randomIdx = Math.floor(Math.random() * otherNouns.length);
      const wrongNoun = otherNouns[randomIdx];
      const wrongAnswer = caseType === "nominativ" ? wrongNoun.nominativ : wrongNoun.akkusativ;
      if (!wrongAnswers.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
        wrongAnswers.push(wrongAnswer);
      }
      otherNouns.splice(randomIdx, 1);
    }

    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(correctAnswer);

    articleCaseQuizzes.push({
      id: articleCaseQuizzes.length + 1,
      noun: noun.noun,
      nounZh: noun.nounZh,
      gender: noun.gender,
      caseType,
      question,
      correctAnswer,
      options: allOptions,
      correctIndex
    });
  });
});

const verbList = ["kommen", "sein", "heißen", "arbeiten", "wohnen"] as const;

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
  // 题目选择功能
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  // 对话模式相关状态
  const [quizMode, setQuizMode] = useState<"sentence" | "dialog" | "vocab" | "time" | "pronoun" | "pronoun3rd" | "verb" | "articleCase">("sentence");
  const [currentDialogQuiz, setCurrentDialogQuiz] = useState<DialogQuiz | null>(null);
  const [dialogWrongBook, setDialogWrongBook] = useState<DialogQuiz[]>([]);
  const [vocabWrongBook, setVocabWrongBook] = useState<Sentence[]>([]);
  const [currentVocabQuiz, setCurrentVocabQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 时刻模式相关状态
  const [timeQuizType, setTimeQuizType] = useState<"german" | "chinese">("german");
  const [timeSubType, setTimeSubType] = useState<"all" | "hour" | "half" | "quarter" | "special">("all");
  const [timeWrongBook, setTimeWrongBook] = useState<Sentence[]>([]);
  const [currentTimeQuiz, setCurrentTimeQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 特殊时刻题目（多正确答案）
  const [currentTimeSpecialQuiz, setCurrentTimeSpecialQuiz] = useState<TimeSpecialQuiz | null>(null);
  // 人称代词模式相关状态
  const [pronounQuizType, setPronounQuizType] = useState<"german" | "chinese">("german");
  const [pronounWrongBook, setPronounWrongBook] = useState<Sentence[]>([]);
  const [currentPronounQuiz, setCurrentPronounQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 人称代词（第3人称）模式相关状态
  const [pronoun3rdQuizType, setPronoun3rdQuizType] = useState<"german" | "chinese">("german");
  const [pronoun3rdWrongBook, setPronoun3rdWrongBook] = useState<Sentence[]>([]);
  const [currentPronoun3rdQuiz, setCurrentPronoun3rdQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 动词变位模式相关状态
  const [verbQuizType, setVerbQuizType] = useState<"german" | "chinese">("german");
  const [verbType, setVerbType] = useState<typeof verbList[number]>("kommen");
  const [verbWrongBook, setVerbWrongBook] = useState<Sentence[]>([]);
  const [seinWrongBook, setSeinWrongBook] = useState<Sentence[]>([]);
  const [currentVerbQuiz, setCurrentVerbQuiz] = useState<{ question: Sentence; options: Sentence[] } | null>(null);
  // 定冠词格数练习相关状态
  const [articleCaseQuizType, setArticleCaseQuizType] = useState<"all" | "m" | "n" | "f" | "pl">("all");
  const [articleCaseSubType, setArticleCaseSubType] = useState<"all" | "nominativ" | "akkusativ">("all");
  const [articleCaseWrongBook, setArticleCaseWrongBook] = useState<ArticleCaseQuiz[]>([]);
  const [currentArticleCaseQuiz, setCurrentArticleCaseQuiz] = useState<ArticleCaseQuiz | null>(null);

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

  // 从 localStorage 加载人称代词错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pronounWrongBook");
      if (saved) {
        try {
          setPronounWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载人称代词错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存人称代词错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (pronounWrongBook.length > 0) {
        localStorage.setItem("pronounWrongBook", JSON.stringify(pronounWrongBook));
      } else {
        localStorage.removeItem("pronounWrongBook");
      }
    }
  }, [pronounWrongBook]);

  // 从 localStorage 加载人称代词（第3人称）错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pronoun3rdWrongBook");
      if (saved) {
        try {
          setPronoun3rdWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载人称代词（第3人称）错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存人称代词（第3人称）错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pronoun3rdWrongBook", JSON.stringify(pronoun3rdWrongBook));
    }
  }, [pronoun3rdWrongBook]);

  // 从 localStorage 加载定冠词格数错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("articleCaseWrongBook");
      if (saved) {
        try {
          setArticleCaseWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载定冠词格数错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存定冠词格数错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("articleCaseWrongBook", JSON.stringify(articleCaseWrongBook));
    }
  }, [articleCaseWrongBook]);

  // 清空人称代词错题本
  const clearPronounWrongBook = () => {
    if (confirm("确定要清空人称代词错题本吗？")) {
      setPronounWrongBook([]);
      localStorage.removeItem("pronounWrongBook");
    }
  };

  // 清空人称代词（第3人称）错题本
  const clearPronoun3rdWrongBook = () => {
    if (confirm("确定要清空人称代词（第3人称）错题本吗？")) {
      setPronoun3rdWrongBook([]);
      localStorage.removeItem("pronoun3rdWrongBook");
    }
  };

  // 清空定冠词格数错题本
  const clearArticleCaseWrongBook = () => {
    if (confirm("确定要清空定冠词和名词格数错题本吗？")) {
      setArticleCaseWrongBook([]);
      localStorage.removeItem("articleCaseWrongBook");
    }
  };

  // 从 localStorage 加载动词变位错题本
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("verbWrongBook");
      if (saved) {
        try {
          setVerbWrongBook(JSON.parse(saved));
        } catch (e) {
          console.error("加载动词变位错题本失败:", e);
        }
      }
    }
  }, []);

  // 保存动词变位错题本到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (verbWrongBook.length > 0) {
        localStorage.setItem("verbWrongBook", JSON.stringify(verbWrongBook));
      } else {
        localStorage.removeItem("verbWrongBook");
      }
    }
  }, [verbWrongBook]);

  // 清空动词变位错题本
  const clearVerbWrongBook = () => {
    if (confirm("确定要清空动词变位错题本吗？")) {
      setVerbWrongBook([]);
      localStorage.removeItem("verbWrongBook");
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
        } else if (quizMode === "time" && (currentTimeQuiz || currentTimeSpecialQuiz)) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateTimeQuiz();
          }
        } else if (quizMode === "pronoun" && currentPronounQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generatePronounQuiz();
          }
        } else if (quizMode === "pronoun3rd" && currentPronoun3rdQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generatePronoun3rdQuiz();
          }
        } else if (quizMode === "articleCase" && currentArticleCaseQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateArticleCaseQuiz();
          }
        } else if (quizMode === "verb" && currentVerbQuiz) {
          if (currentQuestionCount >= quizCount) {
            setQuizFinished(true);
          } else {
            generateVerbQuiz();
          }
        } else if (quizMode === "sentence" && currentQuiz) {
          generateQuiz();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, currentQuiz, currentVocabQuiz, currentDialogQuiz, currentTimeQuiz, currentPronounQuiz, currentPronoun3rdQuiz, currentVerbQuiz, quizMode, currentQuestionCount, quizCount]);

  const filteredSentences = category === "all"
    ? sentences
    : sentences.filter(s => s.category === category);

  // 生成题目
  const generateQuiz = () => {
    // 如果用户选择了题目，则只从选择的题目中抽取；否则使用所有筛选后的题目
    const available = selectedQuestions.length > 0
      ? filteredSentences.filter(s => selectedQuestions.includes(s.id))
      : filteredSentences;

    if (available.length < 4) {
      alert("该分类至少需要4个句子");
      return;
    }

    // 如果选择的题目数量不足4个，给出提示
    if (selectedQuestions.length > 0 && available.length < 4) {
      alert(`已选题目不足4道，当前已选${available.length}道，请至少选择4道题目`);
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

    // 如果选择特殊时刻类型（14点15分），直接生成特殊题目
    if (timeSubType === "special") {
      if (timeSpecialQuizzes.length > 0) {
        const specialIdx = Math.floor(Math.random() * timeSpecialQuizzes.length);
        const specialQuiz = timeSpecialQuizzes[specialIdx];
        // 打乱选项：把正确答案和干扰项合并后随机排序
        const allOptions = [specialQuiz.correctAnswer, ...specialQuiz.wrongAnswers];
        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
        // 记录正确答案在打乱后的索引
        const correctIndex = shuffledOptions.indexOf(specialQuiz.correctAnswer);
        setCurrentTimeSpecialQuiz({
          ...specialQuiz,
          options: shuffledOptions,
          correctIndex: correctIndex
        });
        setCurrentTimeQuiz(null);
        setSelectedIndex(null);
        setQuizResult(null);
        setQuizStarted(true);
        setCurrentQuestionCount(prev => prev + 1);
      }
      return;
    }

    // 根据子类型筛选时刻数据
    let available = timeExpressions;
    if (timeSubType !== "all") {
      available = timeExpressions.filter(s => s.category === timeSubType);
    }

    // 如果筛选后数据不足4条，返回全部数据
    if (available.length < 4) {
      available = timeExpressions;
    }

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
    setCurrentTimeSpecialQuiz(null); // 清空特殊题目
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成人称代词题目
  const generatePronounQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const available = personalPronouns;
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
    setCurrentPronounQuiz({ question, options });
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成人称代词（第3人称）题目
  const generatePronoun3rdQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const available = personalPronouns3rd;
    const idx = Math.floor(Math.random() * available.length);
    const question = available[idx];

    // 生成错误选项 - 过滤掉与正确答案德语相同的选项
    const wrong: Sentence[] = [];
    const others = available.filter(s => s.id !== question.id && s.german !== question.german);
    while (wrong.length < 3 && others.length > 0) {
      const r = Math.floor(Math.random() * others.length);
      wrong.push(others[r]);
      others.splice(r, 1);
    }

    const options = [question, ...wrong].sort(() => Math.random() - 0.5);
    setCurrentPronoun3rdQuiz({ question, options });
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成定冠词格数题目
  const generateArticleCaseQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    // 根据子类型筛选
    let available = articleCaseQuizzes;
    if (articleCaseQuizType !== "all") {
      available = available.filter(q => q.gender === articleCaseQuizType);
    }
    if (articleCaseSubType !== "all") {
      available = available.filter(q => q.caseType === articleCaseSubType);
    }

    // 如果筛选后数据不足，随机返回
    if (available.length < 4) {
      available = articleCaseQuizzes;
    }

    const idx = Math.floor(Math.random() * available.length);
    const quiz = available[idx];

    setCurrentArticleCaseQuiz(quiz);
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成动词变位题目
  const generateVerbQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    // 根据verbType选择对应的动词数据
    const available = verbConjugationData[verbType];
    const idx = Math.floor(Math.random() * available.length);
    const question = available[idx];

    // 解析正确句子，获取人称代词和剩余部分
    const parts = question.german.split(" ");
    const pronoun = parts[0]; // ich/du/wir/ihr/Sie
    const restOfSentence = parts.slice(2).join(" "); // 剩余部分（去掉动词）

    // 动词变位错误映射 - 生成4个错误选项
    const verbWrongMap: Record<string, Record<string, string[]>> = {
      kommen: {
        "ich": ["kommt", "kommst", "kommen", "komme"],
        "du": ["komme", "kommt", "kommst", "kommen"],
        "wir": ["kommt", "kommst", "komme", "kommt"],
        "ihr": ["komme", "kommt", "kommst", "kommen"],
        "Sie": ["kommt", "kommst", "komme", "kommt"],
      },
      sein: {
        "ich": ["bist", "ist", "sind", "seid"],
        "du": ["bin", "ist", "bist", "sind"],
        "wir": ["bist", "ist", "bin", "seid"],
        "ihr": ["bin", "bist", "sind", "bin"],
        "Sie": ["bist", "ist", "sind", "seid"],
      },
      heißen: {
        "ich": ["heißt", "heißen", "heißt", "heiße"],
        "du": ["heiße", "heißen", "heißt", "heißen"],
        "wir": ["heißt", "heißen", "heiße", "heißt"],
        "ihr": ["heiße", "heißt", "heißen", "heiße"],
        "Sie": ["heißt", "heißen", "heiße", "heißen"],
      },
      arbeiten: {
        "ich": ["arbeitest", "arbeitet", "arbeiten", "arbeitest"],
        "du": ["arbeite", "arbeitet", "arbeitest", "arbeiten"],
        "wir": ["arbeitest", "arbeitet", "arbeite", "arbeitet"],
        "ihr": ["arbeite", "arbeitest", "arbeitet", "arbeiten"],
        "Sie": ["arbeitest", "arbeitet", "arbeite", "arbeitest"],
      },
      wohnen: {
        "ich": ["wohnst", "wohnt", "wohnen", "wohne"],
        "du": ["wohne", "wohnt", "wohnst", "wohnen"],
        "wir": ["wohnst", "wohnt", "wohne", "wohnt"],
        "ihr": ["wohne", "wohnst", "wohnt", "wohnen"],
        "Sie": ["wohnst", "wohnt", "wohne", "wohnst"],
      },
    };

    const wrongVerbs = verbWrongMap[verbType]?.[pronoun] || [];

    // 获取正确的动词形式（从句子中提取）
    const correctVerb = parts[1]; // 例如 "komme" 从 "Ich komme aus China."

    // 生成选项：正确变形 + 多个错误变形（确保有4个以上选项）
    const options: Sentence[] = [];

    // 添加正确选项
    options.push({
      id: 1,
      german: question.german,
      chinese: question.chinese,
      category: "correct"
    });

    // 确保至少有3个错误选项（共4个选项）
    const requiredWrongCount = 3;
    let availableWrongVerbs: string[] = [];

    // 首先从当前人称的错误列表中过滤掉正确答案
    const filteredWrongVerbs = wrongVerbs.filter(v => v !== correctVerb);
    availableWrongVerbs = [...filteredWrongVerbs];

    // 如果错误选项不够，从其他人称形式补充
    if (availableWrongVerbs.length < requiredWrongCount) {
      const allForms = verbWrongMap[verbType];
      for (const key in allForms) {
        if (availableWrongVerbs.length >= requiredWrongCount) break;
        const forms = allForms[key];
        for (const form of forms) {
          // 排除正确答案
          if (form !== correctVerb && !availableWrongVerbs.includes(form) && availableWrongVerbs.length < requiredWrongCount) {
            availableWrongVerbs.push(form);
          }
        }
      }
    }

    // 再次过滤确保没有正确答案
    availableWrongVerbs = availableWrongVerbs.filter(v => v !== correctVerb);

    // 添加错误选项
    availableWrongVerbs.slice(0, requiredWrongCount).forEach((wrongVerb, i) => {
      options.push({
        id: 100 + i,
        german: `${pronoun} ${wrongVerb} ${restOfSentence}`,
        chinese: question.chinese,
        category: "wrong"
      });
    });

    // 随机打乱选项顺序
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    setCurrentVerbQuiz({ question, options: shuffledOptions });
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
    } else if (quizMode === "pronoun") {
      generatePronounQuiz();
    } else if (quizMode === "pronoun3rd") {
      generatePronoun3rdQuiz();
    } else if (quizMode === "articleCase") {
      generateArticleCaseQuiz();
    } else if (quizMode === "verb") {
      generateVerbQuiz();
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
    if (quizResult !== null) return;

    // 检查是否是特殊时刻题目
    if (currentTimeSpecialQuiz) {
      // 使用索引判断正确答案
      const isCorrect = index === currentTimeSpecialQuiz.correctIndex;
      console.log("选择的索引:", index);
      console.log("正确答案索引:", currentTimeSpecialQuiz.correctIndex);
      console.log("是否正确:", isCorrect);
      setSelectedIndex(index);
      setQuizResult(isCorrect ? "correct" : "wrong");
      playSound(isCorrect ? "correct" : "wrong");

      if (!isCorrect) {
        // 特殊题目答错不加入错题本
      } else {
        setCorrectCount(prev => prev + 1);
      }

      if (currentQuestionCount >= quizCount) {
        setTimeout(() => setQuizFinished(true), 500);
      }
      return;
    }

    // 普通时刻题目
    if (!currentTimeQuiz) return;
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

  // 人称代词模式 - 选择答案
  const handlePronounSelect = (index: number) => {
    if (quizResult !== null || !currentPronounQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentPronounQuiz.options[index];
    const isCorrect = selectedOption.id === currentPronounQuiz.question.id;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setPronounWrongBook(prev => {
        if (prev.some(s => s.id === currentPronounQuiz.question.id)) return prev;
        return [...prev, currentPronounQuiz.question];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  // 人称代词（第3人称）模式 - 选择答案
  const handlePronoun3rdSelect = (index: number) => {
    if (quizResult !== null || !currentPronoun3rdQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentPronoun3rdQuiz.options[index];
    const isCorrect = selectedOption.id === currentPronoun3rdQuiz.question.id;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setPronoun3rdWrongBook(prev => {
        if (prev.some(s => s.id === currentPronoun3rdQuiz.question.id)) return prev;
        return [...prev, currentPronoun3rdQuiz.question];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  // 定冠词格数模式 - 选择答案
  const handleArticleCaseSelect = (index: number) => {
    if (quizResult !== null || !currentArticleCaseQuiz) return;
    setSelectedIndex(index);
    const isCorrect = index === currentArticleCaseQuiz.correctIndex;
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setArticleCaseWrongBook(prev => {
        if (prev.some(q => q.id === currentArticleCaseQuiz.id)) return prev;
        return [...prev, currentArticleCaseQuiz];
      });
    } else {
      setCorrectCount(prev => prev + 1);
    }

    if (currentQuestionCount >= quizCount) {
      setTimeout(() => setQuizFinished(true), 500);
    }
  };

  // 动词变位模式 - 选择答案
  const handleVerbSelect = (index: number) => {
    if (quizResult !== null || !currentVerbQuiz) return;
    setSelectedIndex(index);
    const selectedOption = currentVerbQuiz.options[index];
    const isCorrect = selectedOption.id === 1; // 正确选项的id为1
    setQuizResult(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      // 保存错题到错题本
      setVerbWrongBook(prev => {
        if (prev.some(s => s.id === currentVerbQuiz.question.id)) return prev;
        return [...prev, currentVerbQuiz.question];
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
            onClick={() => { setQuizMode("vocab"); setQuizStarted(false); setShowWrongBook(false); setSelectedQuestions([]); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "vocab" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            疑问词
          </button>
          <button
            onClick={() => { setQuizMode("time"); setQuizStarted(false); setShowWrongBook(false); setSelectedQuestions([]); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "time" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            时刻
          </button>
          <button
            onClick={() => { setQuizMode("dialog"); setQuizStarted(false); setShowWrongBook(false); setSelectedQuestions([]); }}
            className={`px-4 py-2 rounded-full text-sm ${quizMode === "dialog" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
          >
            对话练习
          </button>
        </div>

        {/* 语法分类 */}
        <div className="flex justify-center mb-4">
          <select
            value={quizMode === "pronoun" || quizMode === "pronoun3rd" || quizMode === "verb" ? quizMode : ""}
            onChange={(e) => {
              if (e.target.value) {
                setQuizMode(e.target.value as "pronoun" | "pronoun3rd" | "verb");
                setQuizStarted(false);
                setShowWrongBook(false);
                setSelectedQuestions([]);
              }
            }}
            className="px-4 py-2 rounded-full text-sm bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">选择语法练习...</option>
            <option value="pronoun">语法1: 人称代词（第1人称和第2人称）</option>
            <option value="pronoun3rd">语法10: 人称代词（第3人称）</option>
            <option value="verb">语法2: 动词变位（第1人称和第2人称）</option>
            <option value="articleCase">语法11: 定冠词和名词（第一格/第四格）</option>
          </select>
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

        {/* 时刻模式：子类型选择 */}
        {quizMode === "time" && (
          <div className="flex justify-center mb-4">
            <select
              value={timeSubType}
              onChange={(e) => { setTimeSubType(e.target.value as "all" | "hour" | "half" | "quarter" | "special"); setQuizStarted(false); }}
              className="px-4 py-2 rounded-full text-sm bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">全部时刻</option>
              <option value="hour">整点</option>
              <option value="half">半点</option>
              <option value="quarter">刻（15分/45分）</option>
              <option value="special">14点15分专项</option>
            </select>
          </div>
        )}

        {/* 人称代词模式：题型选择 */}
        {quizMode === "pronoun" && (
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => { setPronounQuizType("german"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${pronounQuizType === "german" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看中文选德语
            </button>
            <button
              onClick={() => { setPronounQuizType("chinese"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${pronounQuizType === "chinese" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看德语选中文
            </button>
          </div>
        )}

        {/* 人称代词（第3人称）模式：题型选择 */}
        {quizMode === "pronoun3rd" && (
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => { setPronoun3rdQuizType("german"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${pronoun3rdQuizType === "german" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看中文选德语
            </button>
            <button
              onClick={() => { setPronoun3rdQuizType("chinese"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${pronoun3rdQuizType === "chinese" ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
            >
              看德语选中文
            </button>
          </div>
        )}

        {/* 定冠词格数模式：词性和格选择 */}
        {quizMode === "articleCase" && (
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <select
              value={articleCaseQuizType}
              onChange={(e) => { setArticleCaseQuizType(e.target.value as "all" | "m" | "n" | "f" | "pl"); setQuizStarted(false); }}
              className="px-4 py-2 rounded-full text-sm bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">全部词性</option>
              <option value="m">阳性</option>
              <option value="n">中性</option>
              <option value="f">阴性</option>
              <option value="pl">复数</option>
            </select>
            <select
              value={articleCaseSubType}
              onChange={(e) => { setArticleCaseSubType(e.target.value as "all" | "nominativ" | "akkusativ"); setQuizStarted(false); }}
              className="px-4 py-2 rounded-full text-sm bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">全部格</option>
              <option value="nominativ">第一格</option>
              <option value="akkusativ">第四格</option>
            </select>
          </div>
        )}

        {/* 动词变位模式：动词选择 */}
        {quizMode === "verb" && (
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {verbList.map(verb => (
              <button
                key={verb}
                onClick={() => { setVerbType(verb); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${verbType === verb ? "bg-orange-500 text-white" : "bg-white text-gray-600"}`}
              >
                {verb}
              </button>
            ))}
          </div>
        )}

        {/* 动词变位模式：题型选择 - 已简化为一种模式 */}
        {/* {quizMode === "verb" && (
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => { setVerbQuizType("german"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${verbQuizType === "german" ? "bg-orange-500 text-white" : "bg-white text-gray-600"}`}
            >
              看中文选德语
            </button>
            <button
              onClick={() => { setVerbQuizType("chinese"); setQuizStarted(false); }}
              className={`px-4 py-2 rounded-full text-sm ${verbQuizType === "chinese" ? "bg-orange-500 text-white" : "bg-white text-gray-600"}`}
            >
              看德语选中文
            </button>
          </div>
        )} */}

        {/* 句子模式：分类筛选 */}
        {quizMode === "sentence" && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setQuizStarted(false); setSelectedQuestions([]); }}
                className={`px-3 py-1 rounded-full text-xs ${category === cat.id ? "bg-pink-500 text-white" : "bg-white text-gray-600"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* 答题数量选择 */}
        {!quizStarted && !quizFinished && quizMode === "sentence" && (
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

        {/* 题目选择功能 - 仅在句子模式下显示 */}
        {!quizStarted && !quizFinished && quizMode === "sentence" && (
          <div className="mb-4">
            <button
              onClick={() => setShowQuestionSelector(!showQuestionSelector)}
              className={`px-4 py-2 rounded-full text-sm ${showQuestionSelector ? "bg-pink-500 text-white" : "bg-white text-gray-700 border"}`}
            >
              {showQuestionSelector ? "隐藏题目列表" : `选择题目${selectedQuestions.length > 0 ? ` (已选${selectedQuestions.length}题)` : ""}`}
            </button>

            {/* 题目选择列表 */}
            {showQuestionSelector && (
              <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 max-h-80 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">
                    当前分类: {categories.find(c => c.id === category)?.name || "全部"} ({filteredSentences.length}题)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedQuestions(filteredSentences.map(s => s.id))}
                      className="text-xs text-pink-500 hover:text-pink-700"
                    >
                      全选
                    </button>
                    <button
                      onClick={() => setSelectedQuestions([])}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      清空
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredSentences.map(sentence => (
                    <label
                      key={sentence.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(sentence.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestions([...selectedQuestions, sentence.id]);
                          } else {
                            setSelectedQuestions(selectedQuestions.filter(id => id !== sentence.id));
                          }
                        }}
                        className="w-4 h-4 text-pink-500 rounded"
                      />
                      <span className="text-sm">{sentence.german}</span>
                      <span className="text-xs text-gray-400">- {sentence.chinese}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
            📚 错题本 ({quizMode === "dialog" ? dialogWrongBook.length : quizMode === "vocab" ? vocabWrongBook.length : quizMode === "time" ? timeWrongBook.length : quizMode === "pronoun" ? pronounWrongBook.length : quizMode === "pronoun3rd" ? pronoun3rdWrongBook.length : quizMode === "articleCase" ? articleCaseWrongBook.length : quizMode === "verb" ? verbWrongBook.length : wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {quizMode === "dialog" ? "对话错题本" : quizMode === "vocab" ? "疑问词错题本" : quizMode === "time" ? "时刻错题本" : quizMode === "pronoun" ? "人称代词错题本" : quizMode === "pronoun3rd" ? "人称代词（第3人称）错题本" : quizMode === "articleCase" ? "定冠词和名词格数错题本" : quizMode === "verb" ? `动词${verbType}变位错题本` : "错题本"}
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
              ) : quizMode === "pronoun" ? (
                pronounWrongBook.length > 0 && (
                  <button onClick={clearPronounWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : quizMode === "pronoun3rd" ? (
                pronoun3rdWrongBook.length > 0 && (
                  <button onClick={clearPronoun3rdWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : quizMode === "articleCase" ? (
                articleCaseWrongBook.length > 0 && (
                  <button onClick={clearArticleCaseWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
                )
              ) : quizMode === "verb" ? (
                verbWrongBook.length > 0 && (
                  <button onClick={clearVerbWrongBook} className="text-sm text-red-500 hover:text-red-700">清空</button>
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
            ) : quizMode === "pronoun" ? (
              pronounWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {pronounWrongBook.map(s => (
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
            ) : quizMode === "pronoun3rd" ? (
              pronoun3rdWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {pronoun3rdWrongBook.map(s => (
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
            ) : quizMode === "articleCase" ? (
              articleCaseWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {articleCaseWrongBook.map(q => (
                    <div key={q.id} className="bg-red-50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-gray-600">{q.question}</p>
                        <p className="font-bold text-gray-800">{q.correctAnswer}</p>
                      </div>
                      <button onClick={() => speak(q.correctAnswer)} className="p-2 bg-amber-100 rounded-full">🔊</button>
                    </div>
                  ))}
                </div>
              )
            ) : quizMode === "verb" ? (
              verbWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题</p>
              ) : (
                <div className="space-y-3">
                  {verbWrongBook.map(s => (
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
              <h2 className="text-xl font-bold mb-4">
                {timeSubType === "special" ? "14点15分时刻练习" : "德语时刻练习"}
              </h2>
              <p className="text-gray-600 mb-6">
                {timeSubType === "special"
                  ? "14点15分（下午2:15）的德语表达"
                  : timeQuizType === "german" ? "看中文，选择正确的德语时刻表达" : "看德语时刻表达，选择正确的中文"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">
                {timeSubType === "special"
                  ? `共 ${timeSpecialQuizzes.length} 道14点15分题目`
                  : `共 ${timeSubType === "all" ? timeExpressions.length : timeExpressions.filter(s => s.category === timeSubType).length} 个时刻表达`}
              </p>
            </div>
          ) : quizMode === "pronoun" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-xl font-bold mb-4">德语人称代词练习</h2>
              <p className="text-gray-600 mb-6">
                {pronounQuizType === "german" ? "看中文，选择正确的德语人称代词" : "看德语人称代词，选择正确的中文"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {personalPronouns.length} 个人称代词</p>
            </div>
          ) : quizMode === "pronoun3rd" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-xl font-bold mb-4">德语人称代词（第3人称）练习</h2>
              <p className="text-gray-600 mb-6">
                {pronoun3rdQuizType === "german" ? "看中文，选择正确的德语人称代词（第3人称）" : "看德语人称代词，选择正确的中文"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {personalPronouns3rd.length} 个人称代词</p>
            </div>
          ) : quizMode === "articleCase" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-bold mb-4">德语定冠词和名词格数练习</h2>
              <p className="text-gray-600 mb-6">
                看中文名词，选择正确的定冠词和名词形式<br />
                <span className="text-sm">
                  {articleCaseQuizType === "all" ? "全部词性" : genderLabels[articleCaseQuizType]} +
                  {articleCaseSubType === "all" ? " 全部格" : caseLabels[articleCaseSubType]}
                </span>
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">
                共 {
                  (() => {
                    let count = articleCaseQuizzes.length;
                    if (articleCaseQuizType !== "all") {
                      count = articleCaseQuizzes.filter(q => q.gender === articleCaseQuizType).length;
                    }
                    if (articleCaseSubType !== "all") {
                      count = articleCaseQuizzes.filter(q => q.caseType === articleCaseSubType).length;
                    }
                    return count;
                  })()
                } 道题目
              </p>
            </div>
          ) : quizMode === "verb" ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🚗</div>
              <h2 className="text-xl font-bold mb-4">动词{verbType}变位练习</h2>
              <p className="text-gray-600 mb-6">
                {verbQuizType === "german" ? `看中文，选择正确的动词${verbType}变位` : "看德语动词变位，选择正确的中文"}
              </p>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600"
              >
                开始答题 ({quizCount}题)
              </button>
              <p className="text-gray-400 text-sm mt-4">共 {verbConjugationData[verbType].length} 个动词变位</p>
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
        ) : quizMode === "time" && currentTimeSpecialQuiz ? (
          /* 特殊时刻答题界面（多正确答案） */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                请选择正确的德语时刻表达
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {currentTimeSpecialQuiz.questionZh}
              </p>
              <button
                onClick={() => speak(currentTimeSpecialQuiz.questionZh.replace("（下午2:15）", ""))}
                className="mt-2 px-4 py-2 bg-amber-100 rounded-full text-sm"
              >
                🔊 播放题目
              </button>
            </div>

            <div className="space-y-3">
              {currentTimeSpecialQuiz.options?.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = idx === currentTimeSpecialQuiz.correctIndex;

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
                    onClick={() => handleTimeSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center px-4">
                      <span>{option}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); speak(option); }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          🔊
                        </button>
                        {showResult && isCorrect && <span>✓</span>}
                        {showResult && isSelected && !isCorrect && <span>✗</span>}
                      </div>
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
                {quizResult !== "correct" && (
                  <div className="mt-2 text-sm text-gray-600">
                    正确答案：
                    <p className="text-green-600">{currentTimeSpecialQuiz.options?.[currentTimeSpecialQuiz.correctIndex ?? 0]}</p>
                  </div>
                )}
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
        ) : quizMode === "pronoun" && currentPronounQuiz ? (
          /* 人称代词答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {pronounQuizType === "german" ? "请选择正确的德语人称代词" : "请选择正确的中文"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {pronounQuizType === "german" ? currentPronounQuiz.question.chinese : currentPronounQuiz.question.german}
              </p>
              {pronounQuizType === "german" && (
                <button onClick={() => speak(currentPronounQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                  🔊 播放发音
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentPronounQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === currentPronounQuiz.question.id;

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
                    onClick={() => handlePronounSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{pronounQuizType === "german" ? option.german : option.chinese}</span>
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
                      generatePronounQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        ) : quizMode === "pronoun3rd" && currentPronoun3rdQuiz ? (
          /* 人称代词（第3人称）答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {pronoun3rdQuizType === "german" ? "请选择正确的德语人称代词（第3人称）" : "请选择正确的中文"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {pronoun3rdQuizType === "german" ? currentPronoun3rdQuiz.question.chinese : currentPronoun3rdQuiz.question.german}
              </p>
              {pronoun3rdQuizType === "german" && (
                <button onClick={() => speak(currentPronoun3rdQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                  🔊 播放发音
                </button>
              )}
            </div>

            <div className="space-y-3">
              {currentPronoun3rdQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === currentPronoun3rdQuiz.question.id;

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
                    onClick={() => handlePronoun3rdSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{pronoun3rdQuizType === "german" ? option.german : option.chinese}</span>
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
                      generatePronoun3rdQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        ) : quizMode === "articleCase" && currentArticleCaseQuiz ? (
          /* 定冠词格数答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                请选择正确的定冠词+名词形式
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {currentArticleCaseQuiz.question}
              </p>
            </div>

            <div className="space-y-3">
              {currentArticleCaseQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = idx === currentArticleCaseQuiz.correctIndex;

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
                    onClick={() => handleArticleCaseSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center px-4">
                      <span>{option}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); speak(option); }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          🔊
                        </button>
                        {showResult && isCorrect && <span>✓</span>}
                        {showResult && isSelected && !isCorrect && <span>✗</span>}
                      </div>
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
                {quizResult !== "correct" && (
                  <div className="mt-2 text-sm text-gray-600">
                    正确答案：
                    <p className="text-green-600">{currentArticleCaseQuiz.options[currentArticleCaseQuiz.correctIndex]}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (currentQuestionCount >= quizCount) {
                      setQuizFinished(true);
                    } else {
                      generateArticleCaseQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white rounded-full"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        ) : quizMode === "verb" && currentVerbQuiz ? (
          /* 动词变位答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">
                请选择正确的动词变位
              </p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {currentVerbQuiz.question.chinese}
              </p>
              <button onClick={() => speak(currentVerbQuiz.question.german)} className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                🔊 播放发音
              </button>
            </div>

            <div className="space-y-3">
              {currentVerbQuiz.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const showResult = quizResult !== null;
                const isCorrect = option.id === 1; // id 1 is always correct

                let btnClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                if (showResult) {
                  if (isCorrect) btnClass += "bg-green-500 text-white";
                  else if (isSelected) btnClass += "bg-red-500 text-white";
                  else btnClass += "bg-gray-100 text-gray-400";
                } else {
                  btnClass += isSelected ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700 border-2 border-orange-200 hover:bg-orange-100";
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVerbSelect(idx)}
                    disabled={showResult}
                    className={btnClass}
                  >
                    <div className="flex justify-between px-4">
                      <span>{option.german}</span>
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
                      generateVerbQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-orange-500 text-white rounded-full"
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
            ? timeSubType === "special"
              ? `共 ${timeSpecialQuizzes.length} 道14点15分题目`
              : `共 ${timeSubType === "all" ? timeExpressions.length : timeExpressions.filter(s => s.category === timeSubType).length} 个时刻表达`
            : quizMode === "pronoun"
              ? `共 ${personalPronouns.length} 个人称代词`
              : quizMode === "verb"
                ? `共 ${verbConjugationData[verbType].length} 个动词变位`
                : quizMode === "dialog"
                  ? `共 ${dialogQuizzes.length} 道对话题`
                  : `共 ${sentences.length} 个基础句子`}
      </footer>
    </div>
  );
}
