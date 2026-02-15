"use client";

import { useState, useCallback, useEffect } from "react";

// 发音函数 - 使用 Python gTTS API
const speak = async (text: string) => {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch('/02-edu/001-language/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'de' })
    });

    const data = await response.json();

    if (data.audio) {
      const audio = new Audio(data.audio);
      await audio.play();
    } else {
      // 如果API失败，回退到浏览器语音
      fallbackSpeak(text);
    }
  } catch {
    // 如果出错，回退到浏览器语音
    fallbackSpeak(text);
  }
};

// 浏览器语音回退
const fallbackSpeak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.8;
  utterance.pitch = 1;

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

// 背景音乐播放器 - 使用全局变量
let bgMusicPlaying = false;
let bgMusicTimeout: ReturnType<typeof setTimeout> | null = null;

// 音乐风格配置
type MusicStyle = "cheerful" | "calm" | "tense" | "success" | "failure";

const musicStyles: Record<MusicStyle, { notes: number[]; durations: number[]; speed: number; type: OscillatorType }> = {
  // 欢快风格 - 上升音阶
  cheerful: {
    notes: [262, 294, 330, 349, 392, 440, 494, 523, 587, 659],
    durations: [200, 200, 200, 200, 200, 200, 200, 200, 200, 400],
    speed: 1,
    type: "sine"
  },
  // 放松风格 - 缓慢下降
  calm: {
    notes: [392, 370, 349, 330, 311, 294, 277, 262],
    durations: [500, 500, 500, 500, 500, 500, 500, 600],
    speed: 0.7,
    type: "sine"
  },
  // 紧张风格 - 快速重复
  tense: {
    notes: [220, 233, 247, 262, 277, 294],
    durations: [150, 150, 150, 150, 150, 150],
    speed: 1.5,
    type: "sawtooth"
  },
  // 成功风格 - 胜利音阶
  success: {
    notes: [523, 659, 784, 1047],
    durations: [200, 200, 200, 600],
    speed: 1,
    type: "square"
  },
  // 失败风格 - 下降音
  failure: {
    notes: [294, 277, 262, 247, 220, 196],
    durations: [200, 200, 200, 200, 300, 500],
    speed: 1,
    type: "sawtooth"
  }
};

const createBgMusicPlayer = (style: MusicStyle = "cheerful", onStop: () => void) => {
  if (typeof window === "undefined") return;

  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const config = musicStyles[style];
  let noteIndex = 0;

  const playNote = () => {
    if (!bgMusicPlaying) {
      onStop();
      return;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const freq = config.notes[noteIndex];
    const duration = config.durations[noteIndex] / config.speed;

    if (freq > 0) {
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000 * 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    }

    noteIndex = (noteIndex + 1) % config.notes.length;

    // 播放下一个音符
    bgMusicTimeout = setTimeout(() => {
      playNote();
    }, duration);
  };

  bgMusicPlaying = true;
  playNote();
};

const playMusicOnce = (style: MusicStyle) => {
  if (typeof window === "undefined") return;

  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const config = musicStyles[style];
  const ctx = new AudioContext();
  let startTime = ctx.currentTime;

  config.notes.forEach((freq, idx) => {
    const duration = config.durations[idx] / 1000 / config.speed;

    if (freq > 0) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }

    startTime += duration;
  });
};

const stopBgMusicPlayer = () => {
  bgMusicPlaying = false;
  if (bgMusicTimeout) {
    clearTimeout(bgMusicTimeout);
    bgMusicTimeout = null;
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
  verbSubcategory?: string; // 动词子分类
  example?: string; // 例句（仅动词需要）
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

  // 11-20
  { german: "Elf", chinese: "十一", pronunciation: "埃尔夫", category: "number" },
  { german: "Zwölf", chinese: "十二", pronunciation: "茨沃尔夫", category: "number" },
  { german: "Dreizehn", chinese: "十三", pronunciation: "德赖茨恩", category: "number" },
  { german: "Vierzehn", chinese: "十四", pronunciation: "菲尔茨恩", category: "number" },
  { german: "Fünfzehn", chinese: "十五", pronunciation: "芬夫茨恩", category: "number" },
  { german: "Sechzehn", chinese: "十六", pronunciation: "泽希茨恩", category: "number" },
  { german: "Siebzehn", chinese: "十七", pronunciation: "西普茨恩", category: "number" },
  { german: "Achtzehn", chinese: "十八", pronunciation: "阿希茨恩", category: "number" },
  { german: "Neunzehn", chinese: "十九", pronunciation: "诺因茨恩", category: "number" },
  { german: "Zwanzig", chinese: "二十", pronunciation: "茨万齐希", category: "number" },

  // 21-31
  { german: "Einundzwanzig", chinese: "二十一", pronunciation: "艾因翁特茨万齐希", category: "number" },
  { german: "Dreißig", chinese: "三十", pronunciation: "德赖西希", category: "number" },

  // 日期时间
  { german: "heute", chinese: "今天", pronunciation: "霍伊特", category: "date" },
  { german: "morgen", chinese: "明天", pronunciation: "莫根", category: "date" },
  { german: "gestern", chinese: "昨天", pronunciation: "格斯特恩", category: "date" },
  { german: "jetzt", chinese: "现在", pronunciation: "耶斯特", category: "date" },
  { german: "heute Abend", chinese: "今晚", pronunciation: "霍伊特 阿本特", category: "date" },
  { german: "morgen früh", chinese: "明天早上", pronunciation: "莫根 弗吕", category: "date" },
  { german: "am Wochenende", chinese: "在周末", pronunciation: "阿姆 沃肯恩德", category: "date" },

  // 星期
  { german: "Montag", chinese: "星期一", pronunciation: "蒙塔克", category: "week", example: "Heute ist Montag. Ich gehe zur Arbeit." },
  { german: "Dienstag", chinese: "星期二", pronunciation: "丁斯塔克", category: "week", example: "Am Dienstag habe ich Deutschkurs." },
  { german: "Mittwoch", chinese: "星期三", pronunciation: "米特沃克", category: "week", example: "Am Mittwoch gehe ich ins Fitnessstudio." },
  { german: "Donnerstag", chinese: "星期四", pronunciation: "多讷斯塔克", category: "week", example: "Donnerstag ist mein Lieblingstag." },
  { german: "Freitag", chinese: "星期五", pronunciation: "弗赖塔克", category: "week", example: "Ich arbeite von Montag bis Freitag." },
  { german: "Samstag", chinese: "星期六", pronunciation: "扎姆斯塔克", category: "week", example: "Am Samstag kaufe ich ein." },
  { german: "Sonntag", chinese: "星期日", pronunciation: "宗塔克", category: "week", example: "Am Sonntag ruhe ich mich aus." },

  // 月份
  { german: "Januar", chinese: "一月", pronunciation: "亚努阿", category: "month" },
  { german: "Februar", chinese: "二月", pronunciation: "费布鲁阿", category: "month" },
  { german: "März", chinese: "三月", pronunciation: "梅尔茨", category: "month" },
  { german: "April", chinese: "四月", pronunciation: "阿普里尔", category: "month" },
  { german: "Mai", chinese: "五月", pronunciation: "迈", category: "month" },
  { german: "Juni", chinese: "六月", pronunciation: "尤尼", category: "month" },
  { german: "Juli", chinese: "七月", pronunciation: "尤利", category: "month" },
  { german: "August", chinese: "八月", pronunciation: "奥古斯特", category: "month" },
  { german: "September", chinese: "九月", pronunciation: "zeptember", category: "month" },
  { german: "Oktober", chinese: "十月", pronunciation: "奥克托伯", category: "month" },
  { german: "November", chinese: "十一月", pronunciation: "诺韦姆伯", category: "month" },
  { german: "Dezember", chinese: "十二月", pronunciation: "德策姆伯", category: "month" },

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

  // ============ 动词（按语义分类） ============

  // 日常动作
  { german: "arbeiten", chinese: "工作", pronunciation: "阿尔贝滕", category: "verb", verbSubcategory: "daily", example: "Ich arbeite in einem Büro." },
  { german: "essen", chinese: "吃", pronunciation: "埃森", category: "verb", verbSubcategory: "daily", example: "Ich esse einen Apfel." },
  { german: "schlafen", chinese: "睡觉", pronunciation: "施拉芬", category: "verb", verbSubcategory: "daily", example: "Ich schlafe acht Stunden." },
  { german: "gehen", chinese: "去、走", pronunciation: "格恩", category: "verb", verbSubcategory: "daily", example: "Ich gehe zur Schule." },
  { german: "kommen", chinese: "来", pronunciation: "科门", category: "verb", verbSubcategory: "daily", example: "Ich komme aus Deutschland." },
  { german: "laufen", chinese: "跑", pronunciation: "劳芬", category: "verb", verbSubcategory: "daily", example: "Ich laufe im Park." },
  { german: "sitzen", chinese: "坐", pronunciation: "西岑", category: "verb", verbSubcategory: "daily", example: "Ich sitze auf dem Stuhl." },
  { german: "stehen", chinese: "站、立", pronunciation: "施泰恩", category: "verb", verbSubcategory: "daily", example: "Ich stehe vor der Tür." },
  { german: "liegen", chinese: "躺、放", pronunciation: "利根", category: "verb", verbSubcategory: "daily", example: "Das Buch liegt auf dem Tisch." },
  { german: "waschen", chinese: "洗", pronunciation: "瓦申", category: "verb", verbSubcategory: "daily", example: "Ich wasche meine Hände." },
  { german: "trinken", chinese: "喝", pronunciation: "特林肯", category: "verb", verbSubcategory: "daily", example: "Ich trinke Wasser." },
  { german: "leben", chinese: "生活、居住", pronunciation: "莱本", category: "verb", verbSubcategory: "daily", example: "Ich lebe in Berlin." },

  // 交流沟通
  { german: "sagen", chinese: "说、告诉", pronunciation: "扎根", category: "verb", verbSubcategory: "communication", example: "Ich sage dir die Wahrheit." },
  { german: "fragen", chinese: "问、询问", pronunciation: "弗拉根", category: "verb", verbSubcategory: "communication", example: "Ich frage dich etwas." },
  { german: "antworten", chinese: "回答、答复", pronunciation: "安特沃滕", category: "verb", verbSubcategory: "communication", example: "Er antwortet schnell." },
  { german: "sprechen", chinese: "说、讲话", pronunciation: "施普雷亨", category: "verb", verbSubcategory: "communication", example: "Ich spreche Deutsch." },
  { german: "reden", chinese: "说话、谈话", pronunciation: "雷登", category: "verb", verbSubcategory: "communication", example: "Wir reden über das Thema." },
  { german: "rufen", chinese: "喊、叫", pronunciation: "鲁芬", category: "verb", verbSubcategory: "communication", example: "Er ruft meinen Namen." },
  { german: "schreiben", chinese: "写", pronunciation: "施莱本", category: "verb", verbSubcategory: "communication", example: "Ich schreibe einen Brief." },
  { german: "lesen", chinese: "读", pronunciation: "莱森", category: "verb", verbSubcategory: "communication", example: "Ich lese ein Buch." },
  { german: "zuhören", chinese: "倾听", pronunciation: "茨霍伦", category: "verb", verbSubcategory: "communication", example: "Hör mir zu!" },
  { german: "bestellen", chinese: "订购、点餐", pronunciation: "贝施泰伦", category: "verb", verbSubcategory: "communication", example: "Ich bestelle ein Bier." },
  { german: "besuchen", chinese: "访问、拜访", pronunciation: "贝祖肯", category: "verb", verbSubcategory: "communication", example: "Ich besuche meine Freunde." },

  // 获得/给予
  { german: "bekommen", chinese: "得到、收到", pronunciation: "贝孔门", category: "verb", verbSubcategory: "exchange", example: "Ich bekomme ein Geschenk." },
  { german: "geben", chinese: "给", pronunciation: "格本", category: "verb", verbSubcategory: "exchange", example: "Ich gebe dir das Buch." },
  { german: "nehmen", chinese: "拿、取", pronunciation: "内门", category: "verb", verbSubcategory: "exchange", example: "Ich nehme den Bus." },
  { german: "bringen", chinese: "带来", pronunciation: "布林根", category: "verb", verbSubcategory: "exchange", example: "Bring mir bitte Wasser." },
  { german: "leihen", chinese: "借（出/入）", pronunciation: "莱恩", category: "verb", verbSubcategory: "exchange", example: "Ich leihe mir ein Buch." },
  { german: "senden", chinese: "发送、寄", pronunciation: "森登", category: "verb", verbSubcategory: "exchange", example: "Ich sende eine E-Mail." },
  { german: "kaufen", chinese: "买", pronunciation: "考芬", category: "verb", verbSubcategory: "exchange", example: "Ich kaufe Brot." },
  { german: "bezahlen", chinese: "支付、付款", pronunciation: "贝察伦", category: "verb", verbSubcategory: "exchange", example: "Ich bezahle die Rechnung." },

  // 认知思考
  { german: "wissen", chinese: "知道（事实）", pronunciation: "维森", category: "verb", verbSubcategory: "cognitive", example: "Ich weiß die Antwort." },
  { german: "kennen", chinese: "认识、知道（人）", pronunciation: "肯嫩", category: "verb", verbSubcategory: "cognitive", example: "Ich kenne ihn gut." },
  { german: "denken", chinese: "思考、认为", pronunciation: "登肯", category: "verb", verbSubcategory: "cognitive", example: "Ich denke, das ist gut." },
  { german: "glauben", chinese: "相信、认为", pronunciation: "格劳本", category: "verb", verbSubcategory: "cognitive", example: "Ich glaube dir." },
  { german: "finden", chinese: "找到、觉得", pronunciation: "芬登", category: "verb", verbSubcategory: "cognitive", example: "Ich finde das Buch." },
  { german: "verstehen", chinese: "理解、懂", pronunciation: "费尔施泰恩", category: "verb", verbSubcategory: "cognitive", example: "Ich verstehe dich." },
  { german: "lernen", chinese: "学习", pronunciation: "勒尔嫩", category: "verb", verbSubcategory: "cognitive", example: "Ich lerne Deutsch." },
  { german: "studieren", chinese: "大学学习、研究", pronunciation: "施图迪尔恩", category: "verb", verbSubcategory: "cognitive", example: "Ich studiere Medizin." },
  { german: "heißen", chinese: "叫做、意味着", pronunciation: "海森", category: "verb", verbSubcategory: "cognitive", example: "Ich heiße Peter." },
  { german: "nennen", chinese: "命名、称为", pronunciation: "内嫩", category: "verb", verbSubcategory: "cognitive", example: "Er nennt es ein Problem." },

  // 情感/意愿
  { german: "mögen", chinese: "喜欢、想要", pronunciation: "梅根", category: "verb", verbSubcategory: "emotion", example: "Ich mag Katzen." },
  { german: "wollen", chinese: "想要、愿意", pronunciation: "沃伦", category: "verb", verbSubcategory: "emotion", example: "Ich will nach Hause." },
  { german: "müssen", chinese: "必须", pronunciation: "米森", category: "verb", verbSubcategory: "emotion", example: "Ich muss arbeiten." },
  { german: "sollen", chinese: "应该", pronunciation: "佐伦", category: "verb", verbSubcategory: "emotion", example: "Du solltest kommen." },
  { german: "dürfen", chinese: "可以、允许", pronunciation: "杜尔芬", category: "verb", verbSubcategory: "emotion", example: "Du darfst hier rauchen." },
  { german: "wünschen", chinese: "希望、祝愿", pronunciation: "温申", category: "verb", verbSubcategory: "emotion", example: "Ich wünsche dir Glück." },
  { german: "hoffen", chinese: "希望、期望", pronunciation: "霍芬", category: "verb", verbSubcategory: "emotion", example: "Ich hoffe auf besseres Wetter." },
  { german: "lieben", chinese: "爱", pronunciation: "利本", category: "verb", verbSubcategory: "emotion", example: "Ich liebe dich." },
  { german: "hassen", chinese: "恨、讨厌", pronunciation: "哈森", category: "verb", verbSubcategory: "emotion", example: "Ich hasse Spam." },
  { german: "fürchten", chinese: "害怕、担心", pronunciation: "菲尔希滕", category: "verb", verbSubcategory: "emotion", example: "Ich fürchte das Dunkel." },
  { german: "weinen", chinese: "哭", pronunciation: "瓦伊嫩", category: "verb", verbSubcategory: "emotion", example: "Das Baby weint." },
  { german: "lachen", chinese: "笑", pronunciation: "拉亨", category: "verb", verbSubcategory: "emotion", example: "Wir lachen viel." },

  // 动作/移动
  { german: "machen", chinese: "做、制作", pronunciation: "马亨", category: "verb", verbSubcategory: "action", example: "Ich mach das Fenster zu." },
  { german: "tun", chinese: "做", pronunciation: "图恩", category: "verb", verbSubcategory: "action", example: "Was tust du hier?" },
  { german: "beginnen", chinese: "开始", pronunciation: "贝金嫩", category: "verb", verbSubcategory: "action", example: "Der Film beginnt um 8 Uhr." },
  { german: "aufhören", chinese: "停止、结束", pronunciation: "奥夫霍伦", category: "verb", verbSubcategory: "action", example: "Hör damit auf!" },
  { german: "legen", chinese: "（平）放", pronunciation: "莱根", category: "verb", verbSubcategory: "action", example: "Ich leg das Buch hin." },
  { german: "stellen", chinese: "（竖）放", pronunciation: "施泰伦", category: "verb", verbSubcategory: "action", example: "Stell die Vase hin." },
  { german: "setzen", chinese: "使坐下", pronunciation: "泽岑", category: "verb", verbSubcategory: "action", example: "Ich setze mich hin." },
  { german: "ziehen", chinese: "拉、抽", pronunciation: "茨根", category: "verb", verbSubcategory: "action", example: "Zieh die Tür zu." },
  { german: "tragen", chinese: "穿、搬运", pronunciation: "特拉根", category: "verb", verbSubcategory: "action", example: "Ich trage einen Hut." },
  { german: "werfen", chinese: "扔、抛", pronunciation: "韦尔芬", category: "verb", verbSubcategory: "action", example: "Er wirft den Ball." },
  { german: "treffen", chinese: "遇见、碰见", pronunciation: "特雷芬", category: "verb", verbSubcategory: "action", example: "Wir treffen uns um 6." },
  { german: "suchen", chinese: "寻找", pronunciation: "祖希", category: "verb", verbSubcategory: "action", example: "Ich suche meinen Schlüssel." },
  { german: "helfen", chinese: "帮助", pronunciation: "赫尔芬", category: "verb", verbSubcategory: "action", example: "Ich helfe dir gern." },
  { german: "warten", chinese: "等待", pronunciation: "瓦尔滕", category: "verb", verbSubcategory: "action", example: "Ich warte auf dich." },
  { german: "benutzen", chinese: "使用", pronunciation: "贝努岑", category: "verb", verbSubcategory: "action", example: "Benutzt du das Telefon?" },
  { german: "zeigen", chinese: "展示、显示", pronunciation: "蔡根", category: "verb", verbSubcategory: "action", example: "Zeig mir das Bild." },
  { german: "öffnen", chinese: "打开", pronunciation: "奥夫嫩", category: "verb", verbSubcategory: "action", example: "Öffne die Tür!" },
  { german: "schließen", chinese: "关闭、锁上", pronunciation: "施利森", category: "verb", verbSubcategory: "action", example: "Schließ das Fenster." },
  { german: "springen", chinese: "跳", pronunciation: "施普林根", category: "verb", verbSubcategory: "action", example: "Er springt hoch." },
  { german: "fallen", chinese: "落下、跌倒", pronunciation: "法伦", category: "verb", verbSubcategory: "action", example: "Der Apfel fällt." },

  // 变化/状态
  { german: "werden", chinese: "变成、成为", pronunciation: "韦尔登", category: "verb", verbSubcategory: "change", example: "Ich werde Arzt." },
  { german: "bleiben", chinese: "保持、停留", pronunciation: "布莱本", category: "verb", verbSubcategory: "change", example: "Ich bleibe hier." },
  { german: "wachsen", chinese: "生长", pronunciation: "瓦克森", category: "verb", verbSubcategory: "change", example: "Die Pflanze wächst." },
  { german: "sterben", chinese: "死、死亡", pronunciation: "施泰尔本", category: "verb", verbSubcategory: "change", example: "Er ist vor drei Jahren gestorben." },
  { german: "ändern", chinese: "改变、变化", pronunciation: "恩德恩", category: "verb", verbSubcategory: "change", example: "Änder das nicht!" },

  // 感官/感知
  { german: "sehen", chinese: "看", pronunciation: "泽恩", category: "verb", verbSubcategory: "sense", example: "Ich sehe dich." },
  { german: "hören", chinese: "听", pronunciation: "霍伦", category: "verb", verbSubcategory: "sense", example: "Ich höre Musik." },
  { german: "fühlen", chinese: "感觉、触摸", pronunciation: "菲伦", category: "verb", verbSubcategory: "sense", example: "Ich fühle mich gut." },
  { german: "riechen", chinese: "闻、嗅", pronunciation: "里希恩", category: "verb", verbSubcategory: "sense", example: "Es riecht gut hier." },
  { german: "schmecken", chinese: "品尝、好吃", pronunciation: "施梅肯", category: "verb", verbSubcategory: "sense", example: "Das schmeckt lecker." },

  // 辅助动词
  { german: "sein", chinese: "是、在", pronunciation: "宰恩", category: "verb", verbSubcategory: "auxiliary", example: "Ich bin müde." },
  { german: "haben", chinese: "有", pronunciation: "哈本", category: "verb", verbSubcategory: "auxiliary", example: "Ich habe Zeit." },
  { german: "können", chinese: "能够、会", pronunciation: "克能", category: "verb", verbSubcategory: "auxiliary", example: "Ich kann schwimmen." },
  { german: "dürfen", chinese: "可以、允许", pronunciation: "杜尔芬", category: "verb", verbSubcategory: "auxiliary", example: "Hier darf man nicht rauchen." },
  { german: "müssen", chinese: "必须", pronunciation: "米森", category: "verb", verbSubcategory: "auxiliary", example: "Du musst jetzt gehen." },
  { german: "sollen", chinese: "应该", pronunciation: "佐伦", category: "verb", verbSubcategory: "auxiliary", example: "Du sollst zum Arzt gehen." },
  { german: "wollen", chinese: "想要", pronunciation: "沃伦", category: "verb", verbSubcategory: "auxiliary", example: "Ich will ein Eis." },
  { german: "mögen", chinese: "喜欢、想要", pronunciation: "梅根", category: "verb", verbSubcategory: "auxiliary", example: "Ich möchte Kaffee." },
  { german: "lassen", chinese: "让、使", pronunciation: "拉森", category: "verb", verbSubcategory: "auxiliary", example: "Lass mich in Ruhe!" },
];

const categories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候语" },
  { id: "number", name: "数字" },
  { id: "date", name: "日期时间" },
  { id: "week", name: "星期" },
  { id: "month", name: "月份" },
  { id: "color", name: "颜色" },
  { id: "family", name: "家庭" },
  { id: "verb", name: "动词" },
];

// 动词子分类
const verbCategories = [
  { id: "daily", name: "日常动作" },
  { id: "communication", name: "交流沟通" },
  { id: "exchange", name: "获得/给予" },
  { id: "cognitive", name: "认知思考" },
  { id: "emotion", name: "情感/意愿" },
  { id: "action", name: "动作/移动" },
  { id: "change", name: "变化/状态" },
  { id: "sense", name: "感官/感知" },
  { id: "auxiliary", name: "辅助动词" },
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
  const [selectedVerbSubcategory, setSelectedVerbSubcategory] = useState<string | null>(null); // 动词子分类
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [quizDifficulty, setQuizDifficulty] = useState<2 | 3 | 4>(2);
  const [quizCount, setQuizCount] = useState(5); // 答题数量
  const [quizType, setQuizType] = useState<"chinese" | "german" | "gender" | "spelling" | "input" | "verb" | "sentence" | "listening" | "listeningArticle" | "weekdayLogic" | "monthLogic" | "phoneNumber">("chinese"); // 题目类型
  const [quizTimer, setQuizTimer] = useState<0 | 5 | 7 | 10>(0); // 倒计时秒数
  const [currentQuizNumber, setCurrentQuizNumber] = useState(1); // 当前第几题
  const [quizWord, setQuizWord] = useState<Word | null>(null);
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userInput, setUserInput] = useState(""); // 用户输入（听写题型）
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
  const [bgMusicEnabled, setBgMusicEnabled] = useState(false); // 背景音乐开关
  const [bgMusicStyle, setBgMusicStyle] = useState<"cheerful" | "calm" | "tense">("cheerful"); // 音乐风格
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false); // 背景音乐是否在播放

  // 句子填空题型数据
  const [sentenceQuiz, setSentenceQuiz] = useState<{
    sentence: string; // 带空格的句子
    missingWord: string; // 正确答案
    options: string[]; // 选项
    chinese: string; // 中文翻译
  } | null>(null);

  // 记录已使用过的句子（用于去重）
  const [usedSentenceSentences, setUsedSentenceSentences] = useState<string[]>([]);

  // 是否显示句子中文翻译
  const [showSentenceChinese, setShowSentenceChinese] = useState(false);

  // 是否显示听力句子内容
  const [showListeningSentence, setShowListeningSentence] = useState(false);

  // 听力练习数据（通用）
  const [listeningTarget, setListeningTarget] = useState<Word | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 短文听力理解题型数据
  const [listeningArticleData, setListeningArticleData] = useState<{
    sentence: string;
    chinese: string;
    weekday: string;
    sentenceTemplate: string;
  } | null>(null);

  // 星期逻辑推理题型数据
  const [weekdayLogicData, setWeekdayLogicData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
    relation: string; // yesterday, today, tomorrow
    baseWeekday: string;
  } | null>(null);

  // 是否显示星期推理文本
  const [showWeekdayLogicText, setShowWeekdayLogicText] = useState(false);

  // 月份逻辑推理题型数据
  const [monthLogicData, setMonthLogicData] = useState<{
    question: string;
    questionChinese: string;
    answer: string;
    answerChinese: string;
    relation: string; // previousMonth, nextMonth
    baseMonth: string;
  } | null>(null);

  // 是否显示月份推理文本
  const [showMonthLogicText, setShowMonthLogicText] = useState(false);

  // 电话号码练习数据
  const [phoneNumberData, setPhoneNumberData] = useState<{
    phoneNumber: string;      // 电话号码，如 "0151 2345 6789"
    germanText: string;       // 德语读法，如 "null eins fünf / zwei drei vier fünf / sechs sieben acht neun"
    formattedNumber: string;  // 格式化后的号码
  } | null>(null);

  // 用户输入的电话号码
  const [phoneNumberInput, setPhoneNumberInput] = useState("");

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

  // 全局键盘事件：按回车键下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在答题模式、已开始、未结束时生效
      if (mode !== "quiz" || !quizStarted || quizFinished) return;

      // 判断是否已回答当前题目
      const isAnswered = selectedOption !== null || quizTimeout || quizResult !== null;

      if (e.key === "Enter" && isAnswered) {
        e.preventDefault();
        nextQuiz();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, quizStarted, quizFinished, selectedOption, quizTimeout, quizResult]);
  // 背景音乐控制
  useEffect(() => {
    // 答题开始时播放音乐
    if (mode === "quiz" && quizStarted && !quizFinished && bgMusicEnabled) {
      stopBgMusicPlayer();
      createBgMusicPlayer(bgMusicStyle, () => setBgMusicPlaying(false));
    } else {
      stopBgMusicPlayer();
    }
  }, [mode, quizStarted, quizFinished, bgMusicEnabled, bgMusicStyle]);

  // 答题结果音效
  useEffect(() => {
    if (quizResult === "correct" && bgMusicEnabled) {
      playMusicOnce("success");
    } else if (quizResult === "wrong" && bgMusicEnabled) {
      playMusicOnce("failure");
    }
  }, [quizResult, bgMusicEnabled]);

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

  // 调用 DeepSeek API 生成句子填空题目
  const generateSentenceQuiz = async (): Promise<{
    sentence: string;
    missingWord: string;
    options: string[];
    chinese: string;
  } | null> => {
    if (!deepseekApiKey) {
      alert("请先设置 DeepSeek API Key");
      return null;
    }

    // 根据当前选择的类别筛选词汇
    let availableWords = words;
    if (selectedCategory !== "all") {
      availableWords = words.filter(w => w.category === selectedCategory);
      // 如果是动词分类且选中了子分类，进一步筛选
      if (selectedCategory === "verb" && selectedVerbSubcategory) {
        availableWords = availableWords.filter(w => w.verbSubcategory === selectedVerbSubcategory);
      }
    }

    // 如果词汇太少，使用全部词汇
    if (availableWords.length < 3) {
      availableWords = words.slice(0, 50);
    }

    const wordTexts = availableWords.map(w => `${w.german} (${w.chinese})`).join(", ");
    console.log("用于生成句子的词汇:", wordTexts.slice(0, 200));

    setIsGeneratingQuiz(true);

    // 尝试生成不重复的题目，最多尝试 3 次
    let attempts = 0;
    const maxAttempts = 3;
    let result = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`尝试第 ${attempts} 次生成题目...`);

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
                content: `你是一个德语学习助手。请生成一个德语句子填空题目，基于以下词汇表生成简单句子。

生成规则（必须严格遵守）：
1. 随机选择以下元素组合成句子：
   - 主语（ich / du / er / sie / wir）
   - 时间状语（heute / morgen / jetzt / am Abend / um 7 Uhr）
   - 地点状语（zu Hause / im Büro / in der Schule / in der Stadt）
   - 句型类型（陈述句 / 疑问句 / 否定句）

2. 句型模板（随机选择一种）：
   - 陈述句：___ + 动词 + 主语/时间/地点
   - 疑问句：动词 + 主语 + ___ + 时间/地点？
   - 否定句：___ + 动词 + nicht + 主语 + 时间/地点

3. 如果生成的句型结构与之前相似，必须强制改写为完全不同的句型

返回 JSON 对象：
- sentence: 带空格的完整句子，使用 "___" 表示需要填写的单词位置
- missingWord: 正确答案（德语单词，从词汇表中选择）
- options: 4个选项，包含正确答案和3个干扰项（从词汇表中随机选择不同词性的词）
- chinese: 句子的中文翻译

要求：
1. 句子要简单，适合初学者
2. 动词放在第二位（德语句子基本语序）
3. 每个句子必须包含主语、时间状语、地点状语中的至少两种成分
4. 返回纯 JSON，不要 markdown 代码块`
              },
              {
                role: "user",
                content: `基于以下词汇生成 1 个多样化句型的句子填空题目（必须包含主语、时间状语、地点状语中的至少两种）：\n${wordTexts.slice(0, 500)}`
              }
            ],
            temperature: 1.0, // 提高温度，增加随机性
            max_tokens: 300,
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
        const quizData = JSON.parse(content);

        // 验证数据
        if (!quizData.sentence || !quizData.missingWord || !quizData.options) {
          throw new Error("返回数据格式错误");
        }

        const quizResult = {
          sentence: quizData.sentence,
          missingWord: quizData.missingWord,
          options: quizData.options.slice(0, 4),
          chinese: quizData.chinese || "",
        };

        // 检查是否已使用过
        if (usedSentenceSentences.includes(quizResult.sentence)) {
          console.log("题目重复，重新生成...");
          if (attempts >= maxAttempts) {
            console.log("已达到最大尝试次数");
          }
          continue; // 继续下一次尝试
        }

        console.log("最终返回的题目:", quizResult);
        result = quizResult;
        break; // 成功生成，跳出循环
      } catch (error) {
        console.error(`第 ${attempts} 次尝试失败:`, error);
        if (attempts >= maxAttempts) {
          alert("AI 生成句子题目失败，请检查 API Key 或网络连接");
        }
      }
    }

    setIsGeneratingQuiz(false);
    console.log("generateSentenceQuiz 完成，返回:", result);
    return result;
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

  // 过滤单词（支持动词子分类）
  const filteredWords = (() => {
    if (selectedCategory === "all") {
      return words;
    }
    let result = words.filter(w => w.category === selectedCategory);
    // 如果是动词分类且选中了子分类
    if (selectedCategory === "verb" && selectedVerbSubcategory) {
      result = result.filter(w => w.verbSubcategory === selectedVerbSubcategory);
    }
    return result;
  })();

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
          if (quizType === "sentence") {
            setQuizRecords(prev => [...prev, {
              german: sentenceQuiz?.missingWord || "",
              chinese: sentenceQuiz?.chinese || "",
              selected: null,
              isCorrect: false,
              isTimeout: true,
            }]);
          } else {
            setQuizRecords(prev => [...prev, {
              german: quizWord!.german,
              chinese: quizWord!.chinese,
              selected: null,
              isCorrect: false,
              isTimeout: true,
              gender: quizWord!.gender
            }]);
          }
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
    console.log("generateQuiz called, quizType:", quizType, "useAiQuiz:", useAiQuiz);

    // 听力练习题型（所有词汇）
    if (quizType === "listening") {
      const currentFilteredWords = filteredWords;
      if (currentFilteredWords.length < 2) {
        alert("词汇不足，无法进行听力练习");
        return;
      }

      // 获取未出过的题目索引
      const availableIndices = currentFilteredWords
        .map((_, idx) => idx)
        .filter(idx => !usedWordIndices.includes(idx));

      if (availableIndices.length === 0) {
        alert("所有词汇都已练习过了！");
        return;
      }

      // 随机选择一个正确答案
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const targetWord = currentFilteredWords[randomIndex];

      // 生成错误选项（基于难度）
      const otherWords = currentFilteredWords.filter((_, idx) =>
        !usedWordIndices.includes(idx) && idx !== randomIndex
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongCount = Math.min(quizDifficulty - 1, otherWords.length);
      const wrongWords = shuffledOthers.slice(0, wrongCount);

      // 组合选项并打乱
      const options = [
        { word: targetWord, isCorrect: true },
        ...wrongWords.map(w => ({ word: w, isCorrect: false })),
      ];
      options.sort(() => Math.random() - 0.5);

      // 记录已使用的索引
      setUsedWordIndices(prev => [...prev, randomIndex]);

      setListeningTarget(targetWord);
      setQuizOptions(options);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 自动播放读音
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(targetWord.german);
        setTimeout(() => setIsPlayingAudio(false), 1500);
      }, 300);
      return;
    }

    // 短文听力理解题型（句子填空听力）
    if (quizType === "listeningArticle") {
      // 星期词汇
      const weekdays = [
        { german: "Montag", chinese: "星期一" },
        { german: "Dienstag", chinese: "星期二" },
        { german: "Mittwoch", chinese: "星期三" },
        { german: "Donnerstag", chinese: "星期四" },
        { german: "Freitag", chinese: "星期五" },
        { german: "Samstag", chinese: "星期六" },
        { german: "Sonntag", chinese: "星期日" },
      ];

      // 月份词汇
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

      // 根据选择的类别决定是星期还是月份
      let useMonths: boolean;
      if (selectedCategory === "month") {
        useMonths = true;
      } else if (selectedCategory === "week") {
        useMonths = false;
      } else {
        // 默认或其他类别时随机选择
        useMonths = Math.random() > 0.5;
      }

      const wordList = useMonths ? months : weekdays;

      // 句子模板（星期）
      const weekdayTemplates = [
        { template: "Ich lerne Deutsch am ______.", chinese: "我每周_____学习德语。" },
        { template: "Ich gehe am ______ zur Arbeit.", chinese: "我每周_____去上班。" },
        { template: "Ich gehe am ______ ins Fitnessstudio.", chinese: "我每周_____去健身房。" },
        { template: "Ich esse am ______ mit meiner Familie.", chinese: "我每周_____和家人一起吃饭。" },
        { template: "Ich ruhe mich am ______ aus.", chinese: "我每周_____休息。" },
      ];

      // 句子模板（月份）
      const monthTemplates = [
        { template: "Im ______ bin ich in Urlaub.", chinese: "_____我在度假。" },
        { template: "Im ______ feiere ich meinen Geburtstag.", chinese: "_____我庆祝我的生日。" },
        { template: "Im ______ beginnt das neue Schuljahr.", chinese: "_____新学年开始了。" },
        { template: "Im ______ ist es sehr kalt.", chinese: "_____天气很冷。" },
        { template: "Im ______ ist es sehr warm.", chinese: "_____天气很热。" },
      ];

      const sentenceTemplates = useMonths ? monthTemplates : weekdayTemplates;

      // 随机选择一个句子模板
      const shuffledTemplates = [...sentenceTemplates].sort(() => Math.random() - 0.5);
      const selectedTemplate = shuffledTemplates[0];

      // 随机选择一个词
      const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
      const selectedWord = shuffledWords[0];

      // 填充句子
      const filledSentence = selectedTemplate.template.replace("______", selectedWord.german);

      // 生成错误选项
      const otherWords = wordList.filter(w => w.german !== selectedWord.german);
      const shuffledWrong = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongCount = Math.min(quizDifficulty - 1, otherWords.length);
      const wrongOptions = shuffledWrong.slice(0, wrongCount);

      // 组合选项并打乱
      const options = [
        { word: { german: selectedWord.german, chinese: selectedWord.chinese } as Word, isCorrect: true },
        ...wrongOptions.map(w => ({ word: { german: w.german, chinese: w.chinese } as Word, isCorrect: false })),
      ];
      options.sort(() => Math.random() - 0.5);

      setListeningArticleData({
        sentence: filledSentence,
        chinese: selectedTemplate.chinese,
        weekday: selectedWord.german,
        sentenceTemplate: selectedTemplate.template,
      });
      setQuizOptions(options);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 播放句子
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(filledSentence);
        setTimeout(() => setIsPlayingAudio(false), 2000);
      }, 300);
      return;
    }

    // 星期逻辑推理题型
    if (quizType === "weekdayLogic") {
      // 星期词汇表
      const weekdays = [
        { german: "Montag", chinese: "星期一", index: 0 },
        { german: "Dienstag", chinese: "星期二", index: 1 },
        { german: "Mittwoch", chinese: "星期三", index: 2 },
        { german: "Donnerstag", chinese: "星期四", index: 3 },
        { german: "Freitag", chinese: "星期五", index: 4 },
        { german: "Samstag", chinese: "星期六", index: 5 },
        { german: "Sonntag", chinese: "星期日", index: 6 },
      ];

      // 随机选择一个基础星期
      const shuffledWeekdays = [...weekdays].sort(() => Math.random() - 0.5);
      const baseWeekday = shuffledWeekdays[0];

      // 随机选择关系类型：yesterday 或 tomorrow
      const relations = ["yesterday", "tomorrow"];
      const shuffledRelations = [...relations].sort(() => Math.random() - 0.5);
      const relation = shuffledRelations[0];

      // 计算答案星期
      let answerIndex: number;
      let questionText: string;
      let questionChinese: string;

      if (relation === "yesterday") {
        // 昨天是 baseWeekday，今天是 baseWeekday + 1
        answerIndex = (baseWeekday.index + 1) % 7;
        questionText = `Gestern war ${baseWeekday.german}. Heute ist ?.`;
        questionChinese = `昨天是${baseWeekday.chinese}，今天是星期几？`;
      } else {
        // tomorrow: 明天是 baseWeekday，今天是 baseWeekday - 1 = baseWeekday + 6
        answerIndex = (baseWeekday.index + 6) % 7;
        questionText = `Morgen ist ${baseWeekday.german}. Heute ist ?.`;
        questionChinese = `明天是${baseWeekday.chinese}，今天是星期几？`;
      }

      const answerWeekday = weekdays[answerIndex];

      // 生成错误选项（排除正确答案）
      const otherWeekdays = weekdays.filter(w => w.index !== answerIndex);
      const shuffledWrong = [...otherWeekdays].sort(() => Math.random() - 0.5);
      const wrongCount = Math.min(quizDifficulty - 1, otherWeekdays.length);
      const wrongOptions = shuffledWrong.slice(0, wrongCount);

      // 组合选项并打乱
      const options = [
        { word: { german: answerWeekday.german, chinese: answerWeekday.chinese } as Word, isCorrect: true },
        ...wrongOptions.map(w => ({ word: { german: w.german, chinese: w.chinese } as Word, isCorrect: false })),
      ];
      options.sort(() => Math.random() - 0.5);

      setWeekdayLogicData({
        question: questionText,
        questionChinese: questionChinese,
        answer: answerWeekday.german,
        answerChinese: answerWeekday.chinese,
        relation: relation,
        baseWeekday: baseWeekday.german,
      });
      setQuizOptions(options);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 播放问题
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(questionText);
        setTimeout(() => setIsPlayingAudio(false), 2000);
      }, 300);
      return;
    }

    // 月份逻辑推理题型
    if (quizType === "monthLogic") {
      // 月份词汇表
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

      // 随机选择一个基础月份
      const shuffledMonths = [...months].sort(() => Math.random() - 0.5);
      const baseMonth = shuffledMonths[0];

      // 随机选择关系类型：previousMonth 或 nextMonth
      const relations = ["previousMonth", "nextMonth"];
      const shuffledRelations = [...relations].sort(() => Math.random() - 0.5);
      const relation = shuffledRelations[0];

      // 计算答案月份
      let answerIndex: number;
      let questionText: string;
      let questionChinese: string;

      if (relation === "previousMonth") {
        // 上个月是 baseMonth，这个月是 baseMonth + 1
        answerIndex = (baseMonth.index + 1) % 12;
        questionText = `Letzter Monat war ${baseMonth.german}. Diesen Monat ist ?.`;
        questionChinese = `上个月是${baseMonth.chinese}，这个月是几月？`;
      } else {
        // 下个月是 baseMonth，这个月是 baseMonth - 1
        answerIndex = (baseMonth.index + 11) % 12;
        questionText = `Nächster Monat ist ${baseMonth.german}. Diesen Monat ist ?.`;
        questionChinese = `下个月是${baseMonth.chinese}，这个月是几月？`;
      }

      const answerMonth = months[answerIndex];

      // 生成错误选项（排除正确答案）
      const otherMonths = months.filter(m => m.index !== answerIndex);
      const shuffledWrong = [...otherMonths].sort(() => Math.random() - 0.5);
      const wrongCount = Math.min(quizDifficulty - 1, otherMonths.length);
      const wrongOptions = shuffledWrong.slice(0, wrongCount);

      // 组合选项并打乱
      const options = [
        { word: { german: answerMonth.german, chinese: answerMonth.chinese } as Word, isCorrect: true },
        ...wrongOptions.map(w => ({ word: { german: w.german, chinese: w.chinese } as Word, isCorrect: false })),
      ];
      options.sort(() => Math.random() - 0.5);

      setMonthLogicData({
        question: questionText,
        questionChinese: questionChinese,
        answer: answerMonth.german,
        answerChinese: answerMonth.chinese,
        relation: relation,
        baseMonth: baseMonth.german,
      });
      setQuizOptions(options);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 播放问题
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(questionText);
        setTimeout(() => setIsPlayingAudio(false), 2000);
      }, 300);
      return;
    }

    // 电话号码听力练习题型
    if (quizType === "phoneNumber") {
      // 德语数字对照
      const digitToGerman: Record<string, string> = {
        '0': 'null',
        '1': 'eins',
        '2': 'zwei',
        '3': 'drei',
        '4': 'vier',
        '5': 'fünf',
        '6': 'sechs',
        '7': 'sieben',
        '8': 'acht',
        '9': 'neun',
      };

      // 生成随机电话号码
      // 德国手机号格式: 01X XXX XXXX 或 015X XXX XXXX
      const prefix = Math.random() > 0.5 ? '015' + Math.floor(Math.random() * 5 + 1) : '016' + Math.floor(Math.random() * 3 + 2);
      const part2 = String(Math.floor(Math.random() * 899) + 100); // 100-999
      const part3 = String(Math.floor(Math.random() * 8999) + 1000); // 1000-9999
      const phoneNumber = `${prefix} ${part2} ${part3}`;

      // 生成德语读法（3-4-4分组）
      const digits = phoneNumber.replace(/\s/g, '');
      const groups: string[] = [];
      for (let i = 0; i < digits.length; i += 4) {
        groups.push(digits.slice(i, i + 4));
      }
      const germanText = groups.map(group =>
        group.split('').map(d => digitToGerman[d]).join(' ')
      ).join(' / ');

      setPhoneNumberData({
        phoneNumber,
        germanText,
        formattedNumber: phoneNumber,
      });
      setPhoneNumberInput("");
      setQuizOptions([]);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 播放电话号码
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(germanText.replace(/\s/g, ' ').replace(/\//g, ','));
        setTimeout(() => setIsPlayingAudio(false), 3000);
      }, 300);
      return;
    }

    // AI 出题模式（句子填空题型）
    if (useAiQuiz && quizType === "sentence") {
      console.log("进入句子填空题型处理");
      const sq = await generateSentenceQuiz();
      console.log("generateSentenceQuiz 返回:", sq);

      if (!sq) {
        console.log("sq 为 null，返回");
        return;
      }

      // 打乱选项顺序
      const shuffledOptions = [...sq.options].sort(() => Math.random() - 0.5);

      const newSentenceQuiz = {
        sentence: sq.sentence,
        missingWord: sq.missingWord,
        options: shuffledOptions,
        chinese: sq.chinese,
      };
      console.log("设置 sentenceQuiz:", newSentenceQuiz);

      setSentenceQuiz(newSentenceQuiz);
      // 记录已使用的句子
      setUsedSentenceSentences(prev => [...prev, sq.sentence]);
      setQuizOptions([]); // 句子题型不使用标准选项
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);
      return;
    }

    // AI 出题模式（仅拼写纠错题型支持）
    if (useAiQuiz && quizType === "spelling") {
      // 调用 AI 生成题目
      const aiWord = await generateAIQuiz();
      if (!aiWord) return;

      const correctSpelling = aiWord.german;

      // 生成拼写错误的选项
      const spellingErrors = new Set<string>();
      const maxAttempts = 100; // 防止无限循环
      let attempts = 0;
      while (spellingErrors.size < quizDifficulty - 1 && attempts < maxAttempts) {
        const error = generateSpellingError(correctSpelling);
        // 确保错误拼写与正确答案不同，且不与其他错误重复
        if (error !== correctSpelling && !spellingErrors.has(error)) {
          spellingErrors.add(error);
        }
        attempts++;
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
      const maxAttempts = 100; // 防止无限循环
      let attempts = 0;
      while (spellingErrors.size < quizDifficulty - 1 && attempts < maxAttempts) {
        const error = generateSpellingError(correctSpelling);
        // 确保错误拼写与正确答案不同，且不与其他错误重复
        if (error !== correctSpelling && !spellingErrors.has(error)) {
          spellingErrors.add(error);
        }
        attempts++;
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
    } else if (quizType === "input") {
      // 听写题型：不需要选项，用户需要手动输入
      options = [];
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
    setUserInput(""); // 重置用户输入
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
    setUsedSentenceSentences([]); // 清空已使用句子记录
    setUserInput(""); // 重置用户输入
    setShowListeningSentence(false); // 重置句子听力显示状态
    setShowWeekdayLogicText(false); // 重置星期推理显示状态
    setPhoneNumberData(null); // 重置电话号码数据
    setPhoneNumberInput(""); // 重置电话号码输入
    await generateQuiz();
  };

  // 选择答案
  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // 已选择过

    setSelectedOption(index);

    // 句子填空题型
    if (quizType === "sentence") {
      const selectedOptionValue = sentenceQuiz?.options[index] || "";
      const isCorrect = selectedOptionValue === sentenceQuiz?.missingWord;

      if (isCorrect) {
        setQuizResult("correct");
        playSound("correct");
        setQuizRecords(prev => [...prev, {
          german: sentenceQuiz?.missingWord || "",
          chinese: sentenceQuiz?.chinese || "",
          selected: selectedOptionValue,
          isCorrect: true,
          isTimeout: false,
        }]);
      } else {
        setQuizResult("wrong");
        playSound("wrong");
        setQuizRecords(prev => [...prev, {
          german: sentenceQuiz?.missingWord || "",
          chinese: sentenceQuiz?.chinese || "",
          selected: selectedOptionValue,
          isCorrect: false,
          isTimeout: false,
        }]);
      }
      return;
    }

    // 其他题型
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

  // 提交听写答案
  const handleInputSubmit = () => {
    if (!userInput.trim() || quizResult !== null) return;

    const input = userInput.trim();
    const correctAnswer = quizWord!.german;

    // 不区分大小写比较
    const isCorrect = input.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      setQuizResult("correct");
      playSound("correct");
      setQuizRecords(prev => [...prev, {
        german: correctAnswer,
        chinese: quizWord!.chinese,
        selected: input,
        isCorrect: true,
        isTimeout: false,
        gender: quizWord!.gender
      }]);
    } else {
      setQuizResult("wrong");
      playSound("wrong");
      setQuizRecords(prev => [...prev, {
        german: correctAnswer,
        chinese: quizWord!.chinese,
        selected: input,
        isCorrect: false,
        isTimeout: false,
        gender: quizWord!.gender
      }]);
    }
  };

  // 下一题
  const nextQuiz = async () => {
    // 重置电话题型状态
    setPhoneNumberInput("");
    setQuizResult(null);
    setSelectedOption(null);

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
    setUserInput(""); // 重置用户输入
  };

  // 添加到错题本
  const addToWrongBook = () => {
    if (quizType === "sentence") {
      // 句子填空题型
      if (!sentenceQuiz) return;
      const newQuestion: WrongQuestion = {
        german: `句子: ${sentenceQuiz.sentence}`,
        chinese: sentenceQuiz.chinese,
        addedAt: Date.now(),
      };
      const exists = wrongBook.some(q => q.german === newQuestion.german);
      if (!exists) {
        setWrongBook(prev => [...prev, newQuestion]);
      }
    } else {
      // 其他题型
      if (!quizWord) return;
      const newQuestion: WrongQuestion = {
        german: quizWord.german,
        chinese: quizWord.chinese,
        gender: quizWord.gender,
        addedAt: Date.now(),
      };
      const exists = wrongBook.some(q => q.german === quizWord.german);
      if (!exists) {
        setWrongBook(prev => [...prev, newQuestion]);
      }
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
             quizType === "input" ? "看中文输入德语" :
             quizType === "verb" ? "看中文选动词" :
             quizType === "listening" ? "听力练习" :
             quizType === "listeningArticle" ? "句子听力填空" :
             quizType === "weekdayLogic" ? "星期逻辑推理" :
             quizType === "monthLogic" ? "月份逻辑推理" :
             quizType === "phoneNumber" ? "电话号码听力" :
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
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-4xl mx-auto">
            <div className="text-5xl mb-3">🎯</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">德语单词测验</h2>

            {/* 设置选项 - 水平排列 */}
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              {/* 题数 */}
              <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-gray-600 font-medium text-sm mb-2">题数</span>
                <div className="flex gap-1">
                  {[5, 10, 15, 20].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizCount(num)}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition ${
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

              {/* 难度 */}
              <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-gray-600 font-medium text-sm mb-2">难度</span>
                <div className="flex gap-1">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizDifficulty(num as 2 | 3 | 4)}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition ${
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

              {/* 倒计时 */}
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-gray-600 font-medium text-sm mb-2">倒计时</span>
                <div className="flex gap-1">
                  {[0, 5, 7, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuizTimer(num as 0 | 5 | 7 | 10)}
                      className={`w-10 h-10 rounded-full font-medium text-xs transition ${
                        quizTimer === num
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-red-50"
                      }`}
                    >
                      {num === 0 ? "∞" : `${num}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 题型选择 - 水平排列 */}
            <div className="mb-4">
              <span className="text-gray-600 font-medium text-sm block mb-2">题型</span>
              <div className="flex flex-wrap justify-center gap-2">
                {/* 听力练习组 */}
                <div className="flex items-center gap-1 mr-3">
                  <span className="text-xs text-gray-400">👂</span>
                  <button
                    onClick={() => setQuizType("listening")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "listening"
                        ? "bg-pink-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-pink-50"
                    }`}
                  >
                    单词听力
                  </button>
                  <button
                    onClick={() => setQuizType("listeningArticle")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "listeningArticle"
                        ? "bg-rose-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-rose-50"
                    }`}
                  >
                    句子听力
                  </button>
                  <button
                    onClick={() => setQuizType("phoneNumber")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "phoneNumber"
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-teal-50"
                    }`}
                  >
                    电话号码
                  </button>
                  <button
                    onClick={() => setQuizType("weekdayLogic")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "weekdayLogic"
                        ? "bg-violet-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-violet-50"
                    }`}
                  >
                    星期听力推理
                  </button>
                  <button
                    onClick={() => setQuizType("monthLogic")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "monthLogic"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-emerald-50"
                    }`}
                  >
                    月份听力推理
                  </button>
                </div>

                {/* 词汇基础组 */}
                <div className="flex items-center gap-1 mr-3">
                  <span className="text-xs text-gray-400">📚</span>
                  <button
                    onClick={() => setQuizType("chinese")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "chinese"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    中德
                  </button>
                  <button
                    onClick={() => setQuizType("german")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "german"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    德中
                  </button>
                  <button
                    onClick={() => setQuizType("gender")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "gender"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                    }`}
                  >
                    词性
                  </button>
                  <button
                    onClick={() => setQuizType("verb")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "verb"
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-cyan-50"
                    }`}
                  >
                    动词
                  </button>
                </div>

                {/* 书写练习组 */}
                <div className="flex items-center gap-1 mr-3">
                  <span className="text-xs text-gray-400">✍️</span>
                  <button
                    onClick={() => setQuizType("spelling")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "spelling"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                    }`}
                  >
                    纠错
                    {useAiQuiz && quizType === "spelling" && <span className="ml-1">🤖</span>}
                  </button>
                  <button
                    onClick={() => setQuizType("input")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "input"
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-teal-50"
                    }`}
                  >
                    听写
                  </button>
                  <button
                    onClick={() => setQuizType("sentence")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "sentence"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    填空
                    {useAiQuiz && quizType === "sentence" && <span className="ml-1">🤖</span>}
                  </button>
                </div>

                
              </div>
            </div>

            {/* 背景音乐设置 */}
            <div className="flex flex-wrap justify-center gap-4 py-2 px-4 bg-gray-50 rounded-lg mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bgMusicEnabled}
                  onChange={(e) => setBgMusicEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">🎵 背景音乐</span>
                {bgMusicPlaying && <span className="text-green-600 text-xs">▶</span>}
              </label>

              {/* 音乐风格选择 */}
              {bgMusicEnabled && (
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => setBgMusicStyle("cheerful")}
                    className={`px-2 py-0.5 rounded-full text-xs transition ${
                      bgMusicStyle === "cheerful"
                        ? "bg-yellow-500 text-white"
                        : "bg-white text-gray-600 hover:bg-yellow-50"
                    }`}
                  >
                    😊
                  </button>
                  <button
                    onClick={() => setBgMusicStyle("calm")}
                    className={`px-2 py-0.5 rounded-full text-xs transition ${
                      bgMusicStyle === "calm"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    😌
                  </button>
                  <button
                    onClick={() => setBgMusicStyle("tense")}
                    className={`px-2 py-0.5 rounded-full text-xs transition ${
                      bgMusicStyle === "tense"
                        ? "bg-red-500 text-white"
                        : "bg-white text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    😰
                  </button>
                </div>
              )}
            </div>

            {/* 分类筛选 - 放到卡片内部 */}
            <div className="flex flex-wrap justify-center gap-1 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedVerbSubcategory(null);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                  }`}
                >
                  {cat.name}
                  {cat.id !== "all" && (
                    <span className="ml-0.5 text-xs opacity-70">
                      ({words.filter(w => w.category === cat.id).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 动词子分类筛选 */}
            {selectedCategory === "verb" && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setSelectedVerbSubcategory(null);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedVerbSubcategory === null
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-cyan-50"
                  }`}
                >
                  全部动词
                  <span className="ml-0.5 text-xs opacity-70">
                    ({words.filter(w => w.category === "verb").length})
                  </span>
                </button>
                {verbCategories.map((subcat) => {
                  const count = words.filter(w => w.category === "verb" && w.verbSubcategory === subcat.id).length;
                  return (
                    <button
                      key={subcat.id}
                      onClick={() => {
                        setSelectedVerbSubcategory(subcat.id);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs transition ${
                        selectedVerbSubcategory === subcat.id
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-cyan-50"
                      }`}
                    >
                      {subcat.name}
                      <span className="ml-0.5 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={startQuiz}
              className="px-6 py-2 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition text-base"
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

        {/* 学习模式：分类筛选 */}
        {mode === "learn" && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedVerbSubcategory(null);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
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
        )}

        {/* 学习模式：动词子分类筛选 */}
        {mode === "learn" && selectedCategory === "verb" && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setSelectedVerbSubcategory(null);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                selectedVerbSubcategory === null
                  ? "bg-cyan-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-cyan-50"
              }`}
            >
              全部动词
              <span className="ml-1 text-xs opacity-70">
                ({words.filter(w => w.category === "verb").length})
              </span>
            </button>
            {verbCategories.map((subcat) => {
              const count = words.filter(w => w.category === "verb" && w.verbSubcategory === subcat.id).length;
              return (
                <button
                  key={subcat.id}
                  onClick={() => {
                    setSelectedVerbSubcategory(subcat.id);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedVerbSubcategory === subcat.id
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-cyan-50"
                  }`}
                >
                  {subcat.name}
                  <span className="ml-1 text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 学习模式：词汇统计 */}
        {mode === "learn" && selectedCategory === "verb" && selectedVerbSubcategory ? (
          // 动词子分类统计
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">📊 子分类统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                className="text-center p-2 rounded-lg bg-cyan-100"
              >
                <div className="text-2xl font-bold text-cyan-600">{filteredWords.length}</div>
                <div className="text-sm text-gray-600">
                  {verbCategories.find(s => s.id === selectedVerbSubcategory)?.name}
                </div>
              </div>
            </div>
          </div>
        ) : mode === "learn" && (
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
                  const questionText = quizType === "german" || quizType === "spelling" || quizType === "input" || quizType === "verb"
                    ? record.chinese
                    : record.german;
                  // 拼写纠错和听写题型需要特殊处理
                  const answerText = quizType === "spelling" || quizType === "input"
                    ? record.isCorrect
                      ? `${record.selected}`
                      : `${record.selected} → ${record.german}`
                    : quizType === "german" || quizType === "verb"
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
                            {quizType === "spelling" || quizType === "input" ? (
                              record.isCorrect ? (
                                <>输入了：{record.selected} ✓</>
                              ) : (
                                <>输入了 {record.selected}，正确：{record.german}</>
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
            ) : quizType === "listening" ? (
              // 听力练习题型（通用）
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <span className="text-sm text-gray-400 mb-2 block">听发音，选择正确的中文含义</span>

                  {/* 播放按钮 */}
                  <button
                    onClick={() => {
                      if (listeningTarget) {
                        setIsPlayingAudio(true);
                        speak(listeningTarget.german);
                        setTimeout(() => setIsPlayingAudio(false), 1500);
                      }
                    }}
                    disabled={isPlayingAudio}
                    className={`p-8 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600 animate-pulse"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    <span className="text-6xl">🔊</span>
                  </button>
                  <p className="text-gray-500 mt-4">
                    {isPlayingAudio ? "🔊 播放中..." : "点击喇叭听发音"}
                  </p>
                </div>

                {/* 选项列表 */}
                <div className="grid grid-cols-2 gap-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = option.isCorrect;
                    const showResult = selectedOption !== null || quizTimeout;

                    let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                      }
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700";
                    }

                    return (
                      <button
                        key={option.word.german}
                        onClick={() => {
                          setSelectedOption(idx);
                          if (option.isCorrect) {
                            setQuizResult("correct");
                            playSound("correct");
                            setQuizRecords(prev => [...prev, {
                              german: listeningTarget!.german,
                              chinese: listeningTarget!.chinese,
                              selected: option.word.german,
                              isCorrect: true,
                              isTimeout: false,
                              gender: listeningTarget!.gender
                            }]);
                          } else {
                            setQuizResult("wrong");
                            playSound("wrong");
                            setQuizRecords(prev => [...prev, {
                              german: listeningTarget!.german,
                              chinese: listeningTarget!.chinese,
                              selected: option.word.german,
                              isCorrect: false,
                              isTimeout: false,
                              gender: listeningTarget!.gender
                            }]);
                          }
                        }}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        {option.word.chinese}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : quizType === "listeningArticle" ? (
              // 短文听力理解题型（句子填空听力）
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">听句子，选择正确的星期</span>
                </div>

                {/* 显示/隐藏句子按钮 */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowListeningSentence(!showListeningSentence)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      showListeningSentence
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {showListeningSentence ? "🙈 隐藏句子" : "👁️ 显示句子"}
                  </button>
                </div>

                {/* 显示句子 */}
                {showListeningSentence && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <p className="text-xl text-gray-800 text-center">
                      {listeningArticleData?.sentence}
                    </p>
                    <p className="text-gray-500 text-center mt-2">
                      {listeningArticleData?.chinese}
                    </p>
                  </div>
                )}

                {/* 播放句子按钮 */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      if (listeningArticleData?.sentence) {
                        setIsPlayingAudio(true);
                        speak(listeningArticleData.sentence);
                        setTimeout(() => setIsPlayingAudio(false), 2000);
                      }
                    }}
                    disabled={isPlayingAudio}
                    className={`px-6 py-3 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🔊 播放句子"}
                  </button>
                </div>

                {/* 选项列表 */}
                <div className="grid grid-cols-2 gap-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = option.isCorrect;
                    const showResult = selectedOption !== null || quizTimeout;

                    let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                      }
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700";
                    }

                    return (
                      <button
                        key={option.word.german}
                        onClick={() => {
                          setSelectedOption(idx);
                          if (option.isCorrect) {
                            setQuizResult("correct");
                            playSound("correct");
                            setQuizRecords(prev => [...prev, {
                              german: listeningArticleData!.sentence,
                              chinese: option.word.chinese,
                              selected: option.word.german,
                              isCorrect: true,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          } else {
                            setQuizResult("wrong");
                            playSound("wrong");
                            setQuizRecords(prev => [...prev, {
                              german: listeningArticleData!.sentence,
                              chinese: option.word.chinese,
                              selected: option.word.german,
                              isCorrect: false,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          }
                        }}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        {option.word.chinese}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : quizType === "weekdayLogic" ? (
              // 星期逻辑推理题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">听问题，推理今天是星期几</span>
                </div>

                {/* 显示/隐藏文本按钮 */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowWeekdayLogicText(!showWeekdayLogicText)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      showWeekdayLogicText
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {showWeekdayLogicText ? "🙈 隐藏文本" : "👁️ 显示文本"}
                  </button>
                </div>

                {/* 显示问题 */}
                {showWeekdayLogicText && (
                  <div className="bg-violet-50 rounded-xl p-6 mb-6">
                    <p className="text-xl text-gray-800 text-center font-medium">
                      {weekdayLogicData?.question}
                    </p>
                    <p className="text-lg text-gray-500 text-center mt-3">
                      {weekdayLogicData?.questionChinese}
                    </p>
                  </div>
                )}

                {/* 播放问题按钮 */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      if (weekdayLogicData?.question) {
                        setIsPlayingAudio(true);
                        speak(weekdayLogicData.question);
                        setTimeout(() => setIsPlayingAudio(false), 2000);
                      }
                    }}
                    disabled={isPlayingAudio}
                    className={`px-6 py-3 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🔊 播放问题"}
                  </button>
                </div>

                {/* 选项列表 */}
                <div className="grid grid-cols-2 gap-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = option.isCorrect;
                    const showResult = selectedOption !== null || quizTimeout;

                    let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                      }
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700";
                    }

                    return (
                      <button
                        key={option.word.german}
                        onClick={() => {
                          setSelectedOption(idx);
                          if (option.isCorrect) {
                            setQuizResult("correct");
                            playSound("correct");
                            setQuizRecords(prev => [...prev, {
                              german: weekdayLogicData!.question,
                              chinese: weekdayLogicData!.answerChinese,
                              selected: option.word.german,
                              isCorrect: true,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          } else {
                            setQuizResult("wrong");
                            playSound("wrong");
                            setQuizRecords(prev => [...prev, {
                              german: weekdayLogicData!.question,
                              chinese: weekdayLogicData!.answerChinese,
                              selected: option.word.german,
                              isCorrect: false,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          }
                        }}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        {option.word.german}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : quizType === "monthLogic" ? (
              // 月份逻辑推理题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">听问题，推理现在是几月</span>
                </div>

                {/* 显示/隐藏文本按钮 */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowMonthLogicText(!showMonthLogicText)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      showMonthLogicText
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {showMonthLogicText ? "🙈 隐藏文本" : "👁️ 显示文本"}
                  </button>
                </div>

                {/* 显示问题 */}
                {showMonthLogicText && (
                  <div className="bg-emerald-50 rounded-xl p-6 mb-6">
                    <p className="text-xl text-gray-800 text-center font-medium">
                      {monthLogicData?.question}
                    </p>
                    <p className="text-lg text-gray-500 text-center mt-3">
                      {monthLogicData?.questionChinese}
                    </p>
                  </div>
                )}

                {/* 播放问题按钮 */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      if (monthLogicData?.question) {
                        setIsPlayingAudio(true);
                        speak(monthLogicData.question);
                        setTimeout(() => setIsPlayingAudio(false), 2000);
                      }
                    }}
                    disabled={isPlayingAudio}
                    className={`px-6 py-3 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🔊 播放问题"}
                  </button>
                </div>

                {/* 选项列表 */}
                <div className="grid grid-cols-3 gap-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = option.isCorrect;
                    const showResult = selectedOption !== null || quizTimeout;

                    let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500 opacity-50";
                      }
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700";
                    }

                    return (
                      <button
                        key={option.word.german}
                        onClick={() => {
                          setSelectedOption(idx);
                          if (option.isCorrect) {
                            setQuizResult("correct");
                            playSound("correct");
                            setQuizRecords(prev => [...prev, {
                              german: monthLogicData!.question,
                              chinese: monthLogicData!.answerChinese,
                              selected: option.word.german,
                              isCorrect: true,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          } else {
                            setQuizResult("wrong");
                            playSound("wrong");
                            setQuizRecords(prev => [...prev, {
                              german: monthLogicData!.question,
                              chinese: monthLogicData!.answerChinese,
                              selected: option.word.german,
                              isCorrect: false,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          }
                        }}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        {option.word.german}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : quizType === "phoneNumber" ? (
              // 电话号码听力练习题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">听电话号码，输入数字</span>
                </div>

                {/* 播放按钮 */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      if (phoneNumberData?.germanText) {
                        setIsPlayingAudio(true);
                        speak(phoneNumberData.germanText.replace(/\s/g, ' ').replace(/\//g, ','));
                        setTimeout(() => setIsPlayingAudio(false), 3000);
                      }
                    }}
                    disabled={isPlayingAudio}
                    className={`px-8 py-4 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放电话号码"}
                  </button>
                </div>

                {/* 数字键盘输入区 */}
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-xl p-4 mb-4 text-center min-h-[60px] flex items-center justify-center">
                    <span className="text-3xl font-mono tracking-widest">
                      {phoneNumberInput || "请输入电话号码..."}
                    </span>
                  </div>

                  {/* 数字键盘 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          if (phoneNumberInput.length < 11) {
                            setPhoneNumberInput(prev => prev + num);
                          }
                        }}
                        disabled={quizResult !== null}
                        className="py-4 rounded-xl text-2xl font-bold bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setPhoneNumberInput(prev => prev.slice(0, -1))}
                      disabled={quizResult !== null || phoneNumberInput.length === 0}
                      className="py-4 rounded-xl text-lg font-medium bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 active:bg-red-200 transition"
                    >
                      ⌫
                    </button>
                    <button
                      onClick={() => setPhoneNumberInput("")}
                      disabled={quizResult !== null}
                      className="py-4 rounded-xl text-lg font-medium bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition"
                    >
                      清空
                    </button>
                    <button
                      onClick={() => {
                        // 检查答案
                        const rawInput = phoneNumberInput.replace(/\s/g, '');
                        const rawAnswer = phoneNumberData?.phoneNumber.replace(/\s/g, '') || '';
                        const isCorrect = rawInput === rawAnswer;

                        if (isCorrect) {
                          setQuizResult("correct");
                          playSound("correct");
                          setQuizRecords(prev => [...prev, {
                            german: phoneNumberData!.germanText,
                            chinese: phoneNumberData!.phoneNumber,
                            selected: phoneNumberInput,
                            isCorrect: true,
                            isTimeout: false,
                            gender: undefined
                          }]);
                        } else {
                          setQuizResult("wrong");
                          playSound("wrong");
                          setQuizRecords(prev => [...prev, {
                            german: phoneNumberData!.germanText,
                            chinese: phoneNumberData!.phoneNumber,
                            selected: phoneNumberInput,
                            isCorrect: false,
                            isTimeout: false,
                            gender: undefined
                          }]);
                        }
                      }}
                      disabled={quizResult !== null || phoneNumberInput.length < 11}
                      className={`py-4 rounded-xl text-lg font-bold transition ${
                        phoneNumberInput.length >= 11
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ✓ 确认
                    </button>
                  </div>
                </div>

                {/* 显示正确答案（答题后） */}
                {quizResult !== null && (
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-gray-600 mb-2">正确答案是：</p>
                    <p className="text-3xl font-mono font-bold text-blue-600">
                      {phoneNumberData?.phoneNumber}
                    </p>
                    <p className="text-gray-500 mt-2">
                      德语：{phoneNumberData?.germanText}
                    </p>

                    {/* 下一题按钮 */}
                    <button
                      onClick={nextQuiz}
                      className="mt-4 w-full py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition"
                    >
                      下一题 →
                    </button>
                  </div>
                )}
              </div>
            ) : quizType === "sentence" ? (
              // 句子填空题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                {/* 显示/隐藏中文翻译按钮 */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowSentenceChinese(!showSentenceChinese)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      showSentenceChinese
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {showSentenceChinese ? "🙈 隐藏中文" : "👁️ 显示中文"}
                  </button>
                </div>

                {/* 句子填空内容 */}
                <div className="text-center mb-6">
                  {sentenceQuiz ? (
                    <>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <p className="text-3xl font-bold text-gray-800 leading-relaxed">
                          {sentenceQuiz.sentence}
                        </p>
                        <button
                          onClick={() => speak(sentenceQuiz.sentence.replace("___", sentenceQuiz.missingWord))}
                          className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
                          title="播放发音"
                        >
                          🔊
                        </button>
                      </div>
                      {showSentenceChinese && (
                        <p className="text-lg text-gray-500 mt-2">{sentenceQuiz.chinese}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400">句子数据加载中...</p>
                  )}
                </div>

                {/* 选项列表 */}
                {sentenceQuiz && (
                  <div className="grid grid-cols-2 gap-3">
                    {sentenceQuiz.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={selectedOption !== null || quizTimeout}
                        className="p-4 rounded-xl text-xl font-medium transition border-2 bg-white border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
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
                       quizType === "input" ? "请输入对应的德语单词" :
                       quizType === "verb" ? "请选择对应的动词" :
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
                     quizType === "input" ? quizWord.chinese :
                     quizType === "verb" ? quizWord.chinese :
                     quizWord.german}
                  </h2>
                  {(quizType === "chinese" || quizType === "spelling" || quizType === "input" || quizType === "verb") && (
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
              {quizType === "input" ? (
                // 听写题型：显示输入框
                <div className="space-y-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="输入德语单词..."
                    disabled={quizResult !== null}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    autoFocus
                  />
                  <button
                    onClick={handleInputSubmit}
                    disabled={!userInput.trim() || quizResult !== null}
                    className="w-full py-4 bg-teal-500 text-white text-xl font-medium rounded-xl hover:bg-teal-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    提交答案
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((option, idx) => {
                  let buttonClass = "p-4 rounded-xl text-xl font-medium transition border-2 ";
                  let disabled = false;
                  // 德中匹配和拼写纠错显示德语，中德匹配显示中文，词性匹配显示词性，动词匹配显示德语
                  let optionLabel = quizType === "spelling" || quizType === "german" || quizType === "verb"
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
              )}
            </div>
            </>
            ) : null}

            {/* 右侧：结果和下一题 */}
            <div className="lg:w-56 flex-shrink-0">
              {(selectedOption !== null || quizTimeout || (quizType === "input" && quizResult !== null)) ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center sticky top-4">
                  <p className={`text-2xl font-bold mb-4 ${
                    quizResult === "correct" ? "text-green-600" : "text-red-600"
                  }`}>
                    {quizResult === "correct" ? "✅ 正确" : "❌ 错误"}
                  </p>
                  {quizResult === "wrong" && (
                    <p className="text-gray-600 mb-4">
                      {quizType === "spelling" || quizType === "input" || quizType === "verb" ? (
                        <>正确：<strong>{quizWord?.german}</strong></>
                      ) : quizType === "sentence" ? (
                        <>
                          <p>正确：<strong>{sentenceQuiz?.missingWord}</strong></p>
                          <p className="text-sm text-gray-400 mt-1">{sentenceQuiz?.chinese}</p>
                        </>
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
                {/* 例句 */}
                {currentWord?.example && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 max-w-xs">
                    <p className="text-sm text-gray-600 italic text-center">{currentWord.example}</p>
                  </div>
                )}
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
