'use client';

import { useState, useEffect, useRef } from 'react';
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

// 德语人称代词（第3人称）数据
const personalPronouns3rd = [
  { id: 101, german: "er", chinese: "他" },
  { id: 102, german: "sie", chinese: "她" },
  { id: 103, german: "es", chinese: "它" },
  { id: 104, german: "sie", chinese: "他们/她们/它们" },
];

// 德语时间数据
const germanTimeData = [
  {
    id: 1,
    time: "14:15",
    hour: 14,
    minute: 15,
    answers: [
      "Es ist Viertel nach zwei.",
      "Es ist fünfzehn nach zwei.",
      "Es ist vierzehn Uhr fünfzehn.",
      "Es ist zwei Uhr fünfzehn.",
    ],
    chinese: "14点15分（下午2点15分）",
  },
];

// 德语职业和身份数据
const occupationsData = [
  { id: 1, german: "der Arzt", chinese: "医生" },
  { id: 2, german: "der Beruf", chinese: "职业" },
  { id: 3, german: "die Firma", chinese: "公司" },
  { id: 4, german: "der Lehrer", chinese: "教师" },
  { id: 5, german: "der Professor", chinese: "教授" },
  { id: 6, german: "die Hausfrau", chinese: "家庭主妇" },
  { id: 7, german: "der Schüler", chinese: "学生" },
  { id: 8, german: "der Student", chinese: "大学生" },
];

// 德语天气数据
const weatherData = [
  { id: 1, german: "das Wetter", chinese: "天气" },
  { id: 2, german: "der Wind", chinese: "风" },
  { id: 3, german: "der Regen", chinese: "雨" },
  { id: 4, german: "der Schnee", chinese: "雪" },
  { id: 5, german: "die Luft", chinese: "空气" },
  { id: 6, german: "die Sonne", chinese: "太阳" },
  { id: 7, german: "der Stern", chinese: "星星" },
  { id: 8, german: "der Mond", chinese: "月亮" },
];

// 德语自然数据
const natureData = [
  { id: 1, german: "der Berg", chinese: "山" },
  { id: 2, german: "das Feld", chinese: "田野" },
  { id: 3, german: "der Wald", chinese: "森林" },
  { id: 4, german: "das Meer", chinese: "海" },
  { id: 5, german: "der See", chinese: "湖" },
  { id: 6, german: "der Fluss", chinese: "河流" },
  { id: 7, german: "der Himmel", chinese: "天空" },
  { id: 8, german: "die Natur", chinese: "自然" },
];

// 德语动植物数据
const animalPlantData = [
  { id: 1, german: "die Pflanze", chinese: "植物" },
  { id: 2, german: "der Baum", chinese: "树" },
  { id: 3, german: "die Blume", chinese: "花" },
  { id: 4, german: "das Tier", chinese: "动物" },
  { id: 5, german: "der Hund", chinese: "狗" },
  { id: 6, german: "die Katze", chinese: "猫" },
  { id: 7, german: "der Vogel", chinese: "鸟" },
  { id: 8, german: "das Pferd", chinese: "马" },
];

// 德语公共机构数据
const publicInstitutionData = [
  { id: 1, german: "die Kirche", chinese: "教堂" },
  { id: 2, german: "das Krankenhaus", chinese: "医院" },
  { id: 3, german: "die Polizei", chinese: "警察局" },
  { id: 4, german: "die Post", chinese: "邮局" },
  { id: 5, german: "das Rathaus", chinese: "市政厅" },
  { id: 6, german: "die Stadt", chinese: "城市" },
  { id: 7, german: "die Straße", chinese: "街道" },
  { id: 8, german: "der Platz", chinese: "广场" },
];

// 德语商业生活娱乐数据
const businessEntertainmentData = [
  { id: 1, german: "die Bäckerei", chinese: "面包店" },
  { id: 2, german: "das Geschäft", chinese: "商店" },
  { id: 3, german: "das Kaufhaus", chinese: "百货商场" },
  { id: 4, german: "das Kino", chinese: "电影院" },
  { id: 5, german: "der Markt", chinese: "市场" },
  { id: 6, german: "der Park", chinese: "公园" },
  { id: 7, german: "das Hotel", chinese: "酒店" },
  { id: 8, german: "das Schloss", chinese: "城堡" },
];

// 德语轨道交通数据
const railTransportData = [
  { id: 1, german: "die Bahn", chinese: "火车/铁路" },
  { id: 2, german: "der Zug", chinese: "火车" },
  { id: 3, german: "der Bahnhof", chinese: "火车站" },
  { id: 4, german: "die Haltestelle", chinese: "站点" },
  { id: 5, german: "der Fahrplan", chinese: "时刻表" },
  { id: 6, german: "die Abfahrt", chinese: "出发" },
  { id: 7, german: "die Ankunft", chinese: "到达" },
  { id: 8, german: "die Fahrkarte", chinese: "车票" },
];

// 德语日常交通数据
const dailyTransportData = [
  { id: 1, german: "das Auto", chinese: "汽车" },
  { id: 2, german: "der Wagen", chinese: "车辆" },
  { id: 3, german: "das Taxi", chinese: "出租车" },
  { id: 4, german: "der Bus", chinese: "公交车" },
  { id: 5, german: "das Fahrrad", chinese: "自行车" },
  { id: 6, german: "die Autobahn", chinese: "高速公路" },
  { id: 7, german: "das Flugzeug", chinese: "飞机" },
  { id: 8, german: "das Schiff", chinese: "船" },
];

// 德语抽象概念（1）数据
const abstractConcept1Data = [
  { id: 1, german: "die Frage", chinese: "问题" },
  { id: 2, german: "der Geburtstag", chinese: "生日" },
  { id: 3, german: "das Geld", chinese: "钱" },
  { id: 4, german: "die Liebe", chinese: "爱情" },
  { id: 5, german: "der Freund", chinese: "朋友" },
  { id: 6, german: "der Name", chinese: "名字" },
  { id: 7, german: "der Schmerz", chinese: "疼痛" },
  { id: 8, german: "die Sprache", chinese: "语言" },
];

// 定冠词和名词数据（第1格和第4格）
const definiteArticlesData = [
  {
    id: 1,
    noun: "Mann",
    nounChinese: "男人",
    nominative: "der Mann",
    nominativeChinese: "第1格",
    accusative: "den Mann",
    accusativeChinese: "第4格",
  },
  {
    id: 2,
    noun: "Frau",
    nounChinese: "女人",
    nominative: "die Frau",
    nominativeChinese: "第1格",
    accusative: "die Frau",
    accusativeChinese: "第4格",
  },
  {
    id: 3,
    noun: "Kind",
    nounChinese: "孩子",
    nominative: "das Kind",
    nominativeChinese: "第1格",
    accusative: "das Kind",
    accusativeChinese: "第4格",
  },
  {
    id: 4,
    noun: "Leute",
    nounChinese: "人们",
    nominative: "die Leute",
    nominativeChinese: "第1格",
    accusative: "die Leute",
    accusativeChinese: "第4格",
  },
];

// 动词变位数据
const verbConjugationData: Record<string, { id: number; verb: string; chinese: string }[]> = {
  kommen: [
    { id: 1, verb: "komme", chinese: "我来" },
    { id: 2, verb: "kommst", chinese: "你来" },
    { id: 3, verb: "kommen", chinese: "我们来" },
    { id: 4, verb: "kommt", chinese: "你们来" },
    { id: 5, verb: "kommen", chinese: "您来" },
  ],
  sein: [
    { id: 201, verb: "bin", chinese: "我是" },
    { id: 202, verb: "bist", chinese: "你是" },
    { id: 203, verb: "sind", chinese: "我们是" },
    { id: 204, verb: "seid", chinese: "你们是" },
    { id: 205, verb: "sind", chinese: "您是" },
  ],
  heißen: [
    { id: 301, verb: "heiße", chinese: "我叫" },
    { id: 302, verb: "heißt", chinese: "你叫" },
    { id: 303, verb: "heißen", chinese: "我们叫" },
    { id: 304, verb: "heißt", chinese: "你们叫" },
    { id: 305, verb: "heißen", chinese: "您叫" },
  ],
  arbeiten: [
    { id: 401, verb: "arbeite", chinese: "我工作" },
    { id: 402, verb: "arbeitest", chinese: "你工作" },
    { id: 403, verb: "arbeiten", chinese: "我们工作" },
    { id: 404, verb: "arbeitet", chinese: "你们工作" },
    { id: 405, verb: "arbeiten", chinese: "您工作" },
  ],
  wohnen: [
    { id: 501, verb: "wohne", chinese: "我住" },
    { id: 502, verb: "wohnst", chinese: "你住" },
    { id: 503, verb: "wohnen", chinese: "我们住" },
    { id: 504, verb: "wohnt", chinese: "你们住" },
    { id: 505, verb: "wohnen", chinese: "您住" },
  ],
};

const verbList = ["kommen", "sein", "heißen", "arbeiten", "wohnen"] as const;
type VerbType = typeof verbList[number];

const verbChineseNames: Record<VerbType, string> = {
 kommen: "来",
 sein: "是",
 heißen: "叫",
 arbeiten: "工作",
 wohnen: "住",
};

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
  const [contentType, setContentType] = useState<"number" | "questionWord" | "pronoun" | "pronoun3rd" | "verb" | "time" | "article" | "occupation" | "weather" | "nature" | "animalPlant" | "publicInstitution" | "businessEntertainment" | "railTransport" | "dailyTransport" | "abstractConcept1">("number");
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
  const [quizCount, setQuizCount] = useState<5 | 10 | 15 | 20>(5);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // 疑问词相关
  const [questionWordIndex, setQuestionWordIndex] = useState(0);
  const [questionWordQuiz, setQuestionWordQuiz] = useState<typeof questionWords[0] | null>(null);
  const [questionWordWrongBook, setQuestionWordWrongBook] = useState<typeof questionWords>([]);

  // 人称代词相关
  const [pronounIndex, setPronounIndex] = useState(0);
  const [pronounQuiz, setPronounQuiz] = useState<typeof personalPronouns[0] | null>(null);
  const [pronounWrongBook, setPronounWrongBook] = useState<typeof personalPronouns>([]);

  // 人称代词（第3人称）相关
  const [pronoun3rdIndex, setPronoun3rdIndex] = useState(0);
  const [pronoun3rdQuiz, setPronoun3rdQuiz] = useState<typeof personalPronouns3rd[0] | null>(null);
  const [pronoun3rdWrongBook, setPronoun3rdWrongBook] = useState<typeof personalPronouns3rd>([]);

  // 动词变位相关
  const [verbIndex, setVerbIndex] = useState(0);
  const [verbType, setVerbType] = useState<VerbType>("kommen");
  const [verbQuiz, setVerbQuiz] = useState<typeof verbConjugationData["kommen"][0] | null>(null);
  const [verbWrongBook, setVerbWrongBook] = useState<typeof verbConjugationData["kommen"]>([]);

  // 德语时间相关
  const [timeIndex, setTimeIndex] = useState(0);
  const [timeQuiz, setTimeQuiz] = useState<typeof germanTimeData[0] | null>(null);
  const [timeWrongBook, setTimeWrongBook] = useState<typeof germanTimeData>([]);

  // 定冠词和名词相关
  const [articleIndex, setArticleIndex] = useState(0);
  const [articleQuiz, setArticleQuiz] = useState<typeof definiteArticlesData[0] | null>(null);
  const [articleWrongBook, setArticleWrongBook] = useState<typeof definiteArticlesData>([]);
  const [articleCaseType, setArticleCaseType] = useState<"nominative" | "accusative">("nominative");

  // 职业相关
  const [occupationIndex, setOccupationIndex] = useState(0);
  const [occupationQuiz, setOccupationQuiz] = useState<typeof occupationsData[0] | null>(null);
  const [occupationWrongBook, setOccupationWrongBook] = useState<typeof occupationsData>([]);

  // 天气相关
  const [weatherIndex, setWeatherIndex] = useState(0);
  const [weatherQuiz, setWeatherQuiz] = useState<typeof weatherData[0] | null>(null);
  const [weatherWrongBook, setWeatherWrongBook] = useState<typeof weatherData>([]);

  // 自然相关
  const [natureIndex, setNatureIndex] = useState(0);
  const [natureQuiz, setNatureQuiz] = useState<typeof natureData[0] | null>(null);
  const [natureWrongBook, setNatureWrongBook] = useState<typeof natureData>([]);

  // 动植物相关
  const [animalPlantIndex, setAnimalPlantIndex] = useState(0);
  const [animalPlantQuiz, setAnimalPlantQuiz] = useState<typeof animalPlantData[0] | null>(null);
  const [animalPlantWrongBook, setAnimalPlantWrongBook] = useState<typeof animalPlantData>([]);

  // 公共机构相关
  const [publicInstitutionIndex, setPublicInstitutionIndex] = useState(0);
  const [publicInstitutionQuiz, setPublicInstitutionQuiz] = useState<typeof publicInstitutionData[0] | null>(null);
  const [publicInstitutionWrongBook, setPublicInstitutionWrongBook] = useState<typeof publicInstitutionData>([]);

  // 商业生活娱乐相关
  const [businessEntertainmentIndex, setBusinessEntertainmentIndex] = useState(0);
  const [businessEntertainmentQuiz, setBusinessEntertainmentQuiz] = useState<typeof businessEntertainmentData[0] | null>(null);
  const [businessEntertainmentWrongBook, setBusinessEntertainmentWrongBook] = useState<typeof businessEntertainmentData>([]);

  // 轨道交通相关
  const [railTransportIndex, setRailTransportIndex] = useState(0);
  const [railTransportQuiz, setRailTransportQuiz] = useState<typeof railTransportData[0] | null>(null);
  const [railTransportWrongBook, setRailTransportWrongBook] = useState<typeof railTransportData>([]);

  // 日常交通相关
  const [dailyTransportIndex, setDailyTransportIndex] = useState(0);
  const [dailyTransportQuiz, setDailyTransportQuiz] = useState<typeof dailyTransportData[0] | null>(null);
  const [dailyTransportWrongBook, setDailyTransportWrongBook] = useState<typeof dailyTransportData>([]);

  // 抽象概念（1）相关
  const [abstractConcept1Index, setAbstractConcept1Index] = useState(0);
  const [abstractConcept1Quiz, setAbstractConcept1Quiz] = useState<typeof abstractConcept1Data[0] | null>(null);
  const [abstractConcept1WrongBook, setAbstractConcept1WrongBook] = useState<typeof abstractConcept1Data>([]);

  // 用于控制Enter键的延迟，防止同时触发提交和下一题
  const [canPressEnter, setCanPressEnter] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // 空格键获取输入焦点
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 当前数字
  const currentNumber = germanNumbers[currentIndex];
  // 当前疑问词
  const currentQuestionWord = questionWords[questionWordIndex];
  // 当前人称代词
  const currentPronoun = personalPronouns[pronounIndex];
  // 当前人称代词（第3人称）
  const currentPronoun3rd = personalPronouns3rd[pronoun3rdIndex];
  // 当前动词变位
  const currentVerb = verbConjugationData[verbType][verbIndex];
  // 当前德语时间
  const currentTime = germanTimeData[timeIndex];
  // 当前定冠词和名词
  const currentArticle = definiteArticlesData[articleIndex];
  // 当前职业
  const currentOccupation = occupationsData[occupationIndex];
  // 当前天气
  const currentWeather = weatherData[weatherIndex];
  // 当前自然
  const currentNature = natureData[natureIndex];
  // 当前动植物
  const currentAnimalPlant = animalPlantData[animalPlantIndex];
  // 当前公共机构
  const currentPublicInstitution = publicInstitutionData[publicInstitutionIndex];
  // 当前商业生活娱乐
  const currentBusinessEntertainment = businessEntertainmentData[businessEntertainmentIndex];
  // 当前轨道交通
  const currentRailTransport = railTransportData[railTransportIndex];
  // 当前日常交通
  const currentDailyTransport = dailyTransportData[dailyTransportIndex];
  // 当前抽象概念（1）
  const currentAbstractConcept1 = abstractConcept1Data[abstractConcept1Index];

  // 开始答题
  const startQuiz = () => {
    // 第一次开始，重置计数
    setCurrentQuestionCount(0);
    setCorrectCount(0);
    setQuizFinished(false);
    generateQuiz();
  };

  // 生成答题题目
  const generateQuiz = () => {
    // 检查是否已完成答题数量
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    if (contentType === "questionWord") {
      const randomIndex = Math.floor(Math.random() * questionWords.length);
      setQuestionWordQuiz(questionWords[randomIndex]);
    } else if (contentType === "pronoun") {
      const randomIndex = Math.floor(Math.random() * personalPronouns.length);
      setPronounQuiz(personalPronouns[randomIndex]);
    } else if (contentType === "pronoun3rd") {
      const randomIndex = Math.floor(Math.random() * personalPronouns3rd.length);
      setPronoun3rdQuiz(personalPronouns3rd[randomIndex]);
    } else if (contentType === "verb") {
      const available = verbConjugationData[verbType];
      const randomIndex = Math.floor(Math.random() * available.length);
      setVerbQuiz(available[randomIndex]);
    } else if (contentType === "time") {
      const randomIndex = Math.floor(Math.random() * germanTimeData.length);
      setTimeQuiz(germanTimeData[randomIndex]);
    } else if (contentType === "article") {
      const randomIndex = Math.floor(Math.random() * definiteArticlesData.length);
      setArticleQuiz(definiteArticlesData[randomIndex]);
    } else if (contentType === "occupation") {
      const randomIndex = Math.floor(Math.random() * occupationsData.length);
      setOccupationQuiz(occupationsData[randomIndex]);
    } else if (contentType === "weather") {
      const randomIndex = Math.floor(Math.random() * weatherData.length);
      setWeatherQuiz(weatherData[randomIndex]);
    } else if (contentType === "nature") {
      const randomIndex = Math.floor(Math.random() * natureData.length);
      setNatureQuiz(natureData[randomIndex]);
    } else if (contentType === "animalPlant") {
      const randomIndex = Math.floor(Math.random() * animalPlantData.length);
      setAnimalPlantQuiz(animalPlantData[randomIndex]);
    } else if (contentType === "publicInstitution") {
      const randomIndex = Math.floor(Math.random() * publicInstitutionData.length);
      setPublicInstitutionQuiz(publicInstitutionData[randomIndex]);
    } else if (contentType === "businessEntertainment") {
      const randomIndex = Math.floor(Math.random() * businessEntertainmentData.length);
      setBusinessEntertainmentQuiz(businessEntertainmentData[randomIndex]);
    } else if (contentType === "railTransport") {
      const randomIndex = Math.floor(Math.random() * railTransportData.length);
      setRailTransportQuiz(railTransportData[randomIndex]);
    } else if (contentType === "dailyTransport") {
      const randomIndex = Math.floor(Math.random() * dailyTransportData.length);
      setDailyTransportQuiz(dailyTransportData[randomIndex]);
    } else if (contentType === "abstractConcept1") {
      const randomIndex = Math.floor(Math.random() * abstractConcept1Data.length);
      setAbstractConcept1Quiz(abstractConcept1Data[randomIndex]);
    } else {
      const randomIndex = Math.floor(Math.random() * germanNumbers.length);
      setQuizNumber(germanNumbers[randomIndex]);
    }
    setUserInput("");
    setQuizResult(null);
    setQuizStarted(true);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 提交答案
  const submitAnswer = () => {
    if (!userInput.trim()) return;
    if (!canPressEnter) return; // 防止重复提交

    // 暂时禁用Enter键，防止同时触发提交和下一题
    setCanPressEnter(false);
    setTimeout(() => setCanPressEnter(true), 500);

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
    } else if (contentType === "pronoun3rd" && pronoun3rdQuiz) {
      // 支持小写
      const userAns = userInput.trim().toLowerCase();
      const correctAns = pronoun3rdQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setPronoun3rdWrongBook(prev => prev.some(w => w.id === pronoun3rdQuiz.id) ? prev : [...prev, pronoun3rdQuiz]);
      }
    } else if (contentType === "verb" && verbQuiz) {
      // 支持小写
      const userAns = userInput.trim().toLowerCase();
      const correctAns = verbQuiz.verb.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setVerbWrongBook(prev => prev.some(w => w.id === verbQuiz.id) ? prev : [...prev, verbQuiz]);
      }
    } else if (contentType === "time" && timeQuiz) {
      // 时间答案支持多个正确写法
      const userAns = userInput.trim().toLowerCase();
      isCorrect = timeQuiz.answers.some(ans => ans.toLowerCase() === userAns);
      if (!isCorrect) {
        setTimeWrongBook(prev => prev.some(t => t.id === timeQuiz.id) ? prev : [...prev, timeQuiz]);
      }
    } else if (contentType === "article" && articleQuiz) {
      // 定冠词和名词答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = articleCaseType === "nominative" ? articleQuiz.nominative.toLowerCase() : articleQuiz.accusative.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setArticleWrongBook(prev => prev.some(a => a.id === articleQuiz.id) ? prev : [...prev, articleQuiz]);
      }
    } else if (contentType === "occupation" && occupationQuiz) {
      // 职业答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = occupationQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setOccupationWrongBook(prev => prev.some(o => o.id === occupationQuiz.id) ? prev : [...prev, occupationQuiz]);
      }
    } else if (contentType === "weather" && weatherQuiz) {
      // 天气答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = weatherQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setWeatherWrongBook(prev => prev.some(w => w.id === weatherQuiz.id) ? prev : [...prev, weatherQuiz]);
      }
    } else if (contentType === "nature" && natureQuiz) {
      // 自然答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = natureQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setNatureWrongBook(prev => prev.some(n => n.id === natureQuiz.id) ? prev : [...prev, natureQuiz]);
      }
    } else if (contentType === "animalPlant" && animalPlantQuiz) {
      // 动植物答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = animalPlantQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setAnimalPlantWrongBook(prev => prev.some(a => a.id === animalPlantQuiz.id) ? prev : [...prev, animalPlantQuiz]);
      }
    } else if (contentType === "publicInstitution" && publicInstitutionQuiz) {
      // 公共机构答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = publicInstitutionQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setPublicInstitutionWrongBook(prev => prev.some(p => p.id === publicInstitutionQuiz.id) ? prev : [...prev, publicInstitutionQuiz]);
      }
    } else if (contentType === "businessEntertainment" && businessEntertainmentQuiz) {
      // 商业生活娱乐答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = businessEntertainmentQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setBusinessEntertainmentWrongBook(prev => prev.some(b => b.id === businessEntertainmentQuiz.id) ? prev : [...prev, businessEntertainmentQuiz]);
      }
    } else if (contentType === "railTransport" && railTransportQuiz) {
      // 轨道交通答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = railTransportQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setRailTransportWrongBook(prev => prev.some(r => r.id === railTransportQuiz.id) ? prev : [...prev, railTransportQuiz]);
      }
    } else if (contentType === "dailyTransport" && dailyTransportQuiz) {
      // 日常交通答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = dailyTransportQuiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setDailyTransportWrongBook(prev => prev.some(d => d.id === dailyTransportQuiz.id) ? prev : [...prev, dailyTransportQuiz]);
      }
    } else if (contentType === "abstractConcept1" && abstractConcept1Quiz) {
      // 抽象概念（1）答案
      const userAns = userInput.trim().toLowerCase();
      const correctAns = abstractConcept1Quiz.german.toLowerCase();
      isCorrect = userAns === correctAns;
      if (!isCorrect) {
        setAbstractConcept1WrongBook(prev => prev.some(a => a.id === abstractConcept1Quiz.id) ? prev : [...prev, abstractConcept1Quiz]);
      }
    } else if (quizNumber) {
      isCorrect = userInput.trim().toLowerCase() === quizNumber.german.toLowerCase();
      if (!isCorrect) {
        setWrongBook(prev => prev.some(n => n.digit === quizNumber.digit) ? prev : [...prev, quizNumber]);
      }
    }

    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
    }
  };

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 没有显示结果时，按回车键提交答案
      if (e.key === "Enter" && quizResult === null && quizStarted && !showWrongBook && !quizFinished && canPressEnter) {
        submitAnswer();
      }
      // 显示结果后，按回车键进入下一题
      if (e.key === "Enter" && quizResult !== null && quizStarted && !showWrongBook && !quizFinished && canPressEnter) {
        if (currentQuestionCount >= quizCount) {
          setQuizFinished(true);
        } else {
          generateQuiz();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, quizStarted, showWrongBook, quizFinished, currentQuestionCount, quizCount, canPressEnter]);

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
            {contentType === "questionWord" ? "❓ 德语疑问词拼写" : contentType === "pronoun" ? "👤 人称代词拼写" : contentType === "pronoun3rd" ? "👥 人称代词（第3人称）拼写" : contentType === "verb" ? `🔄 动词${verbType}变位拼写` : contentType === "time" ? "⏰ 德语时间拼写" : contentType === "article" ? "📝 定冠词和名词拼写" : contentType === "occupation" ? "👔 职业和身份拼写" : contentType === "weather" ? "🌤️ 天气拼写" : contentType === "nature" ? "🌲 自然拼写" : contentType === "animalPlant" ? "🐾 动植物拼写" : contentType === "publicInstitution" ? "🏛️ 公共机构拼写" : contentType === "businessEntertainment" ? "🏪 商业/生活娱乐拼写" : contentType === "railTransport" ? "🚇 轨道交通拼写" : contentType === "dailyTransport" ? "🚗 日常交通拼写" : contentType === "abstractConcept1" ? "💡 抽象概念（1）拼写" : "🔢 德语数字拼写"}
          </h1>
          <p className="mt-1 opacity-90">
            {contentType === "questionWord" ? "疑问词单词听写练习" : contentType === "pronoun" ? "人称代词单词听写练习" : contentType === "pronoun3rd" ? "人称代词（第3人称）单词听写练习" : contentType === "verb" ? `动词${verbType}变位听写练习` : contentType === "time" ? "德语时间表达听写练习" : contentType === "article" ? "定冠词和名词（第1格和第4格）听写练习" : contentType === "occupation" ? "职业和身份单词听写练习" : contentType === "weather" ? "天气单词听写练习" : contentType === "nature" ? "自然单词听写练习" : contentType === "animalPlant" ? "动植物单词听写练习" : contentType === "publicInstitution" ? "公共机构单词听写练习" : contentType === "businessEntertainment" ? "商业/生活娱乐单词听写练习" : contentType === "railTransport" ? "轨道交通单词听写练习" : contentType === "dailyTransport" ? "日常交通单词听写练习" : contentType === "abstractConcept1" ? "抽象概念（1）单词听写练习" : "0-9 数字单词听写练习"}
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
          <button
            onClick={() => { setContentType("time"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "time" ? "bg-amber-500 text-white" : "bg-white text-gray-600"}`}
          >
            ⏰ 时间
          </button>
          <button
            onClick={() => { setContentType("occupation"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "occupation" ? "bg-emerald-500 text-white" : "bg-white text-gray-600"}`}
          >
            👔 职业
          </button>
          <button
            onClick={() => { setContentType("weather"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "weather" ? "bg-sky-500 text-white" : "bg-white text-gray-600"}`}
          >
            🌤️ 天气
          </button>
          <button
            onClick={() => { setContentType("nature"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "nature" ? "bg-green-500 text-white" : "bg-white text-gray-600"}`}
          >
            🌲 自然
          </button>
          <button
            onClick={() => { setContentType("animalPlant"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "animalPlant" ? "bg-amber-500 text-white" : "bg-white text-gray-600"}`}
          >
            🐾 动植物
          </button>
          <button
            onClick={() => { setContentType("publicInstitution"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "publicInstitution" ? "bg-indigo-500 text-white" : "bg-white text-gray-600"}`}
          >
            🏛️ 公共机构
          </button>
          <button
            onClick={() => { setContentType("businessEntertainment"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "businessEntertainment" ? "bg-rose-500 text-white" : "bg-white text-gray-600"}`}
          >
            🏪 商业/生活娱乐
          </button>
          <button
            onClick={() => { setContentType("railTransport"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "railTransport" ? "bg-cyan-500 text-white" : "bg-white text-gray-600"}`}
          >
            🚇 轨道交通
          </button>
          <button
            onClick={() => { setContentType("dailyTransport"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "dailyTransport" ? "bg-orange-500 text-white" : "bg-white text-gray-600"}`}
          >
            🚗 日常交通
          </button>
          <button
            onClick={() => { setContentType("abstractConcept1"); setMode("quiz"); setQuizStarted(false); setShowWrongBook(false); }}
            className={`px-4 py-2 rounded-full text-sm ${contentType === "abstractConcept1" ? "bg-violet-500 text-white" : "bg-white text-gray-600"}`}
          >
            💡 抽象概念（1）
          </button>
        </div>

        {/* 语法分类 */}
        <div className="flex justify-center mb-4">
          <select
            value={contentType === "number" || contentType === "questionWord" || contentType === "time" || contentType === "article" || contentType === "occupation" || contentType === "weather" || contentType === "nature" || contentType === "animalPlant" || contentType === "publicInstitution" || contentType === "businessEntertainment" || contentType === "railTransport" || contentType === "dailyTransport" || contentType === "abstractConcept1" ? "" : contentType}
            onChange={(e) => { setContentType(e.target.value as "pronoun" | "pronoun3rd" | "verb" | "time" | "article" | "occupation" | "weather" | "nature" | "animalPlant" | "publicInstitution" | "businessEntertainment" | "railTransport" | "dailyTransport" | "abstractConcept1"); setMode("learn"); setQuizStarted(false); setShowWrongBook(false); }}
            className="px-4 py-2 rounded-full text-sm font-medium border-2 border-purple-200 bg-white text-gray-700 focus:outline-none focus:border-purple-400"
          >
            <option value="">选择语法类型</option>
            <option value="time">⏰ 德语时间表达</option>
            <option value="article">📝 定冠词和名词（第1格和第4格）</option>
            <option value="occupation">👔 职业和身份</option>
            <option value="weather">🌤️ 天气</option>
            <option value="nature">🌲 自然</option>
            <option value="animalPlant">🐾 动植物</option>
            <option value="publicInstitution">🏛️ 公共机构</option>
            <option value="businessEntertainment">🏪 商业/生活娱乐</option>
            <option value="railTransport">🚇 轨道交通</option>
            <option value="dailyTransport">🚗 日常交通</option>
            <option value="abstractConcept1">💡 抽象概念（1）</option>
            <option value="pronoun">语法1: 人称代词（第1人称和第2人称）</option>
            <option value="pronoun3rd">语法10: 人称代词（第3人称）</option>
            <option value="verb">语法2: 动词变位（第1人称和第2人称）</option>
          </select>
        </div>

        {/* 动词类型选择 */}
        {contentType === "verb" && (
          <div className="flex justify-center mb-4">
            <select
              value={verbType}
              onChange={(e) => { setVerbType(e.target.value as VerbType); setMode("learn"); setQuizStarted(false); setVerbIndex(0); }}
              className="px-4 py-2 rounded-full text-sm font-medium border-2 border-orange-200 bg-white text-gray-700 focus:outline-none focus:border-orange-400"
            >
              {verbList.map(verb => (
                <option key={verb} value={verb}>
                  {verb}（{verbChineseNames[verb]}）
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 定冠词和名词格选择 */}
        {contentType === "article" && (
          <div className="flex justify-center mb-4">
            <select
              value={articleCaseType}
              onChange={(e) => { setArticleCaseType(e.target.value as "nominative" | "accusative"); setMode("learn"); setQuizStarted(false); setArticleIndex(0); }}
              className="px-4 py-2 rounded-full text-sm font-medium border-2 border-teal-200 bg-white text-gray-700 focus:outline-none focus:border-teal-400"
            >
              <option value="nominative">第1格（Nominativ）</option>
              <option value="accusative">第4格（Akkusativ）</option>
            </select>
          </div>
        )}

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
            📚 错题本 ({contentType === "questionWord" ? questionWordWrongBook.length : contentType === "pronoun" ? pronounWrongBook.length : contentType === "pronoun3rd" ? pronoun3rdWrongBook.length : contentType === "verb" ? verbWrongBook.length : contentType === "time" ? timeWrongBook.length : contentType === "article" ? articleWrongBook.length : contentType === "occupation" ? occupationWrongBook.length : contentType === "weather" ? weatherWrongBook.length : contentType === "nature" ? natureWrongBook.length : contentType === "animalPlant" ? animalPlantWrongBook.length : contentType === "publicInstitution" ? publicInstitutionWrongBook.length : contentType === "businessEntertainment" ? businessEntertainmentWrongBook.length : contentType === "railTransport" ? railTransportWrongBook.length : contentType === "dailyTransport" ? dailyTransportWrongBook.length : contentType === "abstractConcept1" ? abstractConcept1WrongBook.length : wrongBook.length})
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
                      <div className="text-2xl font-bold text-gray-800">{word.verb}</div>
                      <div className="text-lg text-orange-600">{word.chinese}</div>
                      <button
                        onClick={() => speak(word.verb)}
                        className="mt-2 p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : contentType === "time" ? (
              timeWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {timeWrongBook.map((t) => (
                    <div key={t.id} className="bg-red-50 rounded-xl p-4">
                      <div className="text-xl font-bold text-gray-800 mb-2">{t.time}</div>
                      <div className="text-lg text-amber-600 mb-2">{t.chinese}</div>
                      {t.answers.map((ans, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-2 mb-1">
                          <span className="text-gray-800">{ans}</span>
                          <button
                            onClick={() => speak(ans)}
                            className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                          >
                            🔊
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            ) : contentType === "article" ? (
              articleWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {articleWrongBook.map((a) => (
                    <div key={a.id} className="bg-red-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-gray-800">{a.noun}</span>
                        <span className="text-lg text-teal-600">{a.nounChinese}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2 mb-1">
                        <span className="text-gray-600">第1格: </span>
                        <span className="text-gray-800">{a.nominative}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <span className="text-gray-600">第4格: </span>
                        <span className="text-gray-800">{a.accusative}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : contentType === "occupation" ? (
              occupationWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {occupationWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-emerald-600">{word.chinese}</div>
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
            ) : contentType === "weather" ? (
              weatherWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {weatherWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-sky-600">{word.chinese}</div>
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
            ) : contentType === "nature" ? (
              natureWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {natureWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-green-600">{word.chinese}</div>
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
            ) : contentType === "animalPlant" ? (
              animalPlantWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {animalPlantWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-amber-600">{word.chinese}</div>
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
            ) : contentType === "publicInstitution" ? (
              publicInstitutionWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {publicInstitutionWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-indigo-600">{word.chinese}</div>
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
            ) : contentType === "businessEntertainment" && mode === "learn" ? (
              businessEntertainmentWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {businessEntertainmentWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-rose-600">{word.chinese}</div>
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
            ) : contentType === "railTransport" && mode === "learn" ? (
              railTransportWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {railTransportWrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-cyan-600">{word.chinese}</div>
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
            ) : contentType === "dailyTransport" && mode === "learn" ? (
              dailyTransportWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {dailyTransportWrongBook.map((word) => (
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
            ) : contentType === "dailyTransport" && mode === "learn" ? (
              dailyTransportWrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {dailyTransportWrongBook.map((word) => (
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
            ) : contentType === "abstractConcept1" ? (
              abstractConcept1WrongBook.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {abstractConcept1WrongBook.map((word) => (
                    <div key={word.id} className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">{word.german}</div>
                      <div className="text-lg text-violet-600">{word.chinese}</div>
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
          ) : contentType === "pronoun3rd" ? (
            /* 人称代词（第3人称）学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl font-bold text-teal-600 mb-4">
                  {currentPronoun3rd.german}
                </div>
                <div className="text-3xl font-bold text-teal-600 mb-2">
                  {currentPronoun3rd.chinese}
                </div>
                <button
                  onClick={() => speak(currentPronoun3rd.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPronoun3rdIndex(i => Math.max(0, i - 1))}
                  disabled={pronoun3rdIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {pronoun3rdIndex + 1} / {personalPronouns3rd.length}
                </span>
                <button
                  onClick={() => setPronoun3rdIndex(i => Math.min(personalPronouns3rd.length - 1, i + 1))}
                  disabled={pronoun3rdIndex === personalPronouns3rd.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">人称代词（第3人称）总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {personalPronouns3rd.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-teal-600 w-8">{word.german}</span>
                        <span className="text-lg text-teal-600">{word.chinese}</span>
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
                  {currentVerb.verb}
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {currentVerb.chinese}
                </div>
                <button
                  onClick={() => speak(currentVerb.verb)}
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
                  {verbIndex + 1} / {verbConjugationData[verbType].length}
                </span>
                <button
                  onClick={() => setVerbIndex(i => Math.min(verbConjugationData[verbType].length - 1, i + 1))}
                  disabled={verbIndex === verbConjugationData[verbType].length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">动词{verbType}变位总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {verbConjugationData[verbType].map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-orange-600 w-32">{word.verb}</span>
                        <span className="text-lg text-orange-600">{word.chinese}</span>
                      </div>
                      <button
                        onClick={() => speak(word.verb)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : contentType === "time" ? (
            /* 德语时间学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl font-bold text-amber-600 mb-4">
                  {currentTime.time}
                </div>
                <div className="text-2xl font-bold text-amber-600 mb-2">
                  {currentTime.chinese}
                </div>
                <div className="mt-4 text-left bg-amber-50 rounded-xl p-4">
                  <p className="text-lg font-bold text-gray-800 mb-2">正确写法：</p>
                  {currentTime.answers.map((ans, idx) => (
                    <div key={idx} className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">{ans}</span>
                      <button
                        onClick={() => speak(ans)}
                        className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => speak(currentTime.answers[0])}
                  className="mt-4 px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setTimeIndex(i => Math.max(0, i - 1))}
                  disabled={timeIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {timeIndex + 1} / {germanTimeData.length}
                </span>
                <button
                  onClick={() => setTimeIndex(i => Math.min(germanTimeData.length - 1, i + 1))}
                  disabled={timeIndex === germanTimeData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">德语时间总表</h3>
                <div className="space-y-4">
                  {germanTimeData.map((t) => (
                    <div key={t.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-amber-600">{t.time}</span>
                        <span className="text-lg text-amber-600">{t.chinese}</span>
                      </div>
                      <div className="space-y-1">
                        {t.answers.map((ans, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-2">
                            <span className="text-gray-700">{ans}</span>
                            <button
                              onClick={() => speak(ans)}
                              className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                            >
                              🔊
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : contentType === "article" ? (
            /* 定冠词和名词学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-6xl font-bold text-teal-600 mb-4">
                  {currentArticle.noun}
                </div>
                <div className="text-2xl font-bold text-teal-600 mb-2">
                  {currentArticle.nounChinese}
                </div>
                <div className="mt-4 text-left bg-teal-50 rounded-xl p-4">
                  <p className="text-lg font-bold text-gray-800 mb-2">变格：</p>
                  <div className="bg-white rounded-lg p-3 mb-2">
                    <span className="text-gray-600">第1格（Nominativ）: </span>
                    <span className="text-xl font-bold text-gray-800">{currentArticle.nominative}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-gray-600">第4格（Akkusativ）: </span>
                    <span className="text-xl font-bold text-gray-800">{currentArticle.accusative}</span>
                  </div>
                </div>
                <button
                  onClick={() => speak(articleCaseType === "nominative" ? currentArticle.nominative : currentArticle.accusative)}
                  className="mt-4 px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setArticleIndex(i => Math.max(0, i - 1))}
                  disabled={articleIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {articleIndex + 1} / {definiteArticlesData.length}
                </span>
                <button
                  onClick={() => setArticleIndex(i => Math.min(definiteArticlesData.length - 1, i + 1))}
                  disabled={articleIndex === definiteArticlesData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">定冠词和名词总表</h3>
                <div className="space-y-4">
                  {definiteArticlesData.map((a) => (
                    <div key={a.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-teal-600">{a.noun}</span>
                        <span className="text-lg text-teal-600">{a.nounChinese}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2 mb-1">
                        <span className="text-gray-600">第1格: </span>
                        <span className="text-gray-800">{a.nominative}</span>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <span className="text-gray-600">第4格: </span>
                        <span className="text-gray-800">{a.accusative}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : contentType === "occupation" ? (
            /* 职业学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-emerald-600 mb-4">
                  {currentOccupation.german}
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {currentOccupation.chinese}
                </div>
                <button
                  onClick={() => speak(currentOccupation.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setOccupationIndex(i => Math.max(0, i - 1))}
                  disabled={occupationIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {occupationIndex + 1} / {occupationsData.length}
                </span>
                <button
                  onClick={() => setOccupationIndex(i => Math.min(occupationsData.length - 1, i + 1))}
                  disabled={occupationIndex === occupationsData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">职业和身份总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {occupationsData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-emerald-600">{word.german}</span>
                        <span className="text-lg text-emerald-600">{word.chinese}</span>
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
          ) : contentType === "weather" ? (
            /* 天气学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-sky-600 mb-4">
                  {currentWeather.german}
                </div>
                <div className="text-3xl font-bold text-sky-600 mb-2">
                  {currentWeather.chinese}
                </div>
                <button
                  onClick={() => speak(currentWeather.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setWeatherIndex(i => Math.max(0, i - 1))}
                  disabled={weatherIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {weatherIndex + 1} / {weatherData.length}
                </span>
                <button
                  onClick={() => setWeatherIndex(i => Math.min(weatherData.length - 1, i + 1))}
                  disabled={weatherIndex === weatherData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">天气总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {weatherData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-sky-600">{word.german}</span>
                        <span className="text-lg text-sky-600">{word.chinese}</span>
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
          ) : contentType === "nature" ? (
            /* 自然学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-green-600 mb-4">
                  {currentNature.german}
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {currentNature.chinese}
                </div>
                <button
                  onClick={() => speak(currentNature.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setNatureIndex(i => Math.max(0, i - 1))}
                  disabled={natureIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {natureIndex + 1} / {natureData.length}
                </span>
                <button
                  onClick={() => setNatureIndex(i => Math.min(natureData.length - 1, i + 1))}
                  disabled={natureIndex === natureData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">自然总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {natureData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-green-600">{word.german}</span>
                        <span className="text-lg text-green-600">{word.chinese}</span>
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
          ) : contentType === "animalPlant" ? (
            /* 动植物学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-amber-600 mb-4">
                  {currentAnimalPlant.german}
                </div>
                <div className="text-3xl font-bold text-amber-600 mb-2">
                  {currentAnimalPlant.chinese}
                </div>
                <button
                  onClick={() => speak(currentAnimalPlant.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setAnimalPlantIndex(i => Math.max(0, i - 1))}
                  disabled={animalPlantIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {animalPlantIndex + 1} / {animalPlantData.length}
                </span>
                <button
                  onClick={() => setAnimalPlantIndex(i => Math.min(animalPlantData.length - 1, i + 1))}
                  disabled={animalPlantIndex === animalPlantData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">动植物总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {animalPlantData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-amber-600">{word.german}</span>
                        <span className="text-lg text-amber-600">{word.chinese}</span>
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
          ) : contentType === "publicInstitution" ? (
            /* 公共机构学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-indigo-600 mb-4">
                  {currentPublicInstitution.german}
                </div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {currentPublicInstitution.chinese}
                </div>
                <button
                  onClick={() => speak(currentPublicInstitution.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPublicInstitutionIndex(i => Math.max(0, i - 1))}
                  disabled={publicInstitutionIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {publicInstitutionIndex + 1} / {publicInstitutionData.length}
                </span>
                <button
                  onClick={() => setPublicInstitutionIndex(i => Math.min(publicInstitutionData.length - 1, i + 1))}
                  disabled={publicInstitutionIndex === publicInstitutionData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">公共机构总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {publicInstitutionData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-indigo-600">{word.german}</span>
                        <span className="text-lg text-indigo-600">{word.chinese}</span>
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
          ) : contentType === "businessEntertainment" && mode === "learn" ? (
            /* 商业生活娱乐学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-rose-600 mb-4">
                  {currentBusinessEntertainment.german}
                </div>
                <div className="text-3xl font-bold text-rose-600 mb-2">
                  {currentBusinessEntertainment.chinese}
                </div>
                <button
                  onClick={() => speak(currentBusinessEntertainment.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setBusinessEntertainmentIndex(i => Math.max(0, i - 1))}
                  disabled={businessEntertainmentIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {businessEntertainmentIndex + 1} / {businessEntertainmentData.length}
                </span>
                <button
                  onClick={() => setBusinessEntertainmentIndex(i => Math.min(businessEntertainmentData.length - 1, i + 1))}
                  disabled={businessEntertainmentIndex === businessEntertainmentData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">商业/生活娱乐总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {businessEntertainmentData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-rose-600">{word.german}</span>
                        <span className="text-lg text-rose-600">{word.chinese}</span>
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
          ) : contentType === "railTransport" && mode === "learn" ? (
            /* 轨道交通学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-cyan-600 mb-4">
                  {currentRailTransport.german}
                </div>
                <div className="text-3xl font-bold text-cyan-600 mb-2">
                  {currentRailTransport.chinese}
                </div>
                <button
                  onClick={() => speak(currentRailTransport.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setRailTransportIndex(i => Math.max(0, i - 1))}
                  disabled={railTransportIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {railTransportIndex + 1} / {railTransportData.length}
                </span>
                <button
                  onClick={() => setRailTransportIndex(i => Math.min(railTransportData.length - 1, i + 1))}
                  disabled={railTransportIndex === railTransportData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">轨道交通总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {railTransportData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-cyan-600">{word.german}</span>
                        <span className="text-lg text-cyan-600">{word.chinese}</span>
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
          ) : contentType === "dailyTransport" && mode === "learn" ? (
            /* 日常交通学习 */
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
                <div className="text-5xl font-bold text-orange-600 mb-4">
                  {currentDailyTransport.german}
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {currentDailyTransport.chinese}
                </div>
                <button
                  onClick={() => speak(currentDailyTransport.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setDailyTransportIndex(i => Math.max(0, i - 1))}
                  disabled={dailyTransportIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  ← 上一位
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {dailyTransportIndex + 1} / {dailyTransportData.length}
                </span>
                <button
                  onClick={() => setDailyTransportIndex(i => Math.min(dailyTransportData.length - 1, i + 1))}
                  disabled={dailyTransportIndex === dailyTransportData.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                >
                  下一位 →
                </button>
              </div>

              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">日常交通总表</h3>
                <div className="grid grid-cols-2 gap-3">
                  {dailyTransportData.map((word) => (
                    <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-orange-600">{word.german}</span>
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
        ) : contentType === "abstractConcept1" && mode === "learn" ? (
          /* 抽象概念（1）学习 */
          <>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
              <div className="text-5xl font-bold text-violet-600 mb-4">
                {currentAbstractConcept1.german}
              </div>
              <div className="text-3xl font-bold text-violet-600 mb-2">
                {currentAbstractConcept1.chinese}
              </div>
              <button
                onClick={() => speak(currentAbstractConcept1.german)}
                className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
              >
                <span>🔊</span> 播放发音
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setAbstractConcept1Index(i => Math.max(0, i - 1))}
                disabled={abstractConcept1Index === 0}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                ← 上一位
              </button>
              <span className="px-4 py-2 text-gray-600">
                {abstractConcept1Index + 1} / {abstractConcept1Data.length}
              </span>
              <button
                onClick={() => setAbstractConcept1Index(i => Math.min(abstractConcept1Data.length - 1, i + 1))}
                disabled={abstractConcept1Index === abstractConcept1Data.length - 1}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                下一位 →
              </button>
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">抽象概念（1）总表</h3>
              <div className="grid grid-cols-2 gap-3">
                {abstractConcept1Data.map((word) => (
                  <div key={word.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-violet-600">{word.german}</span>
                      <span className="text-lg text-violet-600">{word.chinese}</span>
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

            {/* 答题数量选择 */}
            {!quizStarted && !showWrongBook && (
              <div className="flex justify-center gap-2 mb-6">
                <span className="text-sm text-gray-600 self-center">答题数量:</span>
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => { setQuizCount(count as 5|10|15|20); setQuizStarted(false); }}
                    className={`px-4 py-2 rounded-full text-sm ${
                      quizCount === count ? "bg-indigo-500 text-white" : "bg-white text-gray-600 border"
                    }`}
                  >
                    {count}题
                  </button>
                ))}
              </div>
            )}

            {!quizStarted ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-6">
                  {contentType === "questionWord" ? "❓" : contentType === "pronoun" ? "👤" : contentType === "pronoun3rd" ? "👥" : contentType === "verb" ? "🔄" : contentType === "time" ? "⏰" : contentType === "article" ? "📝" : contentType === "occupation" ? "👔" : contentType === "weather" ? "🌤️" : contentType === "nature" ? "🌲" : contentType === "animalPlant" ? "🐾" : contentType === "publicInstitution" ? "🏛️" : contentType === "businessEntertainment" ? "🏪" : contentType === "railTransport" ? "🚇" : contentType === "dailyTransport" ? "🚗" : contentType === "abstractConcept1" ? "💡" : "🔢"}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {contentType === "questionWord" ? "德语疑问词听写" : contentType === "pronoun" ? "人称代词听写" : contentType === "pronoun3rd" ? "人称代词（第3人称）听写" : contentType === "verb" ? `动词${verbType}变位听写` : contentType === "time" ? "德语时间听写" : contentType === "article" ? "定冠词和名词听写" : contentType === "occupation" ? "职业和身份听写" : contentType === "weather" ? "天气听写" : contentType === "nature" ? "自然听写" : contentType === "animalPlant" ? "动植物听写" : contentType === "publicInstitution" ? "公共机构听写" : contentType === "businessEntertainment" ? "商业/生活娱乐听写" : contentType === "railTransport" ? "轨道交通听写" : contentType === "dailyTransport" ? "日常交通听写" : contentType === "abstractConcept1" ? "抽象概念（1）听写" : "德语数字听写"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {contentType === "questionWord"
                    ? "听中文，写出德语疑问词"
                    : contentType === "pronoun"
                      ? "听中文，写出人称代词"
                      : contentType === "pronoun3rd"
                        ? "听中文，写出人称代词（第3人称）"
                        : contentType === "verb"
                          ? `听中文，写出动词${verbType}变位`
                          : contentType === "time"
                            ? "听时间，写出德语时间表达（任一正确写法均可）"
                            : contentType === "article"
                              ? `听中文，写出${articleCaseType === "nominative" ? "第1格" : "第4格"}的定冠词和名词`
                              : contentType === "occupation"
                                ? "听中文，写出德语职业词汇"
                                : contentType === "weather"
                                  ? "听中文，写出德语天气词汇"
                                  : contentType === "nature"
                                    ? "听中文，写出德语自然词汇"
                                    : contentType === "animalPlant"
                                      ? "听中文，写出德语动植物词汇"
                                      : contentType === "publicInstitution"
                                        ? "听中文，写出德语公共机构词汇"
                                        : contentType === "businessEntertainment"
                                          ? "听中文，写出德语商业/生活娱乐词汇"
                                          : contentType === "railTransport"
                                            ? "听中文，写出德语轨道交通词汇"
                                            : contentType === "dailyTransport"
                                              ? "听中文，写出德语日常交通词汇"
                                              : contentType === "abstractConcept1"
                                                ? "听中文，写出德语抽象概念（1）词汇"
                                                : quizType === "digitToWord" ? "听数字，写出德语单词" : "听德语单词，写出数字"}
                </p>
                <button
                  onClick={startQuiz}
                  className="px-8 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600 transition"
                >
                  开始答题
                </button>
              </div>
            ) : quizFinished ? (
              /* 答题完成 */
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-xl font-bold mb-4">练习完成!</h2>
                <div className="text-4xl font-bold text-indigo-500 mb-2">
                  {correctCount} / {quizCount}
                </div>
                <p className="text-gray-600 mb-6">
                  正确率: {Math.round((correctCount / quizCount) * 100)}%
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => { setQuizStarted(false); setQuizFinished(false); setCurrentQuestionCount(0); setCorrectCount(0); }}
                    className="px-6 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600"
                  >
                    重新开始
                  </button>
                  <button
                    onClick={() => { setShowWrongBook(true); }}
                    className="px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600"
                  >
                    查看错题
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* 进度显示 */}
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-500">
                    进度: {currentQuestionCount} / {quizCount} 题 | 正确: {correctCount} 题
                  </span>
                </div>

                {/* 题目 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {contentType === "questionWord"
                      ? "请写出这个中文对应的德语疑问词"
                      : contentType === "pronoun"
                        ? "请写出这个中文对应的人称代词"
                        : contentType === "pronoun3rd"
                          ? "请写出这个中文对应的人称代词（第3人称）"
                          : contentType === "verb"
                            ? "请写出这个中文对应的动词变位"
                            : contentType === "time"
                              ? "请写出这个时间的德语表达（任一正确写法均可）"
                              : contentType === "article"
                                ? `请写出这个中文对应的${articleCaseType === "nominative" ? "第1格" : "第4格"}定冠词和名词`
                                : contentType === "occupation"
                                  ? "请写出这个中文对应的德语职业词汇"
                                  : contentType === "businessEntertainment"
                                    ? "请写出这个中文对应的德语商业/生活娱乐词汇"
                                    : contentType === "railTransport"
                                      ? "请写出这个中文对应的德语轨道交通词汇"
                                      : contentType === "dailyTransport"
                                        ? "请写出这个中文对应的德语日常交通词汇"
                                        : contentType === "abstractConcept1"
                                          ? "请写出这个中文对应的德语抽象概念（1）词汇"
                                          : quizType === "digitToWord" ? "请写出这个数字的德语" : "请写出这个德语对应的数字"}
                  </p>
                  <div className={`text-6xl font-bold mb-4 ${contentType === "questionWord" ? "text-pink-600" : contentType === "pronoun" ? "text-purple-600" : contentType === "pronoun3rd" ? "text-teal-600" : contentType === "verb" ? "text-orange-600" : contentType === "time" ? "text-amber-600" : contentType === "article" ? "text-teal-600" : contentType === "occupation" ? "text-emerald-600" : contentType === "weather" ? "text-sky-600" : contentType === "nature" ? "text-green-600" : contentType === "animalPlant" ? "text-amber-600" : contentType === "publicInstitution" ? "text-indigo-600" : contentType === "businessEntertainment" ? "text-rose-600" : contentType === "railTransport" ? "text-cyan-600" : contentType === "dailyTransport" ? "text-orange-600" : contentType === "abstractConcept1" ? "text-violet-600" : "text-indigo-600"}`}>
                    {contentType === "questionWord"
                      ? questionWordQuiz?.chinese
                      : contentType === "pronoun"
                        ? pronounQuiz?.chinese
                        : contentType === "pronoun3rd"
                          ? pronoun3rdQuiz?.chinese
                          : contentType === "verb"
                            ? verbQuiz?.chinese
                            : contentType === "time"
                              ? timeQuiz?.time
                              : contentType === "article"
                                ? articleQuiz?.nounChinese
                                : contentType === "occupation"
                                  ? occupationQuiz?.chinese
                                  : contentType === "weather"
                                    ? weatherQuiz?.chinese
                                    : contentType === "nature"
                                      ? natureQuiz?.chinese
                                      : contentType === "animalPlant"
                                        ? animalPlantQuiz?.chinese
                                        : contentType === "publicInstitution"
                                          ? publicInstitutionQuiz?.chinese
                                          : contentType === "businessEntertainment"
                                            ? businessEntertainmentQuiz?.chinese
                                            : contentType === "railTransport"
                                              ? railTransportQuiz?.chinese
                                              : contentType === "dailyTransport"
                                                ? dailyTransportQuiz?.chinese
                                                : contentType === "abstractConcept1"
                                                  ? abstractConcept1Quiz?.chinese
                                                  : quizType === "digitToWord" ? quizNumber?.digit : quizNumber?.german}
                  </div>
                  <button
                    onClick={() => speak(contentType === "questionWord" ? questionWordQuiz?.german || "" : contentType === "pronoun" ? pronounQuiz?.german || "" : contentType === "pronoun3rd" ? pronoun3rdQuiz?.german || "" : contentType === "verb" ? verbQuiz?.verb || "" : contentType === "time" ? timeQuiz?.answers[0] || "" : contentType === "article" ? (articleCaseType === "nominative" ? articleQuiz?.nominative || "" : articleQuiz?.accusative || "") : contentType === "occupation" ? occupationQuiz?.german || "" : contentType === "weather" ? weatherQuiz?.german || "" : contentType === "nature" ? natureQuiz?.german || "" : contentType === "animalPlant" ? animalPlantQuiz?.german || "" : contentType === "publicInstitution" ? publicInstitutionQuiz?.german || "" : contentType === "businessEntertainment" ? businessEntertainmentQuiz?.german || "" : contentType === "railTransport" ? railTransportQuiz?.german || "" : contentType === "dailyTransport" ? dailyTransportQuiz?.german || "" : contentType === "abstractConcept1" ? abstractConcept1Quiz?.german || "" : quizType === "digitToWord" ? quizNumber?.digit || "" : quizNumber?.german || "")}
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                  >
                    🔊 播放
                  </button>
                </div>

                {/* 输入框 */}
                {!quizResult && (
                  <div className="mb-6">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="请输入答案... (按空格键获取焦点)"
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
                      确认答案 (Enter)
                    </button>
                  </div>
                )}

                {/* 结果 */}
                {quizResult && (
                  <div className="text-center">
                    <p className={`text-2xl font-bold mb-4 ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                      {quizResult === "correct" ? "🎉 回答正确！" : "❌ 回答错误"}
                    </p>
                    {quizResult === "wrong" && userInput && (
                      <div className="bg-red-50 rounded-xl p-3 mb-4">
                        <p className="text-gray-600 text-sm">你的答案：</p>
                        <p className="text-xl font-bold text-red-600">{userInput}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-600">正确答案：</p>
                      {contentType === "time" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-amber-600 mb-2">{timeQuiz?.time}</p>
                          <p className="text-lg text-amber-600 mb-2">{timeQuiz?.chinese}</p>
                          {timeQuiz?.answers.map((ans, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-2 mb-1">
                              <span className="text-gray-800">{ans}</span>
                              <button
                                onClick={() => speak(ans)}
                                className="p-2 bg-amber-100 rounded-full hover:bg-amber-200"
                              >
                                🔊
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : contentType === "article" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-teal-600 mb-2">{articleQuiz?.noun}</p>
                          <p className="text-lg text-teal-600 mb-2">{articleQuiz?.nounChinese}</p>
                          <div className="bg-white rounded-lg p-2 mb-1">
                            <span className="text-gray-600">第1格: </span>
                            <span className="text-gray-800 font-bold">{articleQuiz?.nominative}</span>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-gray-600">第4格: </span>
                            <span className="text-gray-800 font-bold">{articleQuiz?.accusative}</span>
                          </div>
                        </div>
                      ) : contentType === "occupation" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-emerald-600 mb-2">{occupationQuiz?.german}</p>
                          <p className="text-lg text-emerald-600">({occupationQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "weather" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-sky-600 mb-2">{weatherQuiz?.german}</p>
                          <p className="text-lg text-sky-600">({weatherQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "nature" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-green-600 mb-2">{natureQuiz?.german}</p>
                          <p className="text-lg text-green-600">({natureQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "animalPlant" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-amber-600 mb-2">{animalPlantQuiz?.german}</p>
                          <p className="text-lg text-amber-600">({animalPlantQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "publicInstitution" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-indigo-600 mb-2">{publicInstitutionQuiz?.german}</p>
                          <p className="text-lg text-indigo-600">({publicInstitutionQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "businessEntertainment" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-rose-600 mb-2">{businessEntertainmentQuiz?.german}</p>
                          <p className="text-lg text-rose-600">({businessEntertainmentQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "railTransport" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-cyan-600 mb-2">{railTransportQuiz?.german}</p>
                          <p className="text-lg text-cyan-600">({railTransportQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "dailyTransport" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-orange-600 mb-2">{dailyTransportQuiz?.german}</p>
                          <p className="text-lg text-orange-600">({dailyTransportQuiz?.chinese})</p>
                        </div>
                      ) : contentType === "abstractConcept1" ? (
                        <div className="text-left">
                          <p className="text-2xl font-bold text-violet-600 mb-2">{abstractConcept1Quiz?.german}</p>
                          <p className="text-lg text-violet-600">({abstractConcept1Quiz?.chinese})</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-indigo-600">
                            {contentType === "questionWord" ? questionWordQuiz?.german : contentType === "pronoun" ? pronounQuiz?.german : contentType === "pronoun3rd" ? pronoun3rdQuiz?.german : contentType === "verb" ? verbQuiz?.verb : quizNumber?.german}
                          </p>
                          <p className="text-gray-500">
                            ({contentType === "questionWord" ? questionWordQuiz?.chinese : contentType === "pronoun" ? pronounQuiz?.chinese : contentType === "pronoun3rd" ? pronoun3rdQuiz?.chinese : contentType === "verb" ? verbQuiz?.chinese : quizNumber?.chinese})
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (currentQuestionCount >= quizCount) {
                          setQuizFinished(true);
                        } else {
                          generateQuiz();
                        }
                      }}
                      className="px-8 py-3 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600"
                    >
                      {currentQuestionCount >= quizCount ? "查看结果 (Enter)" : "下一题 (Enter)"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {contentType === "questionWord" ? "德语疑问词拼写练习" : contentType === "pronoun" ? "人称代词拼写练习" : contentType === "pronoun3rd" ? "人称代词（第3人称）拼写练习" : contentType === "verb" ? `动词${verbType}变位拼写练习` : contentType === "time" ? "德语时间表达拼写练习" : contentType === "article" ? "定冠词和名词（第1格和第4格）拼写练习" : contentType === "occupation" ? "职业和身份拼写练习" : contentType === "weather" ? "天气拼写练习" : contentType === "nature" ? "自然拼写练习" : contentType === "animalPlant" ? "动植物拼写练习" : contentType === "publicInstitution" ? "公共机构拼写练习" : contentType === "businessEntertainment" ? "商业/生活娱乐拼写练习" : contentType === "railTransport" ? "轨道交通拼写练习" : contentType === "dailyTransport" ? "日常交通拼写练习" : contentType === "abstractConcept1" ? "抽象概念（1）拼写练习" : "德语数字 0-9 拼写练习"}
      </footer>
    </div>
  );
}
