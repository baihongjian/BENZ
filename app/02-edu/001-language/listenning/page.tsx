'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

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

type QuizType = "phoneNumber" | "weekday" | "month" | "questionWord" | "pronoun" | "pronoun3rd" | "verb" | "time" | "article" | "profession" | "weather" | "nature" | "animal" | "institution" | "business" | "transport";

export default function ListenningPage() {
  const [quizType, setQuizType] = useState<QuizType>("phoneNumber");
  const [verbType, setVerbType] = useState<typeof verbList[number]>("kommen");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [wrongBook, setWrongBook] = useState<string[]>([]);
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [quizCount, setQuizCount] = useState<5 | 10 | 15 | 20>(5);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lastPlayedKey, setLastPlayedKey] = useState("");
  const playCurrentQuestionRef = useRef<() => void>(() => {});

  // 监听键盘事件 - 按回车键下一题，按P键播放音频
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按P键播放音频
      if ((e.key === "p" || e.key === "P") && quizStarted && !quizFinished) {
        e.preventDefault();
        playCurrentQuestionRef.current();
        return;
      }
      // 按回车键下一题
      if (e.key === "Enter" && quizResult !== null && quizStarted && !showWrongBook && !quizFinished) {
        if (currentQuestionCount >= quizCount) {
          setQuizFinished(true);
        } else {
          startQuiz();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizResult, quizStarted, showWrongBook, quizFinished, currentQuestionCount, quizCount]);

  // 电话号码数据
  const [phoneNumberData, setPhoneNumberData] = useState<{
    phoneNumber: string;
    germanText: string;
  } | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");

  // 星期逻辑数据
  const [weekdayData, setWeekdayData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  // 月份逻辑数据
  const [monthData, setMonthData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  // 疑问词听力数据
  const questionWords = [
    { german: "Wer?", chinese: "谁？" },
    { german: "Wie?", chinese: "怎样？/如何？" },
    { german: "Woher?", chinese: "从哪里？" },
    { german: "Was?", chinese: "什么？" },
    { german: "Wo?", chinese: "在哪里？" },
    { german: "Wann?", chinese: "什么时候？" },
    { german: "Warum?", chinese: "为什么？" },
    { german: "Welcher?", chinese: "哪个？" },
  ];

  // 时间听力数据（14:15 的不同表达方式）
  const timeExpressions = [
    { german: "Es ist Viertel nach zwei.", chinese: "两点十五分" },
    { german: "Es ist fünfzehn nach zwei.", chinese: "两点十五分" },
    { german: "Es ist vierzehn Uhr fünfzehn.", chinese: "两点十五分" },
    { german: "Es ist zwei Uhr fünfzehn.", chinese: "两点十五分" },
  ];

  // 定冠词和名词数据（第1格和第4格）
  const articleNouns = [
    { noun: "Mann", chinese: "男人", nominative: "der Mann", accusative: "den Mann", gender: "m" },
    { noun: "Frau", chinese: "女人", nominative: "die Frau", accusative: "die Frau", gender: "f" },
    { noun: "Kind", chinese: "孩子", nominative: "das Kind", accusative: "das Kind", gender: "n" },
    { noun: "Leute", chinese: "人们", nominative: "die Leute", accusative: "die Leute", gender: "pl" },
  ];

  // 职业和身份听力数据
  const professions = [
    { german: "der Arzt", chinese: "医生" },
    { german: "der Beruf", chinese: "职业" },
    { german: "die Firma", chinese: "公司" },
    { german: "der Lehrer", chinese: "老师" },
    { german: "der Professor", chinese: "教授" },
    { german: "die Hausfrau", chinese: "家庭主妇" },
    { german: "der Schüler", chinese: "学生（中小学生）" },
    { german: "der Student", chinese: "大学生" },
  ];

  // 天气和自然听力数据
  const weatherWords = [
    { german: "das Wetter", chinese: "天气" },
    { german: "der Wind", chinese: "风" },
    { german: "der Regen", chinese: "雨" },
    { german: "der Schnee", chinese: "雪" },
    { german: "die Luft", chinese: "空气" },
    { german: "die Sonne", chinese: "太阳" },
    { german: "der Stern", chinese: "星星" },
    { german: "der Mond", chinese: "月亮" },
  ];

  // 地理和自然听力数据
  const natureWords = [
    { german: "der Berg", chinese: "山" },
    { german: "das Feld", chinese: "田野" },
    { german: "der Wald", chinese: "森林" },
    { german: "das Meer", chinese: "海" },
    { german: "der See", chinese: "湖" },
    { german: "der Fluss", chinese: "河流" },
    { german: "der Himmel", chinese: "天空" },
    { german: "die Natur", chinese: "自然" },
  ];

  // 动植物听力数据
  const animalWords = [
    { german: "die Pflanze", chinese: "植物" },
    { german: "der Baum", chinese: "树" },
    { german: "die Blume", chinese: "花" },
    { german: "das Tier", chinese: "动物" },
    { german: "der Hund", chinese: "狗" },
    { german: "die Katze", chinese: "猫" },
    { german: "der Vogel", chinese: "鸟" },
    { german: "das Pferd", chinese: "马" },
  ];

  // 公共机构听力数据
  const institutionWords = [
    { german: "die Kirche", chinese: "教堂" },
    { german: "das Krankenhaus", chinese: "医院" },
    { german: "die Polizei", chinese: "警察局/警方" },
    { german: "die Post", chinese: "邮局" },
    { german: "das Rathaus", chinese: "市政厅" },
    { german: "die Stadt", chinese: "城市" },
    { german: "die Straße", chinese: "街道" },
    { german: "der Platz", chinese: "广场" },
  ];

  // 商业/生活娱乐听力数据
  const businessWords = [
    { german: "die Bäckerei", chinese: "面包店" },
    { german: "das Geschäft", chinese: "商店" },
    { german: "das Kaufhaus", chinese: "百货商场" },
    { german: "das Kino", chinese: "电影院" },
    { german: "der Markt", chinese: "市场" },
    { german: "der Park", chinese: "公园" },
    { german: "das Hotel", chinese: "酒店" },
    { german: "das Schloss", chinese: "城堡" },
  ];

  // 轨道交通听力数据
  const transportWords = [
    { german: "die Bahn", chinese: "火车/铁路" },
    { german: "der Zug", chinese: "火车" },
    { german: "der Bahnhof", chinese: "火车站" },
    { german: "die Haltestelle", chinese: "站点" },
    { german: "der Fahrplan", chinese: "时刻表" },
    { german: "die Abfahrt", chinese: "出发" },
    { german: "die Ankunft", chinese: "到达" },
    { german: "die Fahrkarte", chinese: "车票" },
  ];

  // 人称代词听力数据
  const personalPronouns = [
    { german: "ich", chinese: "我" },
    { german: "wir", chinese: "我们" },
    { german: "du", chinese: "你" },
    { german: "ihr", chinese: "你们" },
    { german: "Sie", chinese: "您" },
  ];

  // 人称代词（第3人称）听力数据
  const personalPronouns3rd = [
    { german: "er", chinese: "他" },
    { german: "sie", chinese: "她" },
    { german: "es", chinese: "它" },
    { german: "sie", chinese: "他们/她们/它们" },
  ];

  // 动词变位听力数据
  const verbConjugation = {
    kommen: [
      { german: "Ich komme aus China.", chinese: "我来自中国" },
      { german: "Du kommst aus Deutschland.", chinese: "你来自德国" },
      { german: "Wir kommen aus der Schule.", chinese: "我们来自学校" },
      { german: "Ihr kommt aus dem Büro.", chinese: "你们来自办公室" },
      { german: "Sie kommen aus Berlin.", chinese: "您来自柏林" },
    ],
    sein: [
      { german: "Ich bin Student.", chinese: "我是学生" },
      { german: "Du bist müde.", chinese: "你累了" },
      { german: "Wir sind müde.", chinese: "我们累了" },
      { german: "Ihr seid hungrig.", chinese: "你们饿了" },
      { german: "Sie sind müde.", chinese: "您累了" },
    ],
    heißen: [
      { german: "Ich heiße Li Ming.", chinese: "我叫李明" },
      { german: "Du heißt Maria.", chinese: "你叫玛丽亚" },
      { german: "Wir heißen Li Ming und Wang Tao.", chinese: "我们叫李明和王涛" },
      { german: "Ihr heißt Anna und Peter.", chinese: "你们叫安娜和彼得" },
      { german: "Sie heißen Herr Wang.", chinese: "您叫王先生" },
    ],
    arbeiten: [
      { german: "Ich arbeite in China.", chinese: "我在中国工作" },
      { german: "Du arbeitest in Berlin.", chinese: "你在柏林工作" },
      { german: "Wir arbeiten in der Firma.", chinese: "我们在公司工作" },
      { german: "Ihr arbeitet in der Schule.", chinese: "你们在学校工作" },
      { german: "Sie arbeiten in Shanghai.", chinese: "您在上海工作" },
    ],
    wohnen: [
      { german: "Ich wohne in Beijing.", chinese: "我住在北京" },
      { german: "Du wohnst in München.", chinese: "你住在慕尼黑" },
      { german: "Wir wohnen in Hamburg.", chinese: "我们住在汉堡" },
      { german: "Ihr wohnt in Köln.", chinese: "你们住在科隆" },
      { german: "Sie wohnen in Frankfurt.", chinese: "您住在法兰克福" },
    ],
  };

  const verbList = ["kommen", "sein", "heißen", "arbeiten", "wohnen"] as const;

  const [questionWordData, setQuestionWordData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [pronounData, setPronounData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [pronoun3rdData, setPronoun3rdData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [verbData, setVerbData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [timeData, setTimeData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [articleData, setArticleData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
    caseType: "nominative" | "accusative";
  } | null>(null);

  const [professionData, setProfessionData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [weatherData, setWeatherData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [natureData, setNatureData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [animalData, setAnimalData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [institutionData, setInstitutionData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [businessData, setBusinessData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  const [transportData, setTransportData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
  } | null>(null);

  // 监听题目数据变化，自动播放音频
  useEffect(() => {
    if (!quizStarted) return;

    // 根据当前题目类型生成唯一的key
    let currentKey = "";
    if (quizType === "verb" && verbData) {
      currentKey = `verb-${verbData.question}`;
    } else if (quizType === "pronoun" && pronounData) {
      currentKey = `pronoun-${pronounData.question}`;
    } else if (quizType === "pronoun3rd" && pronoun3rdData) {
      currentKey = `pronoun3rd-${pronoun3rdData.question}`;
    } else if (quizType === "questionWord" && questionWordData) {
      currentKey = `questionWord-${questionWordData.question}`;
    } else if (quizType === "time" && timeData) {
      currentKey = `time-${timeData.question}`;
    } else if (quizType === "article" && articleData) {
      currentKey = `article-${articleData.question}`;
    } else if (quizType === "profession" && professionData) {
      currentKey = `profession-${professionData.question}`;
    } else if (quizType === "weather" && weatherData) {
      currentKey = `weather-${weatherData.question}`;
    } else if (quizType === "nature" && natureData) {
      currentKey = `nature-${natureData.question}`;
    } else if (quizType === "animal" && animalData) {
      currentKey = `animal-${animalData.question}`;
    } else if (quizType === "institution" && institutionData) {
      currentKey = `institution-${institutionData.question}`;
    } else if (quizType === "business" && businessData) {
      currentKey = `business-${businessData.question}`;
    } else if (quizType === "transport" && transportData) {
      currentKey = `transport-${transportData.question}`;
    }

    // 如果key变化了，说明是新题目，自动播放
    if (currentKey && currentKey !== lastPlayedKey) {
      const timer = setTimeout(() => {
        playCurrentQuestion();
        setLastPlayedKey(currentKey);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [quizStarted, verbData, pronounData, pronoun3rdData, questionWordData, timeData, articleData, professionData, weatherData, natureData, animalData, institutionData, businessData, transportData, quizType]);

  // 生成电话号码题目
  const generatePhoneQuiz = () => {
    // 检查是否已完成答题数量
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const digitToGerman: Record<string, string> = {
      '0': 'null', '1': 'eins', '2': 'zwei', '3': 'drei', '4': 'vier',
      '5': 'fünf', '6': 'sechs', '7': 'sieben', '8': 'acht', '9': 'neun',
    };

    const prefix = Math.random() > 0.5 ? '015' + Math.floor(Math.random() * 5 + 1) : '016' + Math.floor(Math.random() * 3 + 2);
    const part2 = String(Math.floor(Math.random() * 899) + 100);
    const part3 = String(Math.floor(Math.random() * 8999) + 1000);
    const phoneNumber = `${prefix} ${part2} ${part3}`;

    const digits = phoneNumber.replace(/\s/g, '');
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    const germanText = groups.map(group =>
      group.split('').map(d => digitToGerman[d]).join(' ')
    ).join(' / ');

    setPhoneNumberData({ phoneNumber, germanText });
    setPhoneNumberInput("");
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成星期逻辑题目
  const generateWeekdayQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const weekdays = [
      { german: "Montag", chinese: "星期一", index: 0 },
      { german: "Dienstag", chinese: "星期二", index: 1 },
      { german: "Mittwoch", chinese: "星期三", index: 2 },
      { german: "Donnerstag", chinese: "星期四", index: 3 },
      { german: "Freitag", chinese: "星期五", index: 4 },
      { german: "Samstag", chinese: "星期六", index: 5 },
      { german: "Sonntag", chinese: "星期日", index: 6 },
    ];

    const shuffledWeekdays = [...weekdays].sort(() => Math.random() - 0.5);
    const baseWeekday = shuffledWeekdays[0];
    const relations = ["yesterday", "tomorrow"];
    const relation = relations[Math.floor(Math.random() * relations.length)];

    let answerIndex: number;
    let questionText: string;
    let questionChinese: string;

    if (relation === "yesterday") {
      answerIndex = (baseWeekday.index + 1) % 7;
      questionText = `Gestern war ${baseWeekday.german}. Heute ist ?`;
      questionChinese = `昨天是${baseWeekday.chinese}，今天是星期几？`;
    } else {
      answerIndex = (baseWeekday.index + 6) % 7;
      questionText = `Morgen ist ${baseWeekday.german}. Heute ist ?`;
      questionChinese = `明天是${baseWeekday.chinese}，今天是星期几？`;
    }

    const answerWeekday = weekdays[answerIndex];
    setWeekdayData({
      question: questionText,
      questionChinese,
      answer: answerWeekday.german,
      answerChinese: answerWeekday.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成月份逻辑题目
  const generateMonthQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }
    const months = [
      { german: "Januar", chinese: "一月", index: 0 },
      { german: "Februar", chinese: "二月", index: 1 },
      { german: "März", chinese: "三月", index: 2 },
      { german: "April", chinese: "四月", index: 3 },
      { german: "Mai", chinese: "五月", index: 4 },
      { german: "Juni", chinese: "六月", index: 5 },
      { german: "Juli", chinese: "七月", index: 6 },
      { german: "August", chinese: "八月", index: 7 },
      { german: "September", chinese: "九月", index: 8 },
      { german: "Oktober", chinese: "十月", index: 9 },
      { german: "November", chinese: "十一月", index: 10 },
      { german: "Dezember", chinese: "十二月", index: 11 },
    ];

    const shuffledMonths = [...months].sort(() => Math.random() - 0.5);
    const baseMonth = shuffledMonths[0];
    const relations = ["previousMonth", "nextMonth"];
    const relation = relations[Math.floor(Math.random() * relations.length)];

    let answerIndex: number;
    let questionText: string;
    let questionChinese: string;

    if (relation === "previousMonth") {
      answerIndex = (baseMonth.index + 11) % 12;
      questionText = `Der Monat vor ${baseMonth.german} ist ?`;
      questionChinese = `${baseMonth.chinese}的上个月是几月？`;
    } else {
      answerIndex = (baseMonth.index + 1) % 12;
      questionText = `Der Monat nach ${baseMonth.german} ist ?`;
      questionChinese = `${baseMonth.chinese}的下个月是几月？`;
    }

    const answerMonth = months[answerIndex];
    setMonthData({
      question: questionText,
      questionChinese,
      answer: answerMonth.german,
      answerChinese: answerMonth.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成疑问词听力题目
  const generateQuestionWordQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...questionWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setQuestionWordData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成时间听力题目
  const generateTimeQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...timeExpressions].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setTimeData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成定冠词和名词听力题目（第1格和第4格）
  const generateArticleQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    // 随机选择名词
    const shuffledNouns = [...articleNouns].sort(() => Math.random() - 0.5);
    const selectedNoun = shuffledNouns[0];

    // 随机选择第1格或第4格
    const caseType: "nominative" | "accusative" = Math.random() > 0.5 ? "nominative" : "accusative";
    const correctAnswer = caseType === "nominative" ? selectedNoun.nominative : selectedNoun.accusative;
    const caseChinese = caseType === "nominative" ? "第1格（主格）" : "第4格（宾格）";

    setArticleData({
      question: correctAnswer,
      questionChinese: selectedNoun.chinese,
      answer: correctAnswer,
      answerChinese: `${selectedNoun.chinese}（${caseChinese}）`,
      caseType
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成职业和身份听力题目
  const generateProfessionQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...professions].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setProfessionData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成天气和自然听力题目
  const generateWeatherQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...weatherWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setWeatherData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成地理和自然听力题目
  const generateNatureQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...natureWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setNatureData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成动植物听力题目
  const generateAnimalQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...animalWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setAnimalData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成公共机构听力题目
  const generateInstitutionQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...institutionWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setInstitutionData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成商业/生活娱乐听力题目
  const generateBusinessQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...businessWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setBusinessData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成轨道交通听力题目
  const generateTransportQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...transportWords].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setTransportData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成人称代词听力题目
  const generatePronounQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...personalPronouns].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setPronounData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成人称代词（第3人称）听力题目
  const generatePronoun3rdQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const shuffled = [...personalPronouns3rd].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setPronoun3rdData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 生成动词变位听力题目
  const generateVerbQuiz = () => {
    if (currentQuestionCount >= quizCount) {
      setQuizFinished(true);
      return;
    }

    const available = verbConjugation[verbType];
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled[0];

    setVerbData({
      question: selected.german,
      questionChinese: selected.chinese,
      answer: selected.german,
      answerChinese: selected.chinese
    });
    setQuizResult(null);
    setQuizStarted(true);
    setShowText(false);
    setCurrentQuestionCount(prev => prev + 1);
  };

  // 开始练习
  const startQuiz = () => {
    if (!quizStarted) {
      // 第一次开始，重置计数
      setCurrentQuestionCount(0);
      setCorrectCount(0);
      setQuizFinished(false);
    }
    if (quizType === "phoneNumber") generatePhoneQuiz();
    else if (quizType === "weekday") generateWeekdayQuiz();
    else if (quizType === "month") generateMonthQuiz();
    else if (quizType === "questionWord") generateQuestionWordQuiz();
    else if (quizType === "pronoun") generatePronounQuiz();
    else if (quizType === "pronoun3rd") generatePronoun3rdQuiz();
    else if (quizType === "verb") generateVerbQuiz();
    else if (quizType === "time") generateTimeQuiz();
    else if (quizType === "article") generateArticleQuiz();
    else if (quizType === "profession") generateProfessionQuiz();
    else if (quizType === "weather") generateWeatherQuiz();
    else if (quizType === "nature") generateNatureQuiz();
    else if (quizType === "animal") generateAnimalQuiz();
    else if (quizType === "institution") generateInstitutionQuiz();
    else if (quizType === "business") generateBusinessQuiz();
    else if (quizType === "transport") generateTransportQuiz();
  };

  // 播放当前题目
  const playCurrentQuestion = useCallback(() => {
    let text = "";
    if (quizType === "phoneNumber" && phoneNumberData) {
      text = phoneNumberData.germanText.replace(/\s/g, ' ').replace(/\//g, ',');
    } else if (quizType === "weekday" && weekdayData) {
      text = weekdayData.question;
    } else if (quizType === "month" && monthData) {
      text = monthData.question;
    } else if (quizType === "questionWord" && questionWordData) {
      text = questionWordData.question;
    } else if (quizType === "pronoun" && pronounData) {
      text = pronounData.question;
    } else if (quizType === "pronoun3rd" && pronoun3rdData) {
      text = pronoun3rdData.question;
    } else if (quizType === "verb" && verbData) {
      text = verbData.question;
    } else if (quizType === "time" && timeData) {
      text = timeData.question;
    } else if (quizType === "article" && articleData) {
      text = articleData.question;
    } else if (quizType === "profession" && professionData) {
      text = professionData.question;
    } else if (quizType === "weather" && weatherData) {
      text = weatherData.question;
    } else if (quizType === "nature" && natureData) {
      text = natureData.question;
    } else if (quizType === "animal" && animalData) {
      text = animalData.question;
    } else if (quizType === "institution" && institutionData) {
      text = institutionData.question;
    } else if (quizType === "business" && businessData) {
      text = businessData.question;
    } else if (quizType === "transport" && transportData) {
      text = transportData.question;
    }

    if (text) {
      setIsPlayingAudio(true);
      speak(text);
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  }, [quizType, phoneNumberData, weekdayData, monthData, questionWordData, pronounData, pronoun3rdData, verbData, timeData, articleData, professionData, weatherData, natureData, animalData, institutionData, businessData, transportData]);

  // 更新 playCurrentQuestion 的 ref
  useEffect(() => {
    playCurrentQuestionRef.current = playCurrentQuestion;
  }, [playCurrentQuestion]);

  // 提交电话号码答案
  const submitPhoneAnswer = () => {
    const rawInput = phoneNumberInput.replace(/\s/g, '');
    const rawAnswer = phoneNumberData?.phoneNumber.replace(/\s/g, '') || '';
    const isCorrect = rawInput === rawAnswer;

    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      if (phoneNumberData) {
        setWrongBook(prev => prev.includes(phoneNumberData.phoneNumber) ? prev : [...prev, phoneNumberData.phoneNumber]);
      }
    }
  };

  // 星期选项
  const weekdays = [
    { german: "Montag", chinese: "星期一" },
    { german: "Dienstag", chinese: "星期二" },
    { german: "Mittwoch", chinese: "星期三" },
    { german: "Donnerstag", chinese: "星期四" },
    { german: "Freitag", chinese: "星期五" },
    { german: "Samstag", chinese: "星期六" },
    { german: "Sonntag", chinese: "星期日" },
  ];

  // 月份选项
  const months = [
    { german: "Januar", chinese: "一月" },
    { german: "Februar", chinese: "二月" },
    { german: "März", chinese: "三月" },
    { german: "April", chinese: "四月" },
    { german: "Mai", chinese: "五月" },
    { german: "Juni", chinese: "六月" },
    { german: "Juli", chinese: "七月" },
    { german: "August", chinese: "八月" },
    { german: "September", chinese: "九月" },
    { german: "Oktober", chinese: "十月" },
    { german: "November", chinese: "十一月" },
    { german: "Dezember", chinese: "十二月" },
  ];

  // 选择星期答案
  const selectWeekdayAnswer = (selected: string) => {
    if (quizResult !== null || !weekdayData) return;
    const isCorrect = selected === weekdayData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(weekdayData.question) ? prev : [...prev, weekdayData.question]);
    }
  };

  // 选择月份答案
  const selectMonthAnswer = (selected: string) => {
    if (quizResult !== null || !monthData) return;
    const isCorrect = selected === monthData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(monthData.question) ? prev : [...prev, monthData.question]);
    }
  };

  // 选择疑问词答案
  const selectQuestionWordAnswer = (selected: string) => {
    if (quizResult !== null || !questionWordData) return;
    const isCorrect = selected === questionWordData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(questionWordData.question) ? prev : [...prev, questionWordData.question]);
    }
  };

  // 选择时间答案
  const selectTimeAnswer = (selected: string) => {
    if (quizResult !== null || !timeData) return;
    const isCorrect = selected === timeData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(timeData.question) ? prev : [...prev, timeData.question]);
    }
  };

  // 选择定冠词和名词答案
  const selectArticleAnswer = (selected: string) => {
    if (quizResult !== null || !articleData) return;
    const isCorrect = selected === articleData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(articleData.question) ? prev : [...prev, articleData.question]);
    }
  };

  // 选择职业和身份答案
  const selectProfessionAnswer = (selected: string) => {
    if (quizResult !== null || !professionData) return;
    const isCorrect = selected === professionData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(professionData.question) ? prev : [...prev, professionData.question]);
    }
  };

  // 选择天气和自然答案
  const selectWeatherAnswer = (selected: string) => {
    if (quizResult !== null || !weatherData) return;
    const isCorrect = selected === weatherData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(weatherData.question) ? prev : [...prev, weatherData.question]);
    }
  };

  // 选择地理和自然答案
  const selectNatureAnswer = (selected: string) => {
    if (quizResult !== null || !natureData) return;
    const isCorrect = selected === natureData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(natureData.question) ? prev : [...prev, natureData.question]);
    }
  };

  // 选择动植物答案
  const selectAnimalAnswer = (selected: string) => {
    if (quizResult !== null || !animalData) return;
    const isCorrect = selected === animalData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(animalData.question) ? prev : [...prev, animalData.question]);
    }
  };

  // 选择公共机构答案
  const selectInstitutionAnswer = (selected: string) => {
    if (quizResult !== null || !institutionData) return;
    const isCorrect = selected === institutionData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(institutionData.question) ? prev : [...prev, institutionData.question]);
    }
  };

  // 选择商业/生活娱乐答案
  const selectBusinessAnswer = (selected: string) => {
    if (quizResult !== null || !businessData) return;
    const isCorrect = selected === businessData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(businessData.question) ? prev : [...prev, businessData.question]);
    }
  };

  // 选择轨道交通答案
  const selectTransportAnswer = (selected: string) => {
    if (quizResult !== null || !transportData) return;
    const isCorrect = selected === transportData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(transportData.question) ? prev : [...prev, transportData.question]);
    }
  };

  // 选择人称代词答案
  const selectPronounAnswer = (selected: string) => {
    if (quizResult !== null || !pronounData) return;
    const isCorrect = selected === pronounData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(pronounData.question) ? prev : [...prev, pronounData.question]);
    }
  };

  // 选择人称代词（第3人称）答案
  const selectPronoun3rdAnswer = (selected: string) => {
    if (quizResult !== null || !pronoun3rdData) return;
    const isCorrect = selected === pronoun3rdData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(pronoun3rdData.question) ? prev : [...prev, pronoun3rdData.question]);
    }
  };

  // 选择动词变位答案
  const selectVerbAnswer = (selected: string) => {
    if (quizResult !== null || !verbData) return;
    const isCorrect = selected === verbData.answer;
    if (isCorrect) {
      setQuizResult("correct");
      setCorrectCount(prev => prev + 1);
      playSound("correct");
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setWrongBook(prev => prev.includes(verbData.question) ? prev : [...prev, verbData.question]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-2">
            <Link
              href="/02-edu/001-language"
              className="text-sm px-3 py-1 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
            >
              ← 德语学习
            </Link>
          </div>
          <h1 className="text-2xl font-bold">👂 德语听力练习</h1>
          <p className="mt-1 opacity-90">德语听力专项训练</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 题型选择 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => { setQuizType("phoneNumber"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "phoneNumber" ? "bg-teal-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            📞 电话号码
          </button>
          <button
            onClick={() => { setQuizType("weekday"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "weekday" ? "bg-violet-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            📅 星期推理
          </button>
          <button
            onClick={() => { setQuizType("month"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "month" ? "bg-emerald-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🗓️ 月份推理
          </button>
          <button
            onClick={() => { setQuizType("questionWord"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "questionWord" ? "bg-pink-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            ❓ 疑问词
          </button>
          <button
            onClick={() => { setQuizType("time"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "time" ? "bg-amber-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            ⏰ 时间表达
          </button>
          <button
            onClick={() => { setQuizType("profession"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "profession" ? "bg-amber-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            💼 职业和身份
          </button>
          <button
            onClick={() => { setQuizType("weather"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "weather" ? "bg-cyan-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            ☁️ 天气和自然
          </button>
          <button
            onClick={() => { setQuizType("nature"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "nature" ? "bg-green-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🏔️ 地理和自然
          </button>
          <button
            onClick={() => { setQuizType("animal"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "animal" ? "bg-orange-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🐾 动植物
          </button>
          <button
            onClick={() => { setQuizType("institution"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "institution" ? "bg-indigo-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🏛️ 公共机构
          </button>
          <button
            onClick={() => { setQuizType("business"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "business" ? "bg-purple-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🏪 商业/生活娱乐
          </button>
          <button
            onClick={() => { setQuizType("transport"); setQuizStarted(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              quizType === "transport" ? "bg-blue-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            🚇 轨道交通
          </button>
        </div>

        {/* 语法分类 */}
        <div className="flex justify-center mb-4">
          <select
            value={quizType === "phoneNumber" || quizType === "weekday" || quizType === "month" || quizType === "questionWord" || quizType === "time" || quizType === "profession" || quizType === "weather" || quizType === "nature" || quizType === "animal" ? "" : quizType}
            onChange={(e) => { setQuizType(e.target.value as "pronoun" | "pronoun3rd" | "verb" | "article"); setQuizStarted(false); }}
            className="px-4 py-2 rounded-full text-sm font-medium border-2 border-purple-200 bg-white text-gray-700 focus:outline-none focus:border-purple-400"
          >
            <option value="">选择语法类型</option>
            <option value="pronoun">语法1: 人称代词（第1人称和第2人称）</option>
            <option value="pronoun3rd">语法10: 人称代词（第3人称）</option>
            <option value="verb">语法2: 动词变位（第1人称和第2人称）</option>
            <option value="article">语法11: 定冠词和名词（第1格和第4格）</option>
          </select>
        </div>

        {/* 动词类型选择 */}
        {quizType === "verb" && (
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

        {/* 答题数量选择 */}
        {!quizStarted && !showWrongBook && (
          <div className="flex justify-center gap-2 mb-6">
            <span className="text-sm text-gray-600 self-center">答题数量:</span>
            {[5, 10, 15, 20].map(count => (
              <button
                key={count}
                onClick={() => { setQuizCount(count as 5|10|15|20); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${
                  quizCount === count ? "bg-teal-500 text-white" : "bg-white text-gray-600 border"
                }`}
              >
                {count}题
              </button>
            ))}
          </div>
        )}

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => { setShowWrongBook(false); setQuizStarted(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              !showWrongBook ? "bg-teal-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            👂 听力练习
          </button>
          <button
            onClick={() => setShowWrongBook(true)}
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
                {wrongBook.map((item, idx) => (
                  <div key={idx} className="bg-red-50 rounded-xl p-4">
                    <p className="text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !quizStarted ? (
          /* 开始答题 */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">
              {quizType === "phoneNumber" ? "📞" : quizType === "weekday" ? "📅" : quizType === "month" ? "🗓️" : quizType === "pronoun" ? "👤" : quizType === "pronoun3rd" ? "👥" : quizType === "verb" ? "🔄" : quizType === "time" ? "⏰" : quizType === "article" ? "📝" : quizType === "profession" ? "💼" : quizType === "weather" ? "☁️" : quizType === "nature" ? "🏔️" : quizType === "animal" ? "🐾" : quizType === "institution" ? "🏛️" : quizType === "business" ? "🏪" : quizType === "transport" ? "🚇" : "❓"}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {quizType === "phoneNumber" ? "电话号码听力" : quizType === "weekday" ? "星期逻辑推理" : quizType === "month" ? "月份逻辑推理" : quizType === "pronoun" ? "人称代词听力" : quizType === "pronoun3rd" ? "人称代词（第3人称）听力" : quizType === "verb" ? `动词${verbType}变位听力` : quizType === "time" ? "时间表达听力" : quizType === "article" ? "定冠词和名词（第1格和第4格）" : quizType === "profession" ? "职业和身份听力" : quizType === "weather" ? "天气和自然听力" : quizType === "nature" ? "地理和自然听力" : quizType === "animal" ? "动植物听力" : quizType === "institution" ? "公共机构听力" : quizType === "business" ? "商业/生活娱乐听力" : quizType === "transport" ? "轨道交通听力" : "疑问词听力"}
            </h2>
            <p className="text-gray-600 mb-6">
              {quizType === "phoneNumber" ? "听德语读出的电话号码，输入正确的数字" :
               quizType === "weekday" ? "听问题，推理今天是星期几" :
               quizType === "month" ? "听问题，推理是几月" :
               quizType === "pronoun" ? "听人称代词，选择正确的中文含义" :
               quizType === "pronoun3rd" ? "听人称代词（第3人称），选择正确的中文含义" :
               quizType === "verb" ? "听动词变位，选择正确的中文含义" :
               quizType === "time" ? "听时间表达，选择正确的德语" :
               quizType === "article" ? "听定冠词和名词，选择正确的德语" :
               quizType === "profession" ? "听职业和身份，选择正确的中文含义" :
               quizType === "weather" ? "听天气和自然，选择正确的中文含义" :
               quizType === "nature" ? "听地理和自然，选择正确的中文含义" :
               quizType === "animal" ? "听动植物，选择正确的中文含义" :
               quizType === "institution" ? "听公共机构，选择正确的中文含义" :
               quizType === "business" ? "听商业/生活娱乐，选择正确的中文含义" :
               quizType === "transport" ? "听轨道交通，选择正确的中文含义" :
               "听德语疑问词，选择正确的中文含义"}
            </p>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition"
            >
              开始练习
            </button>
          </div>
        ) : quizFinished ? (
          /* 答题完成 */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-4">练习完成!</h2>
            <div className="text-4xl font-bold text-teal-500 mb-2">
              {correctCount} / {quizCount}
            </div>
            <p className="text-gray-600 mb-6">
              正确率: {Math.round((correctCount / quizCount) * 100)}%
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setQuizStarted(false); setQuizFinished(false); setCurrentQuestionCount(0); setCorrectCount(0); }}
                className="px-6 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
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
          /* 答题界面 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* 进度显示 */}
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">
                进度: {currentQuestionCount} / {quizCount} 题 | 正确: {correctCount} 题
              </span>
            </div>

            {/* 电话号码题型 */}
            {quizType === "phoneNumber" && phoneNumberData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听电话号码，输入数字</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-teal-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-lg">{phoneNumberData.germanText}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放"}
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-gray-100 rounded-xl p-4 mb-4 text-center min-h-[60px] flex items-center justify-center">
                    <span className="text-3xl font-mono">{phoneNumberInput || "请输入..."}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6,7,8,9,0].map(num => (
                      <button
                        key={num}
                        onClick={() => phoneNumberInput.length < 11 && setPhoneNumberInput(p => p + num)}
                        disabled={quizResult !== null}
                        className="py-4 rounded-xl text-2xl font-bold bg-white border-2 border-gray-200 hover:bg-blue-50"
                      >
                        {num}
                      </button>
                    ))}
                    <button onClick={() => setPhoneNumberInput(p => p.slice(0,-1))} className="py-4 rounded-xl text-lg bg-red-50 border-2 border-red-200 text-red-600">⌫</button>
                    <button onClick={() => setPhoneNumberInput("")} className="py-4 rounded-xl text-lg bg-gray-100 border-2 border-gray-200">清空</button>
                    <button
                      onClick={submitPhoneAnswer}
                      disabled={phoneNumberInput.length < 11 || quizResult !== null}
                      className={`py-4 rounded-xl text-lg font-bold ${phoneNumberInput.length >= 11 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 星期题型 */}
            {quizType === "weekday" && weekdayData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听问题，推理今天是星期几</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-violet-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{weekdayData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{weekdayData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放问题"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {weekdays.map((day) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = day.german === weekdayData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-violet-50 text-violet-700 border-2 border-violet-200 hover:bg-violet-100";
                    }
                    return (
                      <button key={day.german} onClick={() => selectWeekdayAnswer(day.german)} disabled={quizResult !== null} className={btnClass}>
                        {day.german}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 月份题型 */}
            {quizType === "month" && monthData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听问题，推理是几月</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-emerald-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{monthData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{monthData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放问题"}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {months.map((month) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = month.german === monthData.answer;
                    let btnClass = "py-3 rounded-xl text-sm font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100";
                    }
                    return (
                      <button key={month.german} onClick={() => selectMonthAnswer(month.german)} disabled={quizResult !== null} className={btnClass}>
                        {month.german}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 疑问词题型 */}
            {quizType === "questionWord" && questionWordData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听疑问词，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-pink-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{questionWordData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{questionWordData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放疑问词"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {questionWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === questionWordData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-pink-50 text-pink-700 border-2 border-pink-200 hover:bg-pink-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectQuestionWordAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 时间表达题型 */}
            {quizType === "time" && timeData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听时间，选择正确的德语表达</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-amber-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">两点十五分</p>
                    <p className="text-lg text-gray-500 mt-2">{timeData.question}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">两点十五分 用德语怎么说？</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {timeExpressions.map((expr) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = expr.german === timeData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100";
                    }
                    return (
                      <button key={expr.german} onClick={() => selectTimeAnswer(expr.german)} disabled={quizResult !== null} className={btnClass}>
                        {expr.german}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 定冠词和名词题型（第1格和第4格） */}
            {quizType === "article" && articleData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听定冠词和名词，选择正确的德语</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{articleData.questionChinese}</p>
                    <p className="text-lg text-gray-500 mt-2">{articleData.question}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">{articleData.questionChinese} 用德语怎么说？</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {articleNouns.map((noun) => {
                    // 显示第1格和第4格两个选项
                    const options = [
                      { german: noun.nominative, chinese: `${noun.chinese} 第1格` },
                      { german: noun.accusative, chinese: `${noun.chinese} 第4格` },
                    ];
                    return options.map((opt) => {
                      const isSelected = quizResult !== null;
                      const isCorrect = opt.german === articleData.answer;
                      let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                      if (isSelected) {
                        if (isCorrect) btnClass += "bg-green-500 text-white";
                        else btnClass += "bg-gray-100 text-gray-400";
                      } else {
                        btnClass += "bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100";
                      }
                      return (
                        <button key={opt.german} onClick={() => selectArticleAnswer(opt.german)} disabled={quizResult !== null} className={btnClass}>
                          {opt.chinese}
                        </button>
                      );
                    });
                  })}
                </div>
              </>
            )}

            {/* 职业和身份题型 */}
            {quizType === "profession" && professionData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听职业和身份，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-amber-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{professionData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{professionData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {professions.map((prof) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = prof.german === professionData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100";
                    }
                    return (
                      <button key={prof.german} onClick={() => selectProfessionAnswer(prof.german)} disabled={quizResult !== null} className={btnClass}>
                        {prof.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 天气和自然题型 */}
            {quizType === "weather" && weatherData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听天气和自然，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-cyan-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{weatherData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{weatherData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {weatherWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === weatherData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-cyan-50 text-cyan-700 border-2 border-cyan-200 hover:bg-cyan-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectWeatherAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 地理和自然题型 */}
            {quizType === "nature" && natureData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听地理和自然，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-green-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{natureData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{natureData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {natureWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === natureData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectNatureAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 动植物题型 */}
            {quizType === "animal" && animalData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听动植物，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-orange-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{animalData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{animalData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {animalWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === animalData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-orange-50 text-orange-700 border-2 border-orange-200 hover:bg-orange-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectAnimalAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 公共机构题型 */}
            {quizType === "institution" && institutionData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听公共机构，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{institutionData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{institutionData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {institutionWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === institutionData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectInstitutionAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 商业/生活娱乐题型 */}
            {quizType === "business" && businessData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听商业/生活娱乐，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-purple-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{businessData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{businessData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {businessWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === businessData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-purple-50 text-purple-700 border-2 border-purple-200 hover:bg-purple-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectBusinessAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 轨道交通题型 */}
            {quizType === "transport" && transportData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听轨道交通，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{transportData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{transportData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放德语"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {transportWords.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === transportData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectTransportAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 人称代词题型 */}
            {quizType === "pronoun" && pronounData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听人称代词，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-purple-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{pronounData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{pronounData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放人称代词"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {personalPronouns.map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === pronounData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-purple-50 text-purple-700 border-2 border-purple-200 hover:bg-purple-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectPronounAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 人称代词（第3人称）题型 */}
            {quizType === "pronoun3rd" && pronoun3rdData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听人称代词（第3人称），选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{pronoun3rdData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{pronoun3rdData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放人称代词"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {personalPronouns3rd.map((word, idx) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === pronoun3rdData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100";
                    }
                    return (
                      <button key={`${word.german}-${idx}`} onClick={() => selectPronoun3rdAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 动词变位题型 */}
            {quizType === "verb" && verbData && (
              <>
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400">听动词变位，选择正确的中文含义</span>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowText(!showText)}
                    className={`px-3 py-1 rounded-full text-sm ${showText ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {showText ? "🙈 隐藏" : "👁️ 显示"}
                  </button>
                </div>

                {showText && (
                  <div className="bg-orange-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-xl font-medium">{verbData.question}</p>
                    <p className="text-lg text-gray-500 mt-2">{verbData.questionChinese}</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <button
                    onClick={playCurrentQuestion}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full ${isPlayingAudio ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放动词变位"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {verbConjugation[verbType].map((word) => {
                    const isSelected = quizResult !== null;
                    const isCorrect = word.german === verbData.answer;
                    let btnClass = "py-4 rounded-xl text-lg font-medium transition ";
                    if (isSelected) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += "bg-orange-50 text-orange-700 border-2 border-orange-200 hover:bg-orange-100";
                    }
                    return (
                      <button key={word.german} onClick={() => selectVerbAnswer(word.german)} disabled={quizResult !== null} className={btnClass}>
                        {word.chinese}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 显示结果 */}
            {quizResult !== null && (
              <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center">
                <p className={`text-xl font-bold mb-4 ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                  {quizResult === "correct" ? "🎉 回答正确！" : "❌ 回答错误"}
                </p>
                {quizType === "phoneNumber" && phoneNumberData && (
                  <p className="text-gray-600">正确答案：{phoneNumberData.phoneNumber}</p>
                )}
                {quizType === "weekday" && weekdayData && (
                  <p className="text-gray-600">正确答案：{weekdayData.answer} ({weekdayData.answerChinese})</p>
                )}
                {quizType === "month" && monthData && (
                  <p className="text-gray-600">正确答案：{monthData.answer} ({monthData.answerChinese})</p>
                )}
                {quizType === "questionWord" && questionWordData && (
                  <p className="text-gray-600">正确答案：{questionWordData.answer} ({questionWordData.answerChinese})</p>
                )}
                {quizType === "time" && timeData && (
                  <p className="text-gray-600">正确答案：{timeData.answer} ({timeData.answerChinese})</p>
                )}
                {quizType === "article" && articleData && (
                  <p className="text-gray-600">正确答案：{articleData.answer} ({articleData.answerChinese})</p>
                )}
                {quizType === "profession" && professionData && (
                  <p className="text-gray-600">正确答案：{professionData.answer} ({professionData.answerChinese})</p>
                )}
                {quizType === "weather" && weatherData && (
                  <p className="text-gray-600">正确答案：{weatherData.answer} ({weatherData.answerChinese})</p>
                )}
                {quizType === "nature" && natureData && (
                  <p className="text-gray-600">正确答案：{natureData.answer} ({natureData.answerChinese})</p>
                )}
                {quizType === "animal" && animalData && (
                  <p className="text-gray-600">正确答案：{animalData.answer} ({animalData.answerChinese})</p>
                )}
                {quizType === "institution" && institutionData && (
                  <p className="text-gray-600">正确答案：{institutionData.answer} ({institutionData.answerChinese})</p>
                )}
                {quizType === "business" && businessData && (
                  <p className="text-gray-600">正确答案：{businessData.answer} ({businessData.answerChinese})</p>
                )}
                {quizType === "transport" && transportData && (
                  <p className="text-gray-600">正确答案：{transportData.answer} ({transportData.answerChinese})</p>
                )}
                {quizType === "pronoun" && pronounData && (
                  <p className="text-gray-600">正确答案：{pronounData.answer} ({pronounData.answerChinese})</p>
                )}
                {quizType === "pronoun3rd" && pronoun3rdData && (
                  <p className="text-gray-600">正确答案：{pronoun3rdData.answer} ({pronoun3rdData.answerChinese})</p>
                )}
                {quizType === "verb" && verbData && (
                  <p className="text-gray-600">正确答案：{verbData.answer} ({verbData.answerChinese})</p>
                )}
                <button
                  onClick={() => {
                    if (currentQuestionCount >= quizCount) {
                      setQuizFinished(true);
                    } else {
                      startQuiz();
                    }
                  }}
                  className="mt-4 px-8 py-3 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600"
                >
                  {currentQuestionCount >= quizCount ? "查看结果 →" : "下一题 →"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        德语听力练习
      </footer>
    </div>
  );
}
