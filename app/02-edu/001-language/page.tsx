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
  gender?: string;
}

interface WrongQuestion {
  german: string;
  chinese: string;
  gender?: string;
  addedAt: number; // 添加时间戳
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

// 生成拼写错误的单词
const generateSpellingError = (word: string): string => {
  if (word.length < 3) return word; // 太短的单词不处理

  const errors: string[] = [];
  const chars = word.split("");
  const errorTypes = ["swap", "delete", "insert", "case"];

  // 交换相邻字母
  const swapError = () => {
    const idx = Math.floor(Math.random() * (chars.length - 1));
    const result = [...chars];
    [result[idx], result[idx + 1]] = [result[idx + 1], result[idx]];
    return result.join("");
  };

  // 删除一个字母
  const deleteError = () => {
    const idx = Math.floor(Math.random() * chars.length);
    return chars.filter((_, i) => i !== idx).join("");
  };

  // 增加一个字母
  const insertError = () => {
    const idx = Math.floor(Math.random() * chars.length);
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const result = [...chars];
    result.splice(idx, 0, letter);
    return result.join("");
  };

  // 大小写错误
  const caseError = () => {
    const idx = Math.floor(Math.random() * chars.length);
    const result = [...chars];
    if (/[a-z]/.test(result[idx])) {
      result[idx] = result[idx].toUpperCase();
    } else if (/[A-Z]/.test(result[idx])) {
      result[idx] = result[idx].toLowerCase();
    }
    return result.join("");
  };

  // 根据错误类型生成错误
  const type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  switch (type) {
    case "swap":
      return swapError();
    case "delete":
      return deleteError();
    case "insert":
      return insertError();
    case "case":
      return caseError();
    default:
      return swapError();
  }
};

export default function GermanLearning() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [quizDifficulty, setQuizDifficulty] = useState<2 | 3 | 4>(2);
  const [quizCount, setQuizCount] = useState(5); // 答题数量
  const [quizType, setQuizType] = useState<"chinese" | "german" | "gender" | "spelling">("chinese"); // 题目类型
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
  const [wrongBook, setWrongBook] = useState<WrongQuestion[]>([]); // 错题本
  const [showWrongBook, setShowWrongBook] = useState(false); // 是否显示错题本
  const [usedWordIndices, setUsedWordIndices] = useState<number[]>([]); // 已出过的题目索引
  const [timeLeft, setTimeLeft] = useState<number>(0); // 剩余时间
  const [timerActive, setTimerActive] = useState(false); // 计时器是否运行
  const [showApiSettings, setShowApiSettings] = useState(false); // 是否显示 API 设置
  const [deepseekApiKey, setDeepseekApiKey] = useState(""); // DeepSeek API Key
  const [useAiQuiz, setUseAiQuiz] = useState(false); // 是否使用 AI 出题
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false); // 是否正在生成 AI 题目

  // 从 localStorage 加载 API Key 和错题本
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedApiKey = localStorage.getItem("deepseek-api-key");
      if (savedApiKey) {
        setDeepseekApiKey(savedApiKey);
      }

      const savedWrongBook = localStorage.getItem("german-wrong-book");
      if (savedWrongBook) {
        const parsed = JSON.parse(savedWrongBook);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWrongBook(parsed);
        }
      }
    } catch (e) {
      console.error("Load settings error:", e);
    }
  }, []);

  // 保存 API Key 到 localStorage
  const saveApiKey = (key: string) => {
    setDeepseekApiKey(key);
    localStorage.setItem("deepseek-api-key", key);
  };

  // 调用 DeepSeek API 生成 AI 题目
  const generateAIQuiz = async (): Promise<Word | null> => {
    if (!deepseekApiKey) {
      alert("请先设置 DeepSeek API Key");
      return null;
    }

    setIsGeneratingQuiz(true);

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个德语学习助手。请生成一个德语单词用于拼写练习。返回一个 JSON 对象，包含：german（德语单词）、chinese（中文翻译）、pronunciation（发音提示）、category（分类，只能是 greeting/number/color/family 之一）、gender（词性，可选 der/die/das）。不要返回其他内容，只返回纯 JSON。"
            },
            {
              role: "user",
              content: "请生成一个德语单词，随机选择分类。返回 JSON 格式。"
            }
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error("API 请求失败");
      }

      const data = await response.json();
      let content = data.choices[0].message.content;

      // 清理 markdown 代码块标记
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();

      // 尝试解析 JSON
      const wordData = JSON.parse(content);

      // 验证数据
      if (!wordData.german || !wordData.chinese) {
        throw new Error("返回数据格式错误");
      }

      return {
        german: wordData.german,
        chinese: wordData.chinese,
        pronunciation: wordData.pronunciation || "",
        category: wordData.category || "greeting",
        gender: wordData.gender as "der" | "die" | "das" | undefined,
      };
    } catch (error) {
      console.error("AI 生成题目失败:", error);
      alert("AI 生成题目失败，请检查 API Key 或网络连接");
      return null;
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // 保存错题本到 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("german-wrong-book", JSON.stringify(wrongBook));
    } catch (e) {
      console.error("Save wrong book error:", e);
    }
  }, [wrongBook]);

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
            isTimeout: true,
            gender: quizWord!.gender
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

  // 生成随机题目（不重复）- 支持 AI 出题
  const generateQuiz = async () => {
    // AI 出题模式（仅拼写纠错题型支持）
    if (useAiQuiz && quizType === "spelling") {
      // 调用 AI 生成题目
      const aiWord = await generateAIQuiz();
      if (!aiWord) return;

      const correctSpelling = aiWord.german;

      // 生成拼写错误的选项
      const spellingErrors = new Set<string>();
      while (spellingErrors.size < quizDifficulty - 1) {
        const error = generateSpellingError(correctSpelling);
        if (error !== correctSpelling) {
          spellingErrors.add(error);
        }
      }

      // 正确选项是拼写正确的单词
      const spellingOptions: Array<{ spelling: string; isCorrect: boolean }> = [
        { spelling: correctSpelling, isCorrect: true },
        ...Array.from(spellingErrors).map(err => ({ spelling: err, isCorrect: false })),
      ];
      const shuffledOptions = spellingOptions.sort(() => Math.random() - 0.5);

      const options = shuffledOptions.map(opt => ({
        word: { ...aiWord, german: opt.spelling },
        isCorrect: opt.isCorrect
      }));

      setQuizWord(aiWord);
      setQuizOptions(options);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);
      return;
    }

    // 原有逻辑：本地词库出题
    // 词性匹配题型只能从有词性的单词中出题
    const wordsWithGender = quizType === "gender"
      ? filteredWords.filter(w => w.gender)
      : filteredWords;

    if (wordsWithGender.length < 2) return;

    // 获取未出过的题目索引（在有词性的单词中）
    const availableIndices = wordsWithGender
      .map((w, idx) => ({ originalIdx: filteredWords.indexOf(w), word: w }))
      .filter(item => !usedWordIndices.includes(item.originalIdx));

    // 如果所有题目都出过了，不再生成新题目
    if (availableIndices.length === 0) return;

    // 随机选择正确答案
    const randomIdx = Math.floor(Math.random() * availableIndices.length);
    const correctItem = availableIndices[randomIdx];
    const correctWord = correctItem.word;

    // 生成选项
    let options: QuizOption[];

    if (quizType === "gender") {
      // 词性匹配题型
      const genders: Array<"der" | "die" | "das"> = ["der", "die", "das"];
      const correctGender = correctWord.gender as "der" | "die" | "das";

      // 获取其他错误的词性选项
      const wrongGenders = genders.filter(g => g !== correctGender);
      const shuffledWrongGenders = wrongGenders.sort(() => Math.random() - 0.5);
      const selectedWrongGenders = shuffledWrongGenders.slice(0, quizDifficulty - 1);

      // 正确选项和错误选项
      const genderOptions: Array<{ gender: string; isCorrect: boolean }> = [
        { gender: correctGender, isCorrect: true },
        ...selectedWrongGenders.map(g => ({ gender: g, isCorrect: false })),
      ];
      const shuffledGenderOptions = genderOptions.sort(() => Math.random() - 0.5);

      options = shuffledGenderOptions.map(opt => ({
        word: { ...correctWord, chinese: opt.gender }, // 用词性作为选项显示
        isCorrect: opt.isCorrect
      }));
    } else if (quizType === "spelling") {
      // 拼写纠错题型
      // 题目显示中文，用户需要选择拼写正确的德语选项
      const correctSpelling = correctWord.german;

      // 生成拼写错误的选项
      const spellingErrors = new Set<string>();
      while (spellingErrors.size < quizDifficulty - 1) {
        const error = generateSpellingError(correctSpelling);
        if (error !== correctSpelling) {
          spellingErrors.add(error);
        }
      }

      // 正确选项是拼写正确的单词（isCorrect: true 表示选择正确）
      const spellingOptions: Array<{ spelling: string; isCorrect: boolean }> = [
        { spelling: correctSpelling, isCorrect: true }, // 正确拼写是正确答案
        ...Array.from(spellingErrors).map(err => ({ spelling: err, isCorrect: false })),
      ];
      const shuffledOptions = spellingOptions.sort(() => Math.random() - 0.5);

      options = shuffledOptions.map(opt => ({
        word: { ...correctWord, german: opt.spelling }, // 显示拼写
        isCorrect: opt.isCorrect
      }));
    } else {
      // 中文匹配或德中匹配题型
      const otherWords = wordsWithGender.filter((_, idx) =>
        filteredWords.indexOf(_) !== correctItem.originalIdx &&
        !usedWordIndices.includes(filteredWords.indexOf(_))
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongCount = Math.min(quizDifficulty - 1, otherWords.length);
      const wrongWords = shuffledOthers.slice(0, wrongCount);

      options = [
        { word: correctWord, isCorrect: true },
        ...wrongWords.map(w => ({ word: w, isCorrect: false })),
      ];
      options.sort(() => Math.random() - 0.5);
    }

    setQuizWord(correctWord);
    setQuizOptions(options);
    setSelectedOption(null);
    setQuizResult(null);
    setQuizTimeout(false);
    setUsedWordIndices(prev => [...prev, correctItem.originalIdx]);
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
  const startQuiz = async () => {
    setQuizStarted(true);
    setCurrentQuizNumber(1);
    setQuizFinished(false);
    setQuizTimeout(false);
    setQuizRecords([]); // 清空答题记录
    setUsedWordIndices([]); // 清空已出题目记录
    await generateQuiz();
  };

  // 选择答案
  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // 已选择过

    setSelectedOption(index);

    // 德中匹配和拼写纠错题型选择显示的是德语
    const selectedValue = quizType === "german" || quizType === "spelling"
      ? quizOptions[index].word.german
      : quizOptions[index].word.chinese;

    if (quizOptions[index].isCorrect) {
      setQuizResult("correct");
      playSound("correct");
      // 记录正确答题
      setQuizRecords(prev => [...prev, {
        german: quizWord!.german,
        chinese: quizWord!.chinese,
        selected: selectedValue,
        isCorrect: true,
        isTimeout: false,
        gender: quizWord!.gender
      }]);
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      // 记录错误答题
      setQuizRecords(prev => [...prev, {
        german: quizWord!.german,
        chinese: quizWord!.chinese,
        selected: selectedValue,
        isCorrect: false,
        isTimeout: false,
        gender: quizWord!.gender
      }]);
    }
  };

  // 下一题
  const nextQuiz = async () => {
    if (currentQuizNumber >= quizCount) {
      // 达到设定的题数，结束答题
      setQuizFinished(true);
      setTimerActive(false);
    } else {
      // AI 出题模式不需要检查本地词库
      if (useAiQuiz && quizType === "spelling") {
        setCurrentQuizNumber(prev => prev + 1);
        setQuizTimeout(false);
        setTimeLeft(quizTimer);
        setTimerActive(quizTimer > 0);
        await generateQuiz();
      } else {
        // 检查是否还有未出的题目
        const availableCount = filteredWords.length - usedWordIndices.length;
        if (availableCount <= 0) {
          setQuizFinished(true);
          setTimerActive(false);
        } else {
          setCurrentQuizNumber(prev => prev + 1);
          setQuizTimeout(false);
          setTimeLeft(quizTimer);
          setTimerActive(quizTimer > 0);
          await generateQuiz();
        }
      }
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
    setQuizRecords([]);
    setUsedWordIndices([]);
  };

  // 添加到错题本
  const addToWrongBook = () => {
    if (!quizWord) return;

    const newQuestion: WrongQuestion = {
      german: quizWord.german,
      chinese: quizWord.chinese,
      gender: quizWord.gender,
      addedAt: Date.now(),
    };

    // 检查是否已存在
    const exists = wrongBook.some(q => q.german === quizWord.german);
    if (!exists) {
      setWrongBook(prev => [...prev, newQuestion]);
    }
  };

  // 从错题本移除
  const removeFromWrongBook = (german: string) => {
    setWrongBook(prev => prev.filter(q => q.german !== german));
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
            {mode === "learn" ? "点击卡片查看释义和发音" :
             quizType === "german" ? "看中文选德语" :
             quizType === "spelling" ? "找出拼写错误的单词" :
             "选择正确的中文翻译"}
          </p>
        </header>

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
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
          <button
            onClick={() => setShowWrongBook(true)}
            className="px-6 py-2 rounded-full font-medium transition bg-white text-gray-700 border border-gray-300 hover:bg-red-50 relative"
          >
            📝 错题本
            {wrongBook.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {wrongBook.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowApiSettings(true)}
            className="px-6 py-2 rounded-full font-medium transition bg-white text-gray-700 border border-gray-300 hover:bg-purple-50 relative"
          >
            ⚙️ API 设置
            {deepseekApiKey && (
              <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* 错题本弹窗 */}
        {showWrongBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">📝 错题本</h2>
                <button
                  onClick={() => setShowWrongBook(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* 内容 */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {wrongBook.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-4">📭</div>
                    <p>错题本是空的</p>
                    <p className="text-sm">答错题目时可以点击"加入错题本"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wrongBook.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
                      >
                        <div className="flex items-center gap-3">
                          {item.gender && (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              item.gender === "der" ? "bg-blue-100 text-blue-700" :
                              item.gender === "die" ? "bg-red-100 text-red-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {item.gender}
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-blue-800">{item.german}</div>
                            <div className="text-gray-600">{item.chinese}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromWrongBook(item.german)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                          title="从错题本移除"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部 */}
              {wrongBook.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">共 {wrongBook.length} 个错题</span>
                    <button
                      onClick={() => setWrongBook([])}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
                    >
                      清空错题本
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DeepSeek API 设置弹窗 */}
        {showApiSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">⚙️ DeepSeek API 设置</h2>
                <button
                  onClick={() => setShowApiSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* 内容 */}
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={deepseekApiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="请输入 DeepSeek API Key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    获取 API Key：<a href="https://platform.deepseek.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">DeepSeek 官网</a>
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <h3 className="font-medium text-purple-800 mb-2">💡 用途说明</h3>
                  <p className="text-sm text-purple-700">
                    启用后，在"拼写纠错"题型中可以使用 AI 生成题目。AI 会从词库中随机选择德语单词，并生成各种拼写错误的选项供你练习。
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useAiQuiz}
                      onChange={(e) => setUseAiQuiz(e.target.checked)}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium">AI 出题模式</span>
                  </label>
                  {deepseekApiKey ? (
                    <span className="text-green-600 text-sm">✓ 已配置</span>
                  ) : (
                    <span className="text-gray-400 text-sm">未配置</span>
                  )}
                </div>
              </div>

              {/* 底部 */}
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowApiSettings(false)}
                  className="w-full py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition"
                >
                  保存并关闭
                </button>
              </div>
            </div>
          </div>
        )}

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

              <div className="mb-4">
                <span className="text-gray-700 font-medium block mb-2">题型</span>
                <div className="flex justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setQuizType("chinese")}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      quizType === "chinese"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    中德匹配
                  </button>
                  <button
                    onClick={() => setQuizType("german")}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      quizType === "german"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    德中匹配
                  </button>
                  <button
                    onClick={() => setQuizType("spelling")}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      quizType === "spelling"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-orange-50"
                    }`}
                  >
                    拼写纠错
                    {useAiQuiz && quizType === "spelling" && (
                      <span className="ml-1 text-xs">🤖</span>
                    )}
                  </button>
                  <button
                    onClick={() => setQuizType("gender")}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      quizType === "gender"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-purple-50"
                    }`}
                  >
                    词性匹配
                  </button>
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
                {quizRecords.map((record, idx) => {
                  const isInWrongBook = wrongBook.some(q => q.german === record.german);
                  // 德中匹配题型显示中文题目，拼写纠错显示中文题目，中德匹配显示德语题目
                  const questionText = quizType === "german" || quizType === "spelling"
                    ? record.chinese
                    : record.german;
                  // 拼写纠错题型需要特殊处理
                  const answerText = quizType === "spelling"
                    ? record.isCorrect
                      ? `${record.selected}`
                      : `${record.selected} → ${record.german}`
                    : quizType === "german"
                    ? record.german
                    : record.chinese;
                  return (
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
                            {questionText}
                          </div>
                          <div className="text-gray-600">
                            {quizType === "spelling" ? (
                              record.isCorrect ? (
                                <>选择了：{record.selected} ✓</>
                              ) : (
                                <>选择了 {record.selected}，正确：{record.german}</>
                              )
                            ) : (
                              <>正确答案：{answerText}</>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
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
                          {/* 加入错题本按钮 */}
                          <button
                            onClick={() => {
                              const exists = wrongBook.some(q => q.german === record.german);
                              if (!exists) {
                                setWrongBook(prev => [...prev, {
                                  german: record.german,
                                  chinese: record.chinese,
                                  gender: record.gender,
                                  addedAt: Date.now()
                                }]);
                              }
                            }}
                            className={`p-2 rounded-full transition ${
                              isInWrongBook
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                            title={isInWrongBook ? "已加入错题本" : "加入错题本"}
                          >
                            {isInWrongBook ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 答题模式：左右布局 */}
        {mode === "quiz" && quizStarted && !quizFinished && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* AI 生成题目时的加载状态 */}
            {isGeneratingQuiz ? (
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-4xl mb-4 animate-bounce">🤖</div>
                <p className="text-gray-600">AI 正在生成题目...</p>
              </div>
            ) : quizWord ? (
              // 左侧：题目和选项
              <>
                <div className="flex-1">
                  {/* 题目显示 */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-4 border-2 border-amber-100">
                    {useAiQuiz && quizType === "spelling" && (
                      <div className="mb-2 text-xs text-purple-600 bg-purple-50 rounded-full px-3 py-1 inline-block">
                        🤖 AI 出题
                      </div>
                    )}
                    <span className="text-sm text-gray-400 mb-2 block">
                      {quizType === "gender" ? "请选择对应的词性" :
                       quizType === "spelling" ? "请选择拼写正确的德语" :
                       quizType === "german" ? "请选择对应的德语" : "请选择对应的中文翻译"}
                    </span>
                <div className="flex items-center justify-center gap-4">
                  {quizType === "chinese" && quizWord.gender && (
                    <span className={`px-3 py-1 rounded-full text-xl font-bold ${
                      quizWord.gender === "der" ? "bg-blue-100 text-blue-700" :
                      quizWord.gender === "die" ? "bg-red-100 text-red-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {quizWord.gender}
                    </span>
                  )}
                  <h2 className="text-4xl font-bold text-blue-800">
                    {quizType === "german" ? quizWord.chinese :
                     quizType === "spelling" ? quizWord.chinese :
                     quizWord.german}
                  </h2>
                  {(quizType === "chinese" || quizType === "spelling") && (
                    <button
                      onClick={() => speak(quizWord.german)}
                      className="p-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
                      title="发音"
                    >
                      🔊
                    </button>
                  )}
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
                  // 德中匹配和拼写纠错显示德语，中德匹配显示中文，词性匹配显示词性
                  let optionLabel = quizType === "spelling" || quizType === "german"
                    ? option.word.german
                    : quizType === "gender"
                    ? option.word.chinese
                    : option.word.chinese;

                  // 词性匹配题型用不同颜色
                  if (quizType === "gender") {
                    if (optionLabel === "der") {
                      buttonClass += "bg-blue-50 border-blue-300 text-blue-700";
                    } else if (optionLabel === "die") {
                      buttonClass += "bg-red-50 border-red-300 text-red-700";
                    } else if (optionLabel === "das") {
                      buttonClass += "bg-green-50 border-green-300 text-green-700";
                    }
                    if (selectedOption === null && !quizTimeout) {
                      buttonClass += " hover:bg-blue-100 hover:border-blue-400";
                    }
                  } else if (quizType === "spelling") {
                    // 拼写纠错题型 - 选择拼写正确的单词
                    if (selectedOption !== null || quizTimeout) {
                      disabled = true;
                      if (option.isCorrect) {
                        // 选中正确拼写（正确）
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (idx === selectedOption && !option.isCorrect) {
                        // 选中了错误拼写（错误）
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                      }
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700";
                    }
                  } else {
                    // 中文匹配或德中匹配题型
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
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={disabled}
                      className={buttonClass}
                    >
                      {optionLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            </>
            ) : null}

            {/* 右侧：结果和下一题 */}
            <div className="lg:w-56 flex-shrink-0">
              {selectedOption !== null || quizTimeout ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center sticky top-4">
                  <p className={`text-2xl font-bold mb-4 ${
                    quizResult === "correct" ? "text-green-600" : "text-red-600"
                  }`}>
                    {quizResult === "correct" ? "✅ 正确" : "❌ 错误"}
                  </p>
                  {quizResult === "wrong" && (
                    <p className="text-gray-600 mb-4">
                      {quizType === "spelling" ? (
                        <>正确：<strong>{quizWord?.german}</strong></>
                      ) : (
                        <>正确：{quizType === "german"
                          ? quizOptions.find(o => o.isCorrect)?.word.german
                          : quizOptions.find(o => o.isCorrect)?.word.chinese}</>
                      )}
                    </p>
                  )}

                  {/* 错题本按钮 - 答错时显示 */}
                  {quizResult !== "correct" && (
                    <button
                      onClick={addToWrongBook}
                      className="w-full py-2 mb-3 bg-red-100 text-red-700 rounded-full font-medium hover:bg-red-200 transition flex items-center justify-center gap-2"
                    >
                      <span>📝</span>
                      {wrongBook.some(q => q.german === quizWord?.german)
                        ? "已加入错题本"
                        : "加入错题本"}
                    </button>
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
