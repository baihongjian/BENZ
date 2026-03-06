"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

// 发音函数 - 使用浏览器语音 API
const speak = async (text: string) => {
  if (typeof window === "undefined") return;

  // 延迟一下，确保语音已加载
  await new Promise(resolve => setTimeout(resolve, 100));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  // 等待语音加载
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.includes("de"));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }
  };

  loadVoices();

  // 某些浏览器需要事件监听
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
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
  numberSubcategory?: string; // 数字子分类
  phraseCategory?: string; // 短句子分类
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

  // 数字 0-10
  { german: "Null", chinese: "零", pronunciation: "努尔", category: "number", numberSubcategory: "0-10" },
  { german: "Eins", chinese: "一", pronunciation: "艾因斯", category: "number", numberSubcategory: "0-10" },
  { german: "Zwei", chinese: "二", pronunciation: "茨维", category: "number", numberSubcategory: "0-10" },
  { german: "Drei", chinese: "三", pronunciation: "德赖", category: "number", numberSubcategory: "0-10" },
  { german: "Vier", chinese: "四", pronunciation: "菲尔", category: "number", numberSubcategory: "0-10" },
  { german: "Fünf", chinese: "五", pronunciation: "芬夫", category: "number", numberSubcategory: "0-10" },
  { german: "Sechs", chinese: "六", pronunciation: "泽克斯", category: "number", numberSubcategory: "0-10" },
  { german: "Sieben", chinese: "七", pronunciation: "西本", category: "number", numberSubcategory: "0-10" },
  { german: "Acht", chinese: "八", pronunciation: "阿赫特", category: "number", numberSubcategory: "0-10" },
  { german: "Neun", chinese: "九", pronunciation: "诺因", category: "number", numberSubcategory: "0-10" },
  { german: "Zehn", chinese: "十", pronunciation: "茨恩", category: "number", numberSubcategory: "0-10" },

  // 11-20
  { german: "Elf", chinese: "十一", pronunciation: "埃尔夫", category: "number", numberSubcategory: "11-20" },
  { german: "Zwölf", chinese: "十二", pronunciation: "茨沃尔夫", category: "number", numberSubcategory: "11-20" },
  { german: "Dreizehn", chinese: "十三", pronunciation: "德赖茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Vierzehn", chinese: "十四", pronunciation: "菲尔茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Fünfzehn", chinese: "十五", pronunciation: "芬夫茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Sechzehn", chinese: "十六", pronunciation: "泽希茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Siebzehn", chinese: "十七", pronunciation: "西普茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Achtzehn", chinese: "十八", pronunciation: "阿希茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Neunzehn", chinese: "十九", pronunciation: "诺因茨恩", category: "number", numberSubcategory: "11-20" },
  { german: "Zwanzig", chinese: "二十", pronunciation: "茨万齐希", category: "number", numberSubcategory: "11-20" },

  // 21-30
  { german: "Einundzwanzig", chinese: "二十一", pronunciation: "艾因翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Zweiundzwanzig", chinese: "二十二", pronunciation: "茨维翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Dreiundzwanzig", chinese: "二十三", pronunciation: "德赖翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Vierundzwanzig", chinese: "二十四", pronunciation: "菲尔翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Fünfundzwanzig", chinese: "二十五", pronunciation: "芬夫翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Sechsundzwanzig", chinese: "二十六", pronunciation: "泽克斯翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Siebenundzwanzig", chinese: "二十七", pronunciation: "西本翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Achtundzwanzig", chinese: "二十八", pronunciation: "阿赫特翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Neunundzwanzig", chinese: "二十九", pronunciation: "诺因翁特茨万齐希", category: "number", numberSubcategory: "21-30" },
  { german: "Dreißig", chinese: "三十", pronunciation: "德赖西希", category: "number", numberSubcategory: "21-30" },

  // 31-100
  { german: "Einunddreißig", chinese: "三十一", pronunciation: "艾因翁特德赖西希", category: "number", numberSubcategory: "31-100" },
  { german: "Vierzig", chinese: "四十", pronunciation: "菲尔齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Fünfzig", chinese: "五十", pronunciation: "芬夫齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Sechzig", chinese: "六十", pronunciation: "泽希齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Siebzig", chinese: "七十", pronunciation: "西普齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Achtzig", chinese: "八十", pronunciation: "阿希齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Neunzig", chinese: "九十", pronunciation: "诺因齐希", category: "number", numberSubcategory: "31-100" },
  { german: "Hundert", chinese: "一百", pronunciation: "洪德特", category: "number", numberSubcategory: "31-100" },

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

  // ========== 常用短句 300句 ==========

  // 问候
  { german: "Guten Morgen!", chinese: "早上好！", pronunciation: "古腾 莫尔根", category: "phrase", phraseCategory: "greeting" },
  { german: "Guten Tag!", chinese: "你好！/日安！", pronunciation: "古腾 塔克", category: "phrase", phraseCategory: "greeting" },
  { german: "Guten Abend!", chinese: "晚上好！", pronunciation: "古腾 阿本特", category: "phrase", phraseCategory: "greeting" },
  { german: "Gute Nacht!", chinese: "晚安！", pronunciation: "古特 纳赫特", category: "phrase", phraseCategory: "greeting" },
  { german: "Hallo!", chinese: "你好！", pronunciation: "哈洛", category: "phrase", phraseCategory: "greeting" },
  { german: "Hi!", chinese: "嗨！", pronunciation: "嗨", category: "phrase", phraseCategory: "greeting" },
  { german: "Guten Tag! Wie geht es Ihnen?", chinese: "您好！您好吗？", pronunciation: "古腾 塔克, 维 格特 埃斯 伊hnen", category: "phrase", phraseCategory: "greeting" },
  { german: "Wie geht's?", chinese: "你好吗？/近况如何？", pronunciation: "维 格茨", category: "phrase", phraseCategory: "greeting" },
  { german: "Mir geht's gut.", chinese: "我很好。", pronunciation: "米尔 格茨 古特", category: "phrase", phraseCategory: "greeting" },
  { german: "Nicht schlecht.", chinese: "还不错。", pronunciation: "尼希特 施莱希特", category: "phrase", phraseCategory: "greeting" },
  { german: "Es geht so.", chinese: "马马虎虎。", pronunciation: "埃斯 格特 佐", category: "phrase", phraseCategory: "greeting" },
  { german: "Und Ihnen?", chinese: "您呢？", pronunciation: "翁特 伊hnen", category: "phrase", phraseCategory: "greeting" },
  { german: "Freut mich.", chinese: "很高兴（认识你）。", pronunciation: "弗罗伊特 米希", category: "phrase", phraseCategory: "greeting" },
  { german: "Angenehm.", chinese: "很高兴（认识你）。", pronunciation: "阿格内姆", category: "phrase", phraseCategory: "greeting" },
  { german: "Wie heißen Sie?", chinese: "您叫什么名字？", pronunciation: "维 嗨ßen 贼", category: "phrase", phraseCategory: "greeting" },
  { german: "Ich heiße...", chinese: "我叫...", pronunciation: "伊希 嗨ße", category: "phrase", phraseCategory: "greeting" },
  { german: "Woher kommen Sie?", chinese: "您来自哪里？", pronunciation: "沃黑尔 科门 贼", category: "phrase", phraseCategory: "greeting" },
  { german: "Ich komme aus...", chinese: "我来自...", pronunciation: "伊希 科么 奥斯", category: "phrase", phraseCategory: "greeting" },
  { german: "Ich bin...", chinese: "我是...（职业）", pronunciation: "伊希 宾", category: "phrase", phraseCategory: "greeting" },

  // 告别
  { german: "Auf Wiedersehen!", chinese: "再见！", pronunciation: "奥夫 维德尔泽恩", category: "phrase", phraseCategory: "farewell" },
  { german: "Tschüss!", chinese: "再见！/拜拜！", pronunciation: "楚斯", category: "phrase", phraseCategory: "farewell" },
  { german: "Bis bald!", chinese: "一会儿见！", pronunciation: "比斯 巴尔特", category: "phrase", phraseCategory: "farewell" },
  { german: "Bis später!", chinese: "待会儿见！", pronunciation: "比斯 施派特", category: "phrase", phraseCategory: "farewell" },
  { german: "Bis morgen!", chinese: "明天见！", pronunciation: "比斯 莫尔根", category: "phrase", phraseCategory: "farewell" },
  { german: "Bis nächste Woche!", chinese: "下周见！", pronunciation: "比斯 内赫斯特 沃克", category: "phrase", phraseCategory: "farewell" },
  { german: "Ciao!", chinese: "再见！", pronunciation: "乔", category: "phrase", phraseCategory: "farewell" },
  { german: "Ade!", chinese: "再见！", pronunciation: "阿德", category: "phrase", phraseCategory: "farewell" },
  { german: "Man sieht sich!", chinese: "回头见！", pronunciation: "曼 泽希特 贼希", category: "phrase", phraseCategory: "farewell" },
  { german: "Gute Reise!", chinese: "旅途愉快！", pronunciation: "古特 赖泽", category: "phrase", phraseCategory: "farewell" },
  { german: "Viel Spaß!", chinese: "玩得开心！", pronunciation: "菲尔 施帕斯", category: "phrase", phraseCategory: "farewell" },
  { german: "Hals- und Beinbruch!", chinese: "祝你好运！（字面：脖子和腿断了）", pronunciation: "哈尔斯 翁特 拜因布鲁希", category: "phrase", phraseCategory: "farewell" },

  // 感谢
  { german: "Danke!", chinese: "谢谢！", pronunciation: "丹克", category: "phrase", phraseCategory: "gratitude" },
  { german: "Danke schön!", chinese: "非常感谢！", pronunciation: "丹克 舍恩", category: "phrase", phraseCategory: "gratitude" },
  { german: "Vielen Dank!", chinese: "非常感谢！", pronunciation: "菲林 丹克", category: "phrase", phraseCategory: "gratitude" },
  { german: "Herzlichen Dank!", chinese: "衷心感谢！", pronunciation: "海尔茨利欣 丹克", category: "phrase", phraseCategory: "gratitude" },
  { german: "Tausend Dank!", chinese: "千恩万谢！", pronunciation: "陶森特 丹克", category: "phrase", phraseCategory: "gratitude" },
  { german: "Danke für...", chinese: "谢谢...（某事物）", pronunciation: "丹克 菲尔", category: "phrase", phraseCategory: "gratitude" },
  { german: "Danke für Ihre Hilfe!", chinese: "谢谢您的帮助！", pronunciation: "丹克 菲尔 伊雷 希尔弗", category: "phrase", phraseCategory: "gratitude" },
  { german: "Das ist sehr nett von Ihnen!", chinese: "您真是太好了！", pronunciation: "达斯 伊斯特 贼尔 内特 冯 伊hnen", category: "phrase", phraseCategory: "gratitude" },
  { german: "Keine Ursache!", chinese: "不客气！/没关系！", pronunciation: "凯娜 乌尔扎赫", category: "phrase", phraseCategory: "gratitude" },
  { german: "Gerne geschehen!", chinese: "乐意效劳！", pronunciation: "格尔呢 格谢恩", category: "phrase", phraseCategory: "gratitude" },
  { german: "Bitteschön!", chinese: "请！/不客气！", pronunciation: "比特 舍恩", category: "phrase", phraseCategory: "gratitude" },
  { german: "Vielen Dank für Ihre Mühe!", chinese: "非常感谢您的辛苦！", pronunciation: "菲林 丹克 菲尔 伊雷 米厄", category: "phrase", phraseCategory: "gratitude" },

  // 道歉
  { german: "Entschuldigung!", chinese: "对不起！/抱歉！", pronunciation: "恩特舒尔迪贡", category: "phrase", phraseCategory: "apology" },
  { german: "Es tut mir leid.", chinese: "我很抱歉。", pronunciation: "埃斯 图特 米尔 赖特", category: "phrase", phraseCategory: "apology" },
  { german: "Tut mir leid.", chinese: "抱歉。", pronunciation: "图特 米尔 赖特", category: "phrase", phraseCategory: "apology" },
  { german: "Das tut mir leid.", chinese: "对此我很抱歉。", pronunciation: "达斯 图特 米尔 赖特", category: "phrase", phraseCategory: "apology" },
  { german: "Entschuldigen Sie mich bitte.", chinese: "请您原谅我。", pronunciation: "恩特舒尔迪根 贼 米希 比特", category: "phrase", phraseCategory: "apology" },
  { german: "Ich bitte um Entschuldigung.", chinese: "我请求原谅。", pronunciation: "伊希 比特 翁姆 恩特舒尔迪贡", category: "phrase", phraseCategory: "apology" },
  { german: "Verzeihung!", chinese: "请原谅！", pronunciation: "菲尔措伊贡", category: "phrase", phraseCategory: "apology" },
  { german: "Kein Problem!", chinese: "没问题！", pronunciation: "凯因 普罗布莱姆", category: "phrase", phraseCategory: "apology" },
  { german: "Macht nichts!", chinese: "没关系！/别在意！", pronunciation: "马希特 尼希茨", category: "phrase", phraseCategory: "apology" },
  { german: "Das macht nichts.", chinese: "没关系。", pronunciation: "达斯 马希特 尼希茨", category: "phrase", phraseCategory: "apology" },
  { german: "Ich habe mich geirrt.", chinese: "我搞错了。", pronunciation: "伊希 哈伯 米希 格伊尔特", category: "phrase", phraseCategory: "apology" },
  { german: "Das war mein Fehler.", chinese: "这是我的错。", pronunciation: "达斯 瓦尔 迈恩 菲勒", category: "phrase", phraseCategory: "apology" },

  // 请教/礼貌用语
  { german: "Bitte!", chinese: "请！", pronunciation: "比特", category: "phrase", phraseCategory: "polite" },
  { german: "Bitte schön!", chinese: "请您！", pronunciation: "比特 舍恩", category: "phrase", phraseCategory: "polite" },
  { german: "Darf ich fragen?", chinese: "我可以问吗？", pronunciation: "达尔弗 伊希 弗拉根", category: "phrase", phraseCategory: "polite" },
  { german: "Kann ich Ihnen helfen?", chinese: "我可以帮您吗？", pronunciation: "坎 伊希 伊hnen 赫尔弗", category: "phrase", phraseCategory: "polite" },
  { german: "Würden Sie mir bitte helfen?", chinese: "您能帮我吗？", pronunciation: "维尔den 贼 米尔 比特 赫尔弗", category: "phrase", phraseCategory: "polite" },
  { german: "Entschuldigung, ich habe eine Frage.", chinese: "抱歉，我有个问题。", pronunciation: "恩特舒尔迪贡, 伊希 哈伯 艾纳 弗拉格", category: "phrase", phraseCategory: "polite" },
  { german: "Könnten Sie das bitte wiederholen?", chinese: "您能重复一下吗？", pronunciation: "克因特恩 贼 达斯 比特 维德尔霍伦", category: "phrase", phraseCategory: "polite" },
  { german: "Können Sie das bitte langsamer sagen?", chinese: "您能说慢一点吗？", pronunciation: "克因恩 贼 达斯 比特 朗扎默 萨根", category: "phrase", phraseCategory: "polite" },
  { german: "Ich verstehe nicht.", chinese: "我不懂。", pronunciation: "伊希 菲尔施特 尼希特", category: "phrase", phraseCategory: "polite" },
  { german: "Ich verstehe nur ein bisschen.", chinese: "我只懂一点。", pronunciation: "伊希 菲尔施特 努尔 艾因 比欣", category: "phrase", phraseCategory: "polite" },
  { german: "Sprechen Sie langsamer, bitte.", chinese: "请说慢一点。", pronunciation: "施普雷chen 贼 朗扎默, 比特", category: "phrase", phraseCategory: "polite" },
  { german: "Was bedeutet das?", chinese: "这是什么意思？", pronunciation: "瓦斯 伯德伊特 达斯", category: "phrase", phraseCategory: "polite" },
  { german: "Können Sie das aufschreiben?", chinese: "您能写下来吗？", pronunciation: "克因恩 贼 达斯 奥弗施莱本", category: "phrase", phraseCategory: "polite" },
  { german: "Haben Sie das verstanden?", chinese: "您明白了吗？", pronunciation: "哈本 贼 达斯 菲尔施坦登", category: "phrase", phraseCategory: "polite" },
  { german: "Ja, ich habe verstanden.", chinese: "是的，我明白了。", pronunciation: "呀, 伊希 哈伯 菲尔施坦登", category: "phrase", phraseCategory: "polite" },
  { german: "Nein, ich habe nicht verstanden.", chinese: "不，我不懂。", pronunciation: "奈恩, 伊希 哈伯 尼希特 菲尔施坦登", category: "phrase", phraseCategory: "polite" },

  // 餐厅/点餐
  { german: "Die Speisekarte, bitte.", chinese: "请给我菜单。", pronunciation: "迪 施派泽卡尔特, 比特", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich möchte bestellen.", chinese: "我想点餐。", pronunciation: "伊希 梅希特 贝施特伦", category: "phrase", phraseCategory: "restaurant" },
  { german: "Kann ich bitte die Speisekarte haben?", chinese: "我能看一下菜单吗？", pronunciation: "坎 伊希 比特 迪 施派泽卡尔特 哈本", category: "phrase", phraseCategory: "restaurant" },
  { german: "Was empfehlen Sie?", chinese: "您推荐什么？", pronunciation: "瓦斯 恩普菲伦 贼", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich nehme...", chinese: "我要...（点餐）", pronunciation: "伊希 内么", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich hätte gern...", chinese: "我想要...（更客气）", pronunciation: "伊希 赫特 格尔恩", category: "phrase", phraseCategory: "restaurant" },
  { german: "Die Rechnung, bitte.", chinese: "请结账。", pronunciation: "迪 雷希宁, 比特", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich möchte bezahlen.", chinese: "我想付钱。", pronunciation: "伊希 梅希特 贝察伦", category: "phrase", phraseCategory: "restaurant" },
  { german: "Getrennt oder zusammen?", chinese: "分开还是一起？", pronunciation: "格特雷恩特 奥德 楚扎门", category: "phrase", phraseCategory: "restaurant" },
  { german: "Zusammen, bitte.", chinese: "请放在一起。", pronunciation: "楚扎门, 比特", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich möchte zur Toilette gehen.", chinese: "我想去洗手间。", pronunciation: "伊希 梅希特 茨尔 托亚莱特 格恩", category: "phrase", phraseCategory: "restaurant" },
  { german: "Das ist sehr lecker!", chinese: "非常好吃！", pronunciation: "达斯 伊斯特 贼尔 莱克", category: "phrase", phraseCategory: "restaurant" },
  { german: "Kann ich einen Tisch reservieren?", chinese: "我能预订一个桌子吗？", pronunciation: "坎 伊希 艾能 蒂施 雷泽尔维伦", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich habe einen Tisch bestellt.", chinese: "我预订了桌子。", pronunciation: "伊希 哈伯 艾能 蒂施 贝施泰尔特", category: "phrase", phraseCategory: "restaurant" },
  { german: "Für wie viele Personen?", chinese: "几位？", pronunciation: "菲尔 维 菲勒 佩尔措恩", category: "phrase", phraseCategory: "restaurant" },
  { german: "Für zwei Personen.", chinese: "两位。", pronunciation: "菲尔 茨维 佩尔措恩", category: "phrase", phraseCategory: "restaurant" },
  { german: "Haben Sie noch freie Tische?", chinese: "还有空位吗？", pronunciation: "哈本 贼 诺赫 弗赖 蒂施", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich bin Vegetarier.", chinese: "我是素食主义者。", pronunciation: "伊希 宾 维格塔里亚", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ich bin allergisch gegen...", chinese: "我对...过敏。", pronunciation: "伊希 宾 阿莱尔希施 盖根", category: "phrase", phraseCategory: "restaurant" },
  { german: "Ohne Milch und Zucker.", chinese: "不加牛奶和糖。", pronunciation: "欧恩 米尔希 翁特 茨克尔", category: "phrase", phraseCategory: "restaurant" },

  // 购物
  { german: "Kann ich Ihnen helfen?", chinese: "我能帮您吗？", pronunciation: "坎 伊希 伊hnen 赫尔弗", category: "phrase", phraseCategory: "shopping" },
  { german: "Ich schaue mich nur um.", chinese: "我只是随便看看。", pronunciation: "伊希 绍厄 米希 努尔 翁姆", category: "phrase", phraseCategory: "shopping" },
  { german: "Ich suche...", chinese: "我在找...", pronunciation: "伊希 祖赫", category: "phrase", phraseCategory: "shopping" },
  { german: "Was kostet das?", chinese: "这个多少钱？", pronunciation: "瓦斯 科斯特 达斯", category: "phrase", phraseCategory: "shopping" },
  { german: "Wie viel kostet das?", chinese: "这个多少钱？", pronunciation: "维 菲尔 科斯特 达斯", category: "phrase", phraseCategory: "shopping" },
  { german: "Das ist zu teuer.", chinese: "这太贵了。", pronunciation: "达斯 伊斯特 茨 托伊尔", category: "phrase", phraseCategory: "shopping" },
  { german: "Gibt es das billiger?", chinese: "有便宜点的吗？", pronunciation: "吉普特 埃斯 达斯 比尔格尔", category: "phrase", phraseCategory: "shopping" },
  { german: "Ich nehme das.", chinese: "我要这个。", pronunciation: "伊希 内么 达斯", category: "phrase", phraseCategory: "shopping" },
  { german: "Kann ich mit Karte bezahlen?", chinese: "我能用卡支付吗？", pronunciation: "坎 伊希 米特 卡尔特 贝察伦", category: "phrase", phraseCategory: "shopping" },
  { german: "Kann ich bar bezahlen?", chinese: "我能付现金吗？", pronunciation: "坎 伊希 巴尔 贝察伦", category: "phrase", phraseCategory: "shopping" },
  { german: "Ich nehme das mit.", chinese: "我要这个带走。", pronunciation: "伊希 内么 达斯 米特", category: "phrase", phraseCategory: "shopping" },
  { german: "Kann ich das umtauschen?", chinese: "我能退货吗？", pronunciation: "坎 伊希 达斯 翁姆陶申", category: "phrase", phraseCategory: "shopping" },
  { german: "Haben Sie eine Quittung?", chinese: "您有收据吗？", pronunciation: "哈本 贼 艾纳 克维通", category: "phrase", phraseCategory: "shopping" },
  { german: "Ich möchte das zurückgeben.", chinese: "我想退货。", pronunciation: "伊希 梅希特 达斯 楚吕克格伯", category: "phrase", phraseCategory: "shopping" },
  { german: "Wo ist die Kasse?", chinese: "收银台在哪里？", pronunciation: "沃 伊斯特 迪 卡斯", category: "phrase", phraseCategory: "shopping" },
  { german: "Gibt es einen Rabatt?", chinese: "有折扣吗？", pronunciation: "吉普特 埃斯 艾能 拉巴特", category: "phrase", phraseCategory: "shopping" },

  // 问路
  { german: "Entschuldigung, wo ist...?", chinese: "抱歉，...在哪里？", pronunciation: "恩特舒尔迪贡, 沃 伊斯特", category: "phrase", phraseCategory: "directions" },
  { german: "Wo ist die Toilette?", chinese: "洗手间在哪里？", pronunciation: "沃 伊斯特 迪 托亚莱特", category: "phrase", phraseCategory: "directions" },
  { german: "Wo ist der Bahnhof?", chinese: "火车站在哪里？", pronunciation: "沃 伊斯特 德尔 班霍夫", category: "phrase", phraseCategory: "directions" },
  { german: "Wo ist die Bushaltestelle?", chinese: "公交站在哪里？", pronunciation: "沃 伊斯特 迪 布斯哈尔特施泰勒", category: "phrase", phraseCategory: "directions" },
  { german: "Wie komme ich zum/zur...?", chinese: "我怎样才能到...？", pronunciation: "维 科么 伊希 楚姆/楚尔", category: "phrase", phraseCategory: "directions" },
  { german: "Wie komme ich zum Bahnhof?", chinese: "我怎样才能到火车站？", pronunciation: "维 科么 伊希 楚姆 班霍夫", category: "phrase", phraseCategory: "directions" },
  { german: "Wie komme ich zum Flughafen?", chinese: "我怎样才能到机场？", pronunciation: "维 科么 伊希 楚姆 弗吕克哈芬", category: "phrase", phraseCategory: "directions" },
  { german: "Ist das weit von hier?", chinese: "离这里远吗？", pronunciation: "伊斯特 达斯 维特 冯 黑尔", category: "phrase", phraseCategory: "directions" },
  { german: "Ist es weit?", chinese: "远吗？", pronunciation: "伊斯特 埃斯 维特", category: "phrase", phraseCategory: "directions" },
  { german: "Es ist ganz in der Nähe.", chinese: "就在附近。", pronunciation: "埃斯 伊斯特 甘茨 因 德尔 内厄", category: "phrase", phraseCategory: "directions" },
  { german: "Es ist nicht weit.", chinese: "不远。", pronunciation: "埃斯 伊斯特 尼希特 维特", category: "phrase", phraseCategory: "directions" },
  { german: "Es ist sehr weit.", chinese: "很远。", pronunciation: "埃斯 伊斯特 贼尔 维特", category: "phrase", phraseCategory: "directions" },
  { german: "Gehen Sie geradeaus.", chinese: "请直走。", pronunciation: "格恩 贼 格拉德奥斯", category: "phrase", phraseCategory: "directions" },
  { german: "Biegen Sie links ab.", chinese: "请左转。", pronunciation: "比根 贼 琳克思 阿普", category: "phrase", phraseCategory: "directions" },
  { german: "Biegen Sie rechts ab.", chinese: "请右转。", pronunciation: "比根 贼 雷希茨 阿普", category: "phrase", phraseCategory: "directions" },
  { german: "Nehmen Sie die U-Bahn.", chinese: "请坐地铁。", pronunciation: "内门 贼 迪 乌-班", category: "phrase", phraseCategory: "directions" },
  { german: "Nehmen Sie den Bus.", chinese: "请坐公交。", pronunciation: "内门 贼 登 布斯", category: "phrase", phraseCategory: "directions" },
  { german: "Nehmen Sie ein Taxi.", chinese: "请打车。", pronunciation: "内门 贼 艾因 塔克西", category: "phrase", phraseCategory: "directions" },
  { german: "Können Sie mir das auf der Karte zeigen?", chinese: "您能在地图上指给我看吗？", pronunciation: "克因恩 贼 米尔 达斯 奥夫 德尔 卡尔特 策根", category: "phrase", phraseCategory: "directions" },
  { german: "Können Sie das bitte wiederholen?", chinese: "您能再说一遍吗？", pronunciation: "克因恩 贼 达斯 比特 维德尔霍伦", category: "phrase", phraseCategory: "directions" },

  // 紧急情况
  { german: "Hilfe!", chinese: "救命！/帮助！", pronunciation: "希尔弗", category: "phrase", phraseCategory: "emergency" },
  { german: "Rufen Sie die Polizei!", chinese: "请叫警察！", pronunciation: "鲁芬 贼 迪 波利蔡", category: "phrase", phraseCategory: "emergency" },
  { german: "Rufen Sie einen Arzt!", chinese: "请叫医生！", pronunciation: "鲁芬 贼 艾能 阿尔茨特", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich brauche einen Arzt.", chinese: "我需要医生。", pronunciation: "伊希 布劳赫 艾能 阿尔茨特", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich brauche Hilfe.", chinese: "我需要帮助。", pronunciation: "伊希 布劳赫 希尔弗", category: "phrase", phraseCategory: "emergency" },
  { german: "Es ist ein Notfall.", chinese: "这是紧急情况。", pronunciation: "埃斯 伊斯特 艾因 诺特法尔", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich habe mich verlaufen.", chinese: "我迷路了。", pronunciation: "伊希 哈伯 米希 菲尔劳恩", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich habe meinen Pass verloren.", chinese: "我丢了护照。", pronunciation: "伊希 哈伯 迈能 帕斯 菲尔洛伦", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich wurde bestohlen.", chinese: "我被偷了。", pronunciation: "伊希 乌尔达 贝施托伦", category: "phrase", phraseCategory: "emergency" },
  { german: "Es gibt einen Unfall.", chinese: "发生了事故。", pronunciation: "埃斯 吉普特 艾因 翁法尔", category: "phrase", phraseCategory: "emergency" },
  { german: "Rufen Sie einen Krankenwagen!", chinese: "请叫救护车！", pronunciation: "鲁芬 贼 艾能 克朗肯瓦根", category: "phrase", phraseCategory: "emergency" },
  { german: "Wo ist das Krankenhaus?", chinese: "医院在哪里？", pronunciation: "沃 伊斯特 达斯 克朗肯豪斯", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich brauche Medikamente.", chinese: "我需要药物。", pronunciation: "伊希 布劳赫 梅迪卡门特", category: "phrase", phraseCategory: "emergency" },
  { german: "Ich bin krank.", chinese: "我生病了。", pronunciation: "伊希 宾 克朗克", category: "phrase", phraseCategory: "emergency" },
  { german: "Es tut mir weh.", chinese: "我这里疼。", pronunciation: "埃斯 图特 米尔 维", category: "phrase", phraseCategory: "emergency" },

  // 情感表达
  { german: "Ich liebe dich.", chinese: "我爱你。", pronunciation: "伊希 里伯 迪希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich hab dich lieb.", chinese: "我喜欢你。", pronunciation: "伊希 哈普 迪希 利普", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich vermisse dich.", chinese: "我想你。", pronunciation: "伊希 菲尔米色 迪希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin traurig.", chinese: "我很难过。", pronunciation: "伊希 宾 特劳里希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin froh.", chinese: "我很高兴。", pronunciation: "伊希 宾 弗罗", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin glücklich.", chinese: "我很幸福。", pronunciation: "伊希 宾 格吕克里希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin müde.", chinese: "我很累。", pronunciation: "伊希 宾 米德", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin hungrig.", chinese: "我饿了。", pronunciation: "伊希 宾 洪格里希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin durstig.", chinese: "我渴了。", pronunciation: "伊希 宾 杜尔斯蒂希", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin wütend.", chinese: "我很生气。", pronunciation: "伊希 宾 维滕特", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin aufgeregt.", chinese: "我很兴奋。", pronunciation: "伊希 宾 奥弗格雷希特", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin nervös.", chinese: "我很紧张。", pronunciation: "伊希 宾 奈尔沃斯", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin entspannt.", chinese: "我很放松。", pronunciation: "伊希 宾 恩特施潘特", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich bin überrascht.", chinese: "我很惊讶。", pronunciation: "伊希 宾 于伯尔施特", category: "phrase", phraseCategory: "emotions" },
  { german: "Das macht mir Sorgen.", chinese: "这让我担心。", pronunciation: "达斯 马希特 米尔 佐尔根", category: "phrase", phraseCategory: "emotions" },
  { german: "Ich mache mir Sorgen um...", chinese: "我担心...", pronunciation: "伊希 马赫 米尔 佐尔根 翁姆", category: "phrase", phraseCategory: "emotions" },

  // 数字相关
  { german: "Wie viel kostet das?", chinese: "这个多少钱？", pronunciation: "维 菲尔 科斯特 达斯", category: "phrase", phraseCategory: "numbers" },
  { german: "Wie teuer ist das?", chinese: "这有多贵？", pronunciation: "维 托伊尔 伊斯特 达斯", category: "phrase", phraseCategory: "numbers" },
  { german: "Es ist kostenlos.", chinese: "这是免费的。", pronunciation: "埃斯 伊斯特 科斯滕洛斯", category: "phrase", phraseCategory: "numbers" },
  { german: "Es ist umsonst.", chinese: "这是免费的。", pronunciation: "埃斯 伊斯特 翁姆佐恩斯特", category: "phrase", phraseCategory: "numbers" },
  { german: "Das ist zu teuer für mich.", chinese: "这对我太贵了。", pronunciation: "达斯 伊斯特 茨 托伊尔 菲尔 米希", category: "phrase", phraseCategory: "numbers" },
  { german: "Haben Sie Kleingeld?", chinese: "您有零钱吗？", pronunciation: "哈本 贼 克莱因格尔特", category: "phrase", phraseCategory: "numbers" },
  { german: "Kann ich mit Karte zahlen?", chinese: "我能用卡支付吗？", pronunciation: "坎 伊希 米特 卡尔特 察伦", category: "phrase", phraseCategory: "numbers" },
  { german: "Kann ich in Raten zahlen?", chinese: "我能分期付款吗？", pronunciation: "坎 伊希 因 拉滕 察伦", category: "phrase", phraseCategory: "numbers" },
  { german: "Gibt es einen Rabatt?", chinese: "有折扣吗？", pronunciation: "吉普特 埃斯 艾能 拉巴特", category: "phrase", phraseCategory: "numbers" },
  { german: "Ich möchte einen Rabatt.", chinese: "我想打个折。", pronunciation: "伊希 梅希特 艾能 拉巴特", category: "phrase", phraseCategory: "numbers" },
  { german: "Wie viel Uhr ist es?", chinese: "现在几点了？", pronunciation: "维 菲尔 乌尔 伊斯特 埃斯", category: "phrase", phraseCategory: "numbers" },
  { german: "Um wie viel Uhr?", chinese: "几点？", pronunciation: "翁姆 维 菲尔 乌尔", category: "phrase", phraseCategory: "numbers" },
  { german: "Es ist zehn Uhr.", chinese: "十点了。", pronunciation: "埃斯 伊斯特 茨恩 乌尔", category: "phrase", phraseCategory: "numbers" },

  // 时间相关
  { german: "Wann öffnet das Geschäft?", chinese: "商店什么时候开门？", pronunciation: "万 厄夫内特 达斯 格谢夫特", category: "phrase", phraseCategory: "time" },
  { german: "Wann schließt das Geschäft?", chinese: "商店什么时候关门？", pronunciation: "万 施利斯特 达斯 格谢夫特", category: "phrase", phraseCategory: "time" },
  { german: "Das Geschäft ist von 9 bis 18 Uhr geöffnet.", chinese: "商店营业时间是9点到18点。", pronunciation: "达斯 格谢夫特 伊斯特 冯 奈恩 比斯 阿赫特赞 乌尔 格厄弗内特", category: "phrase", phraseCategory: "time" },
  { german: "Um wie viel Uhr treffen wir uns?", chinese: "我们几点见面？", pronunciation: "翁姆 维 菲尔 乌尔 特雷芬 维尔 翁斯", category: "phrase", phraseCategory: "time" },
  { german: "Um halb neun.", chinese: "八点半。", pronunciation: "翁姆 哈尔布 奈恩", category: "phrase", phraseCategory: "time" },
  { german: "Um Viertel vor acht.", chinese: "七点四十五。", pronunciation: "翁姆 菲尔特尔 福尔 阿希特", category: "phrase", phraseCategory: "time" },
  { german: "Um Viertel nach neun.", chinese: "九点十五。", pronunciation: "翁姆 菲尔特尔 纳赫 奈恩", category: "phrase", phraseCategory: "time" },
  { german: "Heute.", chinese: "今天。", pronunciation: "霍伊特", category: "phrase", phraseCategory: "time" },
  { german: "Morgen.", chinese: "明天。", pronunciation: "莫尔根", category: "phrase", phraseCategory: "time" },
  { german: "Übermorgen.", chinese: "后天。", pronunciation: "于伯尔莫尔根", category: "phrase", phraseCategory: "time" },
  { german: "Gestern.", chinese: "昨天。", pronunciation: "格斯特恩", category: "phrase", phraseCategory: "time" },
  { german: "Vorgestern.", chinese: "前天。", pronunciation: "福尔格斯特恩", category: "phrase", phraseCategory: "time" },
  { german: "Heute Morgen.", chinese: "今天早上。", pronunciation: "霍伊特 莫尔根", category: "phrase", phraseCategory: "time" },
  { german: "Heute Nachmittag.", chinese: "今天下午。", pronunciation: "霍伊特 纳赫米塔克", category: "phrase", phraseCategory: "time" },
  { german: "Heute Abend.", chinese: "今天晚上。", pronunciation: "霍伊特 阿本特", category: "phrase", phraseCategory: "time" },

  // 天气相关
  { german: "Wie ist das Wetter?", chinese: "天气怎么样？", pronunciation: "维 伊斯特 达斯 维特", category: "phrase", phraseCategory: "weather" },
  { german: "Das Wetter ist schön.", chinese: "天气很好。", pronunciation: "达斯 维特 伊斯特 舍恩", category: "phrase", phraseCategory: "weather" },
  { german: "Das Wetter ist schlecht.", chinese: "天气不好。", pronunciation: "达斯 维特 伊斯特 施莱希特", category: "phrase", phraseCategory: "weather" },
  { german: "Es regnet.", chinese: "下雨了。", pronunciation: "埃斯 雷格内特", category: "phrase", phraseCategory: "weather" },
  { german: "Es schneit.", chinese: "下雪了。", pronunciation: "埃斯 施奈特", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist sonnig.", chinese: "出太阳了。", pronunciation: "埃斯 伊斯特 佐尼希", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist wolkig.", chinese: "多云。", pronunciation: "埃斯 伊斯特 沃利基希", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist windig.", chinese: "有风。", pronunciation: "埃斯 伊斯特 温迪希", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist kalt.", chinese: "冷。", pronunciation: "埃斯 伊斯特 卡尔特", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist warm.", chinese: "暖和。", pronunciation: "埃斯 伊斯特 瓦尔姆", category: "phrase", phraseCategory: "weather" },
  { german: "Es ist heiß.", chinese: "热。", pronunciation: "埃斯 伊斯特 哈伊斯", category: "phrase", phraseCategory: "weather" },
  { german: "Wie wird das Wetter morgen?", chinese: "明天天气怎么样？", pronunciation: "维 乌尔特 达斯 维特 莫尔根", category: "phrase", phraseCategory: "weather" },
  { german: "Es soll regnen.", chinese: "据说要下雨。", pronunciation: "埃斯 佐尔 雷格嫩", category: "phrase", phraseCategory: "weather" },

  // 电话相关
  { german: "Hallo, hier spricht...", chinese: "您好，我是...（电话用语）", pronunciation: "哈洛, 黑尔 施普里希特", category: "phrase", phraseCategory: "phone" },
  { german: "Mit wem spreche ich?", chinese: "您是哪位？", pronunciation: "米特 维姆 施普雷希 伊希", category: "phrase", phraseCategory: "phone" },
  { german: "Kann ich bitte... sprechen?", chinese: "我能和...通话吗？", pronunciation: "坎 伊希 比特 施普雷希", category: "phrase", phraseCategory: "phone" },
  { german: "Einen Moment bitte.", chinese: "请稍等。", pronunciation: "艾能 莫门特 比特", category: "phrase", phraseCategory: "phone" },
  { german: "Ich rufe später zurück.", chinese: "我稍后打回去。", pronunciation: "伊希 鲁弗 施派特 楚吕克", category: "phrase", phraseCategory: "phone" },
  { german: "Können Sie eine Nachricht hinterlassen?", chinese: "您能留个言吗？", pronunciation: "克因恩 贼 艾纳 纳赫里希特 欣特拉斯恩", category: "phrase", phraseCategory: "phone" },
  { german: "Die Nummer ist besetzt.", chinese: "占线。", pronunciation: "迪 怒默 伊斯特 贝泽特", category: "phrase", phraseCategory: "phone" },
  { german: "Die Verbindung ist schlecht.", chinese: "信号不好。", pronunciation: "迪 弗尔宾杜希 伊斯特 施莱希特", category: "phrase", phraseCategory: "phone" },
  { german: "Ich habe dich falsch verstanden.", chinese: "我听错了。", pronunciation: "伊希 哈伯 迪希 法尔施 菲尔施坦登", category: "phrase", phraseCategory: "phone" },
  { german: "Kann ich Ihnen eine Nachricht hinterlassen?", chinese: "我能给您留个言吗？", pronunciation: "坎 伊希 伊hnen 艾纳 纳赫里希特 欣特拉斯恩", category: "phrase", phraseCategory: "phone" },
  { german: "Auflegen, bitte.", chinese: "请挂电话。", pronunciation: "奥弗莱根, 比特", category: "phrase", phraseCategory: "phone" },

  // 工作/学习
  { german: "Ich arbeite bei...", chinese: "我在...工作。", pronunciation: "伊希 阿尔拜特 拜", category: "phrase", phraseCategory: "work" },
  { german: "Ich bin Student.", chinese: "我是学生。", pronunciation: "伊希 宾 施图登特", category: "phrase", phraseCategory: "work" },
  { german: "Ich studiere an der Universität.", chinese: "我在大学学习。", pronunciation: "伊希 施图迪雷 安 德尔 乌尼维尔齐特", category: "phrase", phraseCategory: "work" },
  { german: "Ich suche einen Job.", chinese: "我在找工作。", pronunciation: "伊希 祖赫 艾能 乔普", category: "phrase", phraseCategory: "work" },
  { german: "Ich bin selbstständig.", chinese: "我是自由职业者。", pronunciation: "伊希 宾 泽尔普施特恩迪希", category: "phrase", phraseCategory: "work" },
  { german: "Was machen Sie beruflich?", chinese: "您是做什么工作的？", pronunciation: "瓦斯 马亨 贼 贝吕弗利希", category: "phrase", phraseCategory: "work" },
  { german: "Ich arbeite als...", chinese: "我当...（职业）", pronunciation: "伊希 阿尔拜特 阿尔斯", category: "phrase", phraseCategory: "work" },
  { german: "Wie gefällt Ihnen Ihr Job?", chinese: "您的工作怎么样？", pronunciation: "维 格弗尔特 伊hnen 维尔 乔普", category: "phrase", phraseCategory: "work" },
  { german: "Ich bin im Urlaub.", chinese: "我在休假。", pronunciation: "伊希 宾 因姆 乌尔劳夫", category: "phrase", phraseCategory: "work" },
  { german: "Ich bin krankgeschrieben.", chinese: "我病假了。", pronunciation: "伊希 宾 克朗克格施里本", category: "phrase", phraseCategory: "work" },
  { german: "Haben Sie Arbeitserlaubnis?", chinese: "您有工作许可吗？", pronunciation: "哈本 贼 阿尔贝茨罗伊布尼斯", category: "phrase", phraseCategory: "work" },
  { german: "Ich möchte mich bewerben.", chinese: "我想申请。", pronunciation: "伊希 梅希特 米希 贝维尔本", category: "phrase", phraseCategory: "work" },
  { german: "Wo ist das Büro?", chinese: "办公室在哪里？", pronunciation: "沃 伊斯特 达斯 布里奥", category: "phrase", phraseCategory: "work" },
  { german: "Ich habe einen Termin.", chinese: "我有个预约。", pronunciation: "伊希 哈伯 艾能 泰尔明", category: "phrase", phraseCategory: "work" },
  { german: "Kann ich einen Termin machen?", chinese: "我能预约吗？", pronunciation: "坎 伊希 艾能 泰尔明 马亨", category: "phrase", phraseCategory: "work" },

  // 兴趣爱好
  { german: "Was sind Ihre Hobbys?", chinese: "您的爱好是什么？", pronunciation: "瓦斯 辛德 伊雷 霍比斯", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich mag...", chinese: "我喜欢...", pronunciation: "伊希 马克", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich interessiere mich für...", chinese: "我对...感兴趣。", pronunciation: "伊希 因特雷塞雷 米希 菲尔", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich spiele gern...", chinese: "我喜欢玩...（运动/游戏）", pronunciation: "伊希 施皮勒 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich höre gern Musik.", chinese: "我喜欢听音乐。", pronunciation: "伊希 赫雷 格尔恩 穆兹克", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich sehe gern Filme.", chinese: "我喜欢看电影。", pronunciation: "伊希 泽厄 格尔恩 菲尔么", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich lese gern Bücher.", chinese: "我喜欢看书。", pronunciation: "伊希 雷泽 格尔恩 布歇尔", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich treibe gern Sport.", chinese: "我喜欢运动。", pronunciation: "伊希 特里贝 格尔恩 施波尔特", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich reise gern.", chinese: "我喜欢旅行。", pronunciation: "伊希 赖泽 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich koche gern.", chinese: "我喜欢做饭。", pronunciation: "伊希 科赫 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich male gern.", chinese: "我喜欢画画。", pronunciation: "伊希 马勒 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich fotografiere gern.", chinese: "我喜欢摄影。", pronunciation: "伊希 弗托格拉菲尔 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich spiele Gitarre.", chinese: "我弹吉他。", pronunciation: "伊希 施皮勒 吉他雷", category: "phrase", phraseCategory: "hobbies" },
  { german: "Ich tanze gern.", chinese: "我喜欢跳舞。", pronunciation: "伊希 丹策 格尔恩", category: "phrase", phraseCategory: "hobbies" },
  { german: "Das ist mein Hobby.", chinese: "这是我的爱好。", pronunciation: "达斯 伊斯特 迈因 霍比", category: "phrase", phraseCategory: "hobbies" },

  // 酒店/住宿
  { german: "Ich möchte ein Zimmer buchen.", chinese: "我想订一个房间。", pronunciation: "伊希 梅希特 艾因 齐默 布亨", category: "phrase", phraseCategory: "hotel" },
  { german: "Haben Sie noch freie Zimmer?", chinese: "还有空房吗？", pronunciation: "哈本 贼 诺赫 弗赖 齐默", category: "phrase", phraseCategory: "hotel" },
  { german: "Ich möchte ein Doppelzimmer.", chinese: "我要一个双人间。", pronunciation: "伊希 梅希特 艾因 多佩尔齐默", category: "phrase", phraseCategory: "hotel" },
  { german: "Ich möchte ein Einzelzimmer.", chinese: "我要一个单人间。", pronunciation: "伊希 梅希特 艾因 艾因策尔齐默", category: "phrase", phraseCategory: "hotel" },
  { german: "Mit Frühstück?", chinese: "含早餐吗？", pronunciation: "米特 弗吕什特吕克", category: "phrase", phraseCategory: "hotel" },
  { german: "Wie viel kostet eine Nacht?", chinese: "一晚多少钱？", pronunciation: "维 菲尔 科斯特 艾纳 纳希特", category: "phrase", phraseCategory: "hotel" },
  { german: "Ich bleibe für... Nächte.", chinese: "我要住...晚。", pronunciation: "伊希 布莱贝 菲尔 奈赫特", category: "phrase", phraseCategory: "hotel" },
  { german: "Wo ist mein Zimmer?", chinese: "我的房间在哪里？", pronunciation: "沃 伊斯特 迈因 齐默", category: "phrase", phraseCategory: "hotel" },
  { german: "Der Schlüssel, bitte.", chinese: "请给我钥匙。", pronunciation: "德尔 施吕塞尔, 比特", category: "phrase", phraseCategory: "hotel" },
  { german: "Ich möchte auschecken.", chinese: "我想退房。", pronunciation: "伊希 梅希特 奥斯切肯", category: "phrase", phraseCategory: "hotel" },
  { german: "Kann ich die Rechnung haben?", chinese: "我能看一下账单吗？", pronunciation: "坎 伊希 迪 雷希宁 哈本", category: "phrase", phraseCategory: "hotel" },
  { german: "Gibt es WLAN?", chinese: "有无线网络吗？", pronunciation: "吉普特 埃斯 维兰", category: "phrase", phraseCategory: "hotel" },
  { german: "Ist das Frühstück inbegriffen?", chinese: "早餐包含在内吗？", pronunciation: "伊斯特 达斯 弗吕什特吕克 因贝格里芬", category: "phrase", phraseCategory: "hotel" },
  { german: "Um wie viel Uhr ist das Frühstück?", chinese: "早餐几点开始？", pronunciation: "翁姆 维 菲尔 乌尔 伊斯特 达斯 弗吕什特吕克", category: "phrase", phraseCategory: "hotel" },

  // 身体状况
  { german: "Ich fühle mich nicht wohl.", chinese: "我感觉不太舒服。", pronunciation: "伊希 菲勒 米希 尼希特 沃尔", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Kopfschmerzen.", chinese: "我头疼。", pronunciation: "伊希 哈伯 科普夫施梅尔岑", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Bauchschmerzen.", chinese: "我肚子疼。", pronunciation: "伊希 哈伯 巴乌希施梅尔岑", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Halsschmerzen.", chinese: "我喉咙疼。", pronunciation: "伊希 哈伯 哈尔斯施梅尔岑", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Fieber.", chinese: "我发烧了。", pronunciation: "伊希 哈伯 菲伯", category: "phrase", phraseCategory: "health" },
  { german: "Ich huste.", chinese: "我咳嗽。", pronunciation: "伊希 胡斯特", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Schnupfen.", chinese: "我感冒了。", pronunciation: "伊希 哈伯 施努普芬", category: "phrase", phraseCategory: "health" },
  { german: "Ich bin erkältet.", chinese: "我感冒了。", pronunciation: "伊希 宾 埃尔凯尔泰特", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Durchfall.", chinese: "我拉肚子了。", pronunciation: "伊希 哈伯 杜尔希法尔", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Rückenschmerzen.", chinese: "我背疼。", pronunciation: "伊希 哈伯 吕肯施梅尔岑", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe Zahnschmerzen.", chinese: "我牙疼。", pronunciation: "伊希 哈伯 察恩施梅尔岑", category: "phrase", phraseCategory: "health" },
  { german: "Ich habe mich verletzt.", chinese: "我受伤了。", pronunciation: "伊希 哈伯 米希 菲尔雷特斯特", category: "phrase", phraseCategory: "health" },
  { german: "Ich brauche ein Pflaster.", chinese: "我需要创可贴。", pronunciation: "伊希 布劳赫 艾因 普拉斯特", category: "phrase", phraseCategory: "health" },
  { german: "Ich brauche Schmerztabletten.", chinese: "我需要止痛药。", pronunciation: "伊希 布劳赫 施梅尔斯塔布莱顿", category: "phrase", phraseCategory: "health" },
];

// ========== 主题对话 ==========
interface DialogLine {
  speaker: "A" | "B";  // A=说话者1, B=说话者2
  german: string;
  chinese: string;
  pronunciation?: string;
}

interface Dialog {
  id: string;
  title: string;
  titleChinese: string;
  scenario: string;
  scenarioChinese: string;
  lines: DialogLine[];
}

const dialogs: Dialog[] = [
  // 1. 自我介绍
  {
    id: "self-intro",
    title: "自我介绍",
    titleChinese: "自我介紹介",
    scenario: "Sich vorstellen",
    scenarioChinese: "在社交场合介绍自己",
    lines: [
      { speaker: "A", german: "Guten Tag! Ich heiße Lisa Müller.", chinese: "您好！我叫丽莎·米勒。", pronunciation: "古腾 塔克! 伊希 嗨ß 丽莎 米勒" },
      { speaker: "B", german: "Guten Tag, Lisa! Freut mich. Ich bin Peter Schmidt.", chinese: "您好，丽莎！很高兴认识你。我叫彼得·施密特。", pronunciation: "古腾 塔克, 丽莎! 弗罗伊特 米希. 伊希 宾 彼得 施密特" },
      { speaker: "A", german: "Freut mich auch, Peter! Woher kommen Sie?", chinese: "我也很高兴认识你，彼得！您来自哪里？", pronunciation: "弗罗伊特 米希 奥希, 彼得! 沃黑尔 科门 贼" },
      { speaker: "B", german: "Ich komme aus Berlin. Und Sie?", chinese: "我来自柏林。您呢？", pronunciation: "伊希 科么 奥斯 柏林. 翁特 贼" },
      { speaker: "A", german: "Ich komme aus München. Was machen Sie beruflich?", chinese: "我来自慕尼黑。您是做什么工作的？", pronunciation: "伊希 科么 奥斯 明chen. 瓦斯 马亨 贼 贝吕弗利希" },
      { speaker: "B", german: "Ich bin Lehrerin. Und Sie?", chinese: "我是老师。您呢？", pronunciation: "伊希 宾 莱雷林. 翁特 贼" },
      { speaker: "A", german: "Ich bin Studentin. Ich studiere Deutsch an der Universität.", chinese: "我是大学生。我在大学学习德语。", pronunciation: "伊希 宾 施图丁亭. 伊希 施图迪雷 德意志 安 德尔 乌尼维尔齐特" },
      { speaker: "B", german: "Das ist ja toll! Sprechen Sie gut Deutsch?", chinese: "太棒了！您德语说得很好吗？", pronunciation: "达斯 伊斯特 呀 托尔! 施普雷chen 贼 古特 德意志" },
      { speaker: "A", german: "Es geht so. Ich lerne erst seit einem Jahr.", chinese: "一般般。我才学了一年。", pronunciation: "埃斯 格特 佐. 伊希 勒尔恩 埃斯特 希特 艾因 姆 雅尔" },
      { speaker: "B", german: "Das ist schon sehr gut! Weiter so!", chinese: "已经很好！继续加油！", pronunciation: "达斯 伊斯特 雄 贼尔 古特! 维特 尔 佐" },
    ]
  },
  // 2. 问路
  {
    id: "asking-directions",
    title: "问路",
    titleChinese: "道順を尋ねる",
    scenario: "Nach dem Weg fragen",
    scenarioChinese: "在街上询问路线",
    lines: [
      { speaker: "A", german: "Entschuldigung, können Sie mir bitte helfen?", chinese: "抱歉，您能帮我一下吗？", pronunciation: "恩特舒尔迪贡, 克因en 贼 米尔 比特 赫尔弗" },
      { speaker: "B", german: "Ja, natürlich! Was kann ich für Sie tun?", chinese: "当然可以！我能为您做什么？", pronunciation: "呀, 那图尔利希! 瓦斯 坎 伊希 菲尔 贼 敦" },
      { speaker: "A", german: "Wo ist der Bahnhof, bitte?", chinese: "请问火车站在哪里？", pronunciation: "沃 伊斯特 德尔 班霍夫, 比特" },
      { speaker: "B", german: "Der Bahnhof? Das ist nicht weit von hier.", chinese: "火车站？离这里不远。", pronunciation: "德尔 班霍夫? 达斯 伊斯特 尼希特 维特 冯 黑尔" },
      { speaker: "A", german: "Wie komme ich dahin?", chinese: "我怎么去那里？", pronunciation: "维 科么 伊希 达欣" },
      { speaker: "B", german: "Gehen Sie geradeaus bis zur Ampel. Dann biegen Sie links ab.", chinese: "您直走直到红绿灯。然后左转。", pronunciation: "格恩 贼 格拉德奥斯 比斯 茨尔 阿姆佩尔. 丹 比根 贼 琳克思 阿普" },
      { speaker: "A", german: "Und dann?", chinese: "然后呢？", pronunciation: "翁特 丹" },
      { speaker: "B", german: "Dann sehen Sie den Bahnhof auf der rechten Seite.", chinese: "然后您会在右侧看到火车站。", pronunciation: "丹 泽恩 贼 登 班霍夫 奥夫 德尔 雷希ten 赛特" },
      { speaker: "A", german: "Vielen Dank für Ihre Hilfe!", chinese: "非常感谢您的帮助！", pronunciation: "菲林 丹克 菲尔 伊雷 希尔弗" },
      { speaker: "B", german: "Keine Ursache! Gute Fahrt!", chinese: "不客气！祝您旅途愉快！", pronunciation: "凯娜 乌尔扎赫! 古特 法尔特" },
    ]
  },
  // 3. 餐厅点餐
  {
    id: "restaurant-order",
    title: "餐厅点餐",
    titleChinese: "レストランで注文",
    scenario: "Im Restaurant bestellen",
    scenarioChinese: "在餐厅吃饭点餐",
    lines: [
      { speaker: "A", german: "Guten Tag! Haben Sie einen Tisch für zwei Personen?", chinese: "您好！请问有两人桌吗？", pronunciation: "古腾 塔克! 哈本 贼 艾能 蒂希 菲尔 茨维 佩尔措恩" },
      { speaker: "B", german: "Ja, haben Sie einen Tisch bestellt?", chinese: "有的，请问您有预订吗？", pronunciation: "呀, 哈本 贼 艾能 蒂希 贝施泰尔特" },
      { speaker: "A", german: "Nein, leider nicht. Haben Sie noch freie Tische?", chinese: "没有，请问还有空位吗？", pronunciation: "奈恩, 莱德 尼希特. 哈本 贼 诺赫 弗赖 蒂施" },
      { speaker: "B", german: "Ja, kommen Sie bitte mit. Hier ist Ihr Tisch.", chinese: "有的，请跟我来。这是您的桌子。", pronunciation: "呀, 科门 贼 比特 米特. 黑尔 伊斯特 维尔 蒂希" },
      { speaker: "A", german: "Danke. Können wir bitte die Speisekarte haben?", chinese: "谢谢。可以给我们菜单吗？", pronunciation: "丹克. 克因 维尔 比特 迪 施派泽卡尔特 哈本" },
      { speaker: "B", german: "Natürlich! Hier ist die Speisekarte. Ein Herr wird gleich zu Ihnen kommen.", chinese: "当然！这是菜单。服务员马上过来。", pronunciation: "那图尔利希! 黑尔 伊斯特 迪 施派泽卡尔特. 艾因 黑尔 特 格兰 茨 贼 伊hnen 科门" },
      { speaker: "A", german: "Ich möchte das Schnitzel mit Pommes frites.", chinese: "我想点炸肉排配薯条。", pronunciation: "伊希 梅希特 达斯 施尼策尔 米特 波姆 弗里特斯" },
      { speaker: "B", german: "Gute Wahl! Und zu trinken?", chinese: "好选择！要喝点什么吗？", pronunciation: "古特 瓦尔! 翁特 茨 特林肯" },
      { speaker: "A", german: "Ich möchte ein Glas Rotwein, bitte.", chinese: "我要一杯红葡萄酒。", pronunciation: "伊希 梅希特 艾因 格拉斯 罗特瓦因, 比特" },
      { speaker: "B", german: "Die Rechnung, bitte.", chinese: "请结账。", pronunciation: "迪 雷希宁, 比特" },
    ]
  },
  // 4. 购物
  {
    id: "shopping",
    title: "购物",
    titleChinese: "買い物",
    scenario: "Im Geschäft einkaufen",
    scenarioChinese: "在商店购物",
    lines: [
      { speaker: "A", german: "Guten Tag! Kann ich Ihnen helfen?", chinese: "您好！有什么可以帮您的吗？", pronunciation: "古腾 塔克! 坎 伊希 伊hnen 赫尔弗" },
      { speaker: "B", german: "Ich suche ein Hemd für meinen Mann.", chinese: "我在找一件衬衫给我丈夫。", pronunciation: "伊希 祖赫 艾因 赫姆特 菲尔 迈能 曼" },
      { speaker: "A", german: "Welche Größe braucht er?", chinese: "他穿什么尺码？", pronunciation: "维勒切 格勒泽 布劳希特 埃尔" },
      { speaker: "B", german: "Er braucht Größe M.", chinese: "他穿M码。", pronunciation: "埃尔 布劳希特 格勒泽 艾姆" },
      { speaker: "A", german: "Hier haben wir verschiedene Hemden. Wie gefällt Ihnen dieses?", chinese: "这里有各种衬衫。您觉得这件怎么样？", pronunciation: "黑尔 哈本 维尔 弗尔施ieden 赫门德. 维 格弗尔特 伊hnen 达泽斯" },
      { speaker: "B", german: "Das sieht gut aus! Was kostet das?", chinese: "这件不错！多少钱？", pronunciation: "达斯 泽特 古特 奥斯! 瓦斯 科斯特 达斯" },
      { speaker: "A", german: "Das kostet 49,90 Euro.", chinese: "这件49.90欧元。", pronunciation: "达斯 科斯特 菲尔茨伊格 诺伊齐希 奥伊罗" },
      { speaker: "B", german: "Das ist ja sehr teuer! Gibt es einen Rabatt?", chinese: "好贵啊！有折扣吗？", pronunciation: "达斯 伊斯特 呀 贼尔 托伊尔! 吉普特 埃斯 艾能 拉巴特" },
      { speaker: "A", german: "Heute haben wir 20% Rabatt auf alle Hemden.", chinese: "今天所有衬衫打8折。", pronunciation: "霍伊特 哈本 维尔 茨万茨伊 普罗岑特 拉巴特 奥夫 阿尔勒 赫门德" },
      { speaker: "B", german: "Perfekt! Dann nehme ich das.", chinese: "完美！那我要这件。", pronunciation: "佩尔费克特! 丹 内么 伊希 达斯" },
    ]
  },
  // 5. 机场
  {
    id: "airport",
    title: "机场",
    titleChinese: "空港",
    scenario: "Am Flughafen",
    scenarioChinese: "在机场办理登机手续",
    lines: [
      { speaker: "A", german: "Guten Tag! Ich möchte meinen Flug nach Berlin checken.", chinese: "您好！我想办理去柏林的登机手续。", pronunciation: "古腾 塔克! 伊希 梅希特 迈能 弗吕格 纳赫 柏林 切肯" },
      { speaker: "B", german: "Haben Sie Ihren Pass und Ihr Flugticket dabei?", chinese: "您带护照和机票了吗？", pronunciation: "哈本 贼 伊hnen 帕斯 维尔 埃尔 弗吕格提克特 达比" },
      { speaker: "A", german: "Ja, hier bitte.", chinese: "有的，给您。", pronunciation: "呀, 黑尔 比特" },
      { speaker: "B", german: "Danke. Möchten Sie einen Fensterplatz oder einen Gangplatz?", chinese: "谢谢。您想要靠窗还是过道座位？", pronunciation: "丹克. 梅希ten 贼 艾能 芬斯特普拉茨 奥德 艾能 刚普拉茨" },
      { speaker: "A", german: "Einen Fensterplatz, bitte.", chinese: "请给我靠窗的座位。", pronunciation: "艾能 芬斯特普拉茨, 比特" },
      { speaker: "B", german: "Kein Problem. Hier ist Ihre Bordkarte. Gate B12.", chinese: "没问题。这是您的登机牌。B12登机口。", pronunciation: "凯因 普罗布莱姆. 黑尔 伊斯特 伊雷 博特卡尔特. gate 贝伊 茨沃尔弗" },
      { speaker: "A", german: "Vielen Dank! Wann boarding?", chinese: "非常感谢！什么时候登机？", pronunciation: "菲林 丹克! 万 博尔丁" },
      { speaker: "B", german: "Boarding ist um 10:30 Uhr an Gate B12.", chinese: "10:30在B12登机口登机。", pronunciation: "博尔丁 伊斯特 翁姆 茨恩:里斯希 乌尔 安 Gate 贝伊 茨沃尔弗" },
      { speaker: "A", german: "Vielen Dank für Ihre Hilfe!", chinese: "谢谢您的帮助！", pronunciation: "菲林 丹克 菲尔 伊雷 希尔弗" },
      { speaker: "B", german: "Gute Reise! Einen schönen Flug!", chinese: "旅途愉快！飞行顺利！", pronunciation: "古特 赖泽! 艾能 舍恩 弗吕克" },
    ]
  },
  // 6. 酒店入住
  {
    id: "hotel-checkin",
    title: "酒店入住",
    titleChinese: "ホテルチェックイン",
    scenario: "Im Hotel einchecken",
    scenarioChinese: "在酒店办理入住",
    lines: [
      { speaker: "A", german: "Guten Abend! Ich habe ein Zimmer reserviert.", chinese: "晚上好！我预订了房间。", pronunciation: "古腾 阿本特! 伊希 哈伯 艾因 齐默 雷泽尔维特" },
      { speaker: "B", german: "Guten Abend! Unter welchem Namen, bitte?", chinese: "晚上好！请问叫什么名字？", pronunciation: "古腾 阿本特! 翁特 维勒谢姆 纳门, 比特" },
      { speaker: "A", german: "Mein Name ist Zhang Wei.", chinese: "我叫张伟。", pronunciation: "迈因 纳默 伊斯特 张 魏" },
      { speaker: "B", german: "Einen Moment, bitte. Ja, ich habe Ihr Zimmer. Einzelzimmer oder Doppelzimmer?", chinese: "请稍等。是的，我找到您的房间了。单人间还是双人间？", pronunciation: "艾能 莫门特, 比特. 呀, 伊希 哈伯 维尔 齐默. 艾因策尔齐默 奥德 多佩尔齐默" },
      { speaker: "A", german: "Doppelzimmer, bitte.", chinese: "双人间。", pronunciation: "多佩尔齐默, 比特" },
      { speaker: "B", german: "Perfekt! Hier ist Ihr Zimmerschlüssel. Zimmer 502.", chinese: "完美！这是您的钥匙。502房间。", pronunciation: "佩尔费克特! 黑尔 伊斯特 维尔 齐默施吕塞尔. 齐默 菲恩弗" },
      { speaker: "A", german: "Danke. Ist das Frühstück inbegriffen?", chinese: "谢谢。早餐包含在内吗？", pronunciation: "丹克. 伊斯特 达斯 弗吕什特吕克 因贝格里芬" },
      { speaker: "B", german: "Ja, das Frühstück ist von 6:30 bis 10:00 Uhr.", chinese: "是的，早餐从6:30到10:00。", pronunciation: "呀, 达斯 弗吕什特吕克 伊斯特 冯 塞希斯:里斯希 比斯 茨恩 乌尔" },
      { speaker: "A", german: "Vielen Dank! Wo ist der Aufzug?", chinese: "非常感谢！电梯在哪里？", pronunciation: "菲林 丹克! 沃 伊斯特 德尔 奥夫楚克" },
      { speaker: "B", german: "Der Aufzug ist gleich hier rechts.", chinese: "电梯就在这边右边。", pronunciation: "德尔 奥夫楚克 伊斯特 格兰 黑尔 雷希茨" },
    ]
  },
  // 7. 看医生
  {
    id: "doctor",
    title: "看医生",
    titleChinese: "医者に行く",
    scenario: "Beim Arzt",
    scenarioChinese: "在医院或诊所看病",
    lines: [
      { speaker: "A", german: "Guten Tag! Was kann ich für Sie tun?", chinese: "您好！有什么可以帮您的吗？", pronunciation: "古腾 塔克! 瓦斯 坎 伊希 菲尔 贼 敦" },
      { speaker: "B", german: "Guten Tag, Herr Doktor. Ich fühle mich seit Tagen nicht wohl.", chinese: "您好，医生。我这几天感觉不太舒服。", pronunciation: "古腾 塔克, 海尔 多克托. 伊希 菲勒 米希 扎希特 达根 尼希特 沃尔" },
      { speaker: "A", german: "Oh, das tut mir leid. Was sind Ihre Symptome?", chinese: "哦，真遗憾。您有什么症状？", pronunciation: "欧, 达斯 图特 米尔 赖特. 瓦斯 辛德 伊雷 兹姆普托梅" },
      { speaker: "B", german: "Ich habe Husten, Schnupfen und Kopfschmerzen.", chinese: "我咳嗽、流鼻涕和头疼。", pronunciation: "伊希 哈伯 胡斯特, 施努普芬 翁特 科普夫施梅尔岑" },
      { speaker: "A", german: "Haben Sie auch Fieber?", chinese: "您发烧吗？", pronunciation: "哈本 贼 奥赫 菲伯" },
      { speaker: "B", german: "Ja, ich habe leichtes Fieber. 37,8 Grad.", chinese: "有的，低烧。37.8度。", pronunciation: "呀, 伊希 哈伯 莱希特斯 菲伯. 德里西-席恩-阿赫特-格拉特" },
      { speaker: "A", german: "Ich verstehe. Machen Sie bitte den Mund auf. Aaah...", chinese: "我明白了。请张嘴。啊..." , pronunciation: "伊希 菲尔施特 艾. 马亨 贼 登 蒙德 奥弗. 啊..." },
      { speaker: "B", german: "Aaah...", chinese: "啊...", pronunciation: "啊" },
      { speaker: "A", german: "Sie haben eine Erkältung. Ich verschreibe Ihnen Medikamente.", chinese: "您感冒了。我给您开点药。", pronunciation: "贼 哈本 艾纳 埃尔凯尔通. 伊希 菲尔施赖伯 伊hnen 梅迪卡门特" },
      { speaker: "B", german: "Vielen Dank, Herr Doktor. Wie lange soll ich die Medikamente nehmen?", chinese: "谢谢，医生。我要吃多久的药？", pronunciation: "菲林 丹克, 海尔 多克托. 维 朗格 佐尔 伊希 迪 梅迪卡门特 内门" },
      { speaker: "A", german: "Nehmen Sie die Tabletten dreimal täglich nach dem Essen für sieben Tage.", chinese: "每天三次，饭后服用，吃七天。", pronunciation: "内门 贼 迪 塔布莱顿 德赖马尔 特利希 纳赫 达斯 埃森 菲尔 兹伊本 达格" },
    ]
  },
  // 8. 银行开户
  {
    id: "bank",
    title: "银行开户",
    titleChinese: "銀行で口座を開く",
    scenario: "Bei der Bank",
    scenarioChinese: "在银行开账户",
    lines: [
      { speaker: "A", german: "Guten Tag! Kann ich Ihnen helfen?", chinese: "您好！有什么可以帮您的吗？", pronunciation: "古腾 塔克! 坎 伊希 伊hnen 赫尔弗" },
      { speaker: "B", german: "Ja, ich möchte ein Konto eröffnen.", chinese: "是的，我想开一个账户。", pronunciation: "呀, 伊希 梅希特 艾因 孔托 埃尔厄夫宁" },
      { speaker: "A", german: "Gerne! Haben Sie Ihren Ausweis dabei?", chinese: "好的！您带身份证了吗？", pronunciation: "格尔呢! 哈本 贼 伊hnen 奥思瓦伊斯 达比" },
      { speaker: "B", german: "Ja, hier ist mein Personalausweis.", chinese: "有的，这是我的身份证。", pronunciation: "呀, 黑尔 伊斯特 迈因 佩尔措纳劳斯瓦伊斯" },
      { speaker: "A", german: "Danke. Möchten Sie ein Girokonto oder ein Sparkonto?", chinese: "谢谢。您想要活期账户还是储蓄账户？", pronunciation: "丹克. 梅希ten 贼 艾因 吉罗孔托 奥德 艾因 施帕尔孔托" },
      { speaker: "B", german: "Ich möchte ein Girokonto.", chinese: "我想开活期账户。", pronunciation: "伊希 梅希特 艾因 吉罗孔托" },
      { speaker: "A", german: "In Ordnung. Hier sind die Unterlagen. Bitte füllen Sie das Formular aus.", chinese: "好的。这是表格。请填写。", pronunciation: "因 奥德农. 黑尔 辛德 迪 翁特拉克恩. 比特 菲伦 贼 达斯 弗奥尔穆拉尔 奥斯" },
      { speaker: "B", german: "Alles klar! Wie lange dauert die Kontoeröffnung?", chinese: "好的！开户需要多长时间？", pronunciation: "阿尔拉斯 克拉尔! 维 朗格 多特 迪 孔托埃尔弗农" },
      { speaker: "A", german: "Das geht sehr schnell. In etwa 30 Minuten ist alles erledigt.", chinese: "很快。大概30分钟就能办好。", pronunciation: "达斯 格特 贼尔 施内尔. 因 艾巴 德里西希 明滕 伊斯特 阿尔拉斯 埃尔莱迪希特" },
      { speaker: "B", german: "Wunderbar! Vielen Dank für Ihre Hilfe.", chinese: "太好了！谢谢您的帮助。", pronunciation: "温德巴尔! 菲林 丹克 菲尔 伊雷 希尔弗" },
    ]
  },
  // 9. 工作面试
  {
    id: "job-interview",
    title: "工作面试",
    titleChinese: "面接",
    scenario: "Bei einem Vorstellungsgespräch",
    scenarioChinese: "求职面试",
    lines: [
      { speaker: "A", german: "Guten Tag! Bitte setzen Sie sich.", chinese: "您好！请坐。", pronunciation: "古腾 塔克! 比特 泽岑 贼 贼希" },
      { speaker: "B", german: "Danke schön! Guten Tag, Frau Müller.", chinese: "非常感谢！您好，米勒女士。", pronunciation: "丹克 舍恩! 古腾 塔克, 弗劳 米勒" },
      { speaker: "A", german: "Guten Tag, Herr Zhang. Erzählen Sie mir bitte etwas über sich.", chinese: "您好，张先生。请介绍一下您自己。", pronunciation: "古腾 塔克, 海尔 张. 埃尔策伦 贼 米尔 比特 埃特瓦斯 于伯尔 贼希" },
      { speaker: "B", german: "Natürlich! Ich bin Zhang Wei, 28 Jahre alt, und ich komme aus China.", chinese: "当然！我叫张伟，28岁，来自中国。", pronunciation: "那图尔利希! 伊希 宾 张 魏, 茨范齐希 阿希特 阿尔特, 翁特 伊希 科么 奥斯 中国" },
      { speaker: "A", german: "Und was haben Sie vorher gemacht?", chinese: "您之前是做什么的？", pronunciation: "翁特 瓦斯 哈本 贼 福黑尔 gemacht" },
      { speaker: "B", german: "Ich habe fünf Jahre als Softwareentwickler gearbeitet.", chinese: "我做了五年软件开发工程师。", pronunciation: "伊希 哈伯 芬夫 雅尔 阿尔斯 佐夫特瓦尔恩特维克勒 格尔拜特" },
      { speaker: "A", german: "Sehr gut! Warum möchten Sie bei unserem Unternehmen arbeiten?", chinese: "很好！您为什么想在我们公司工作？", pronunciation: "贼尔 古特! 瓦鲁姆 梅希ten 贼 贝 昂泽伦 翁特ernen 阿尔贝腾" },
      { speaker: "B", german: "Weil Ihr Unternehmen sehr bekannt ist und gute Entwicklungsmöglichkeiten bietet.", chinese: "因为贵公司很有名，而且提供很好的发展机会。", pronunciation: "魏尔 埃尔 昂特ernen 贼尔 贝克安特 伊斯特 翁特 古特 恩特维克隆斯梅格力希凯特恩 比特" },
      { speaker: "A", german: "Wann können Sie anfangen?", chinese: "您什么时候可以开始？", pronunciation: "万 克因 贼 安方根" },
      { speaker: "B", german: "Ich kann ab nächste Woche anfangen.", chinese: "我可以下周开始。", pronunciation: "伊希 坎 阿普 内赫斯特 沃克 安方根" },
      { speaker: "A", german: "Perfekt! Wir melden uns bei Ihnen.", chinese: "完美！我们会联系您的。", pronunciation: "佩尔费克特! 维尔 梅尔登 翁斯 贝 伊hnen" },
    ]
  },
  // 10. 朋友聊天
  {
    id: "friends-chatting",
    title: "朋友聊天",
    titleChinese: "友人との会話",
    scenario: "Mit einem Freund sprechen",
    scenarioChinese: "和朋友聊天",
    lines: [
      { speaker: "A", german: "Hallo Lisa! Wie geht's?", chinese: "嗨，丽莎！你好吗？", pronunciation: "哈洛 丽莎! 维 格茨" },
      { speaker: "B", german: "Hallo Peter! Mir geht's gut, danke! Und dir?", chinese: "嗨，彼得！我很好，谢谢！你呢？", pronunciation: "哈洛 彼得! 米尔 格茨 古特, 丹克! 翁特 迪尔" },
      { speaker: "A", german: "Mir geht's auch gut. Was machst du heute Abend?", chinese: "我也很好。你今晚做什么？", pronunciation: "米尔 格茨 奥希 古特. 瓦斯 马希斯特 杜 霍伊特 阿本特" },
      { speaker: "B", german: "Ich weiß noch nicht. Warum?", chinese: "我还没想好。为什么问这个？", pronunciation: "伊希 维斯 诺希 尼希特. 瓦鲁姆" },
      { speaker: "A", german: "Ich dachte, wir könnten zusammen ins Kino gehen.", chinese: "我想我们可以一起去看电影。", pronunciation: "伊希 达希特, 维尔 克因ten 楚扎门 因斯 基诺 格恩" },
      { speaker: "B", german: "Das ist eine gute Idee! Welcher Film läuft gerade?", chinese: "好主意！正在上映什么电影？", pronunciation: "达斯 伊斯特 艾纳 古特 伊德! 维尔希尔 菲尔姆 勒弗特 格拉德" },
      { speaker: "A", german: "Ein neuer Actionfilm. Der heißt 'Rettung um Mitternacht'.", chinese: "一部新的动作片。叫《午夜营救》。", pronunciation: "艾因 诺伊尔 埃克松菲尔姆. 德尔 嗨ßt 雷通 翁 米特恩纳希特" },
      { speaker: "B", german: "Oh, klingt spannend! Um wie viel Uhr?", chinese: "哦，听起来很刺激！几点？", pronunciation: "欧, 克林特 施潘登特! 翁姆 维 菲尔 乌尔" },
      { speaker: "A", german: "Um 19:30 Uhr. Treffen wir uns um 19:00 Uhr vor dem Kino.", chinese: "19:30。我们19:00在电影院门口见。", pronunciation: "翁姆 泽本齐希:里斯希 乌尔. 特雷芬 维尔 翁斯 翁姆 泽本齐希 乌尔 福尔 达斯 基诺" },
      { speaker: "B", german: "Einverstanden! Bis später!", chinese: "一言为定！待会儿见！", pronunciation: "艾因菲尔施坦登! 比斯 施派特" },
    ]
  },
  // 11. 初次见面打招呼
  {
    id: "meeting-greeting",
    title: "打招呼",
    titleChinese: "挨拶",
    scenario: "Sich begrüßen",
    scenarioChinese: "初次见面打招呼",
    lines: [
      { speaker: "A", german: "Hallo, schön dich kennenzulernen.", chinese: "嗨，很高兴见到你。", pronunciation: "哈洛, 舍恩 迪希 肯嫩茨柳尔嫩" },
      { speaker: "B", german: "Schön dich auch kennenzulernen.", chinese: "我也很高兴见到你。", pronunciation: "舍恩 迪希 奥希 肯嫩茨柳尔嫩" },
      { speaker: "A", german: "Hallo! Willkommen in unserem Büro.", chinese: "你好！欢迎来到我们办公室。", pronunciation: "哈洛! 维尔kommen 因 昂泽雷姆 布吕罗" },
      { speaker: "B", german: "Danke, dass ich kommen durfte.", chinese: "谢谢你邀请我来。", pronunciation: "丹克, 达斯 伊希 科门 杜夫特" },
    ]
  },
  // 12. 自我介绍
  {
    id: "meeting-introduce",
    title: "自我介绍",
    titleChinese: "自己紹介",
    scenario: "Sich vorstellen",
    scenarioChinese: "介绍自己的名字",
    lines: [
      { speaker: "A", german: "Hallo, ich bin John.", chinese: "嗨，我是约翰。", pronunciation: "哈洛, 伊希 宾 约翰" },
      { speaker: "B", german: "Hallo John, ich bin Mike.", chinese: "嗨约翰，我是迈克。", pronunciation: "哈洛 约翰, 伊希 宾 迈克" },
      { speaker: "A", german: "Schön dich kennenzulernen, Mike.", chinese: "很高兴见到你，迈克。", pronunciation: "舍恩 迪希 肯嫩茨柳尔嫩, 迈克" },
      { speaker: "B", german: "Gleichfalls, schön dich kennenzulernen.", chinese: "我也很高兴见到你。", pronunciation: "格莱希falls, 舍恩 迪希 肯嫩茨柳尔嫩" },
    ]
  },
  // 13. 询问对方名字
  {
    id: "meeting-askname",
    title: "询问名字",
    titleChinese: "名前を尋ねる",
    scenario: "Nach dem Namen fragen",
    scenarioChinese: "询问对方名字",
    lines: [
      { speaker: "A", german: "Wie heißt du?", chinese: "你叫什么名字？", pronunciation: "维 哈伊斯特 杜" },
      { speaker: "B", german: "Ich heiße Lisa. Und du?", chinese: "我叫丽莎。你呢？", pronunciation: "伊希 哈伊塞 丽莎. 翁特 杜" },
      { speaker: "A", german: "Ich bin Sarah. Schön dich kennenzulernen!", chinese: "我叫萨拉。很高兴见到你！", pronunciation: "伊希 宾 萨拉. 舍恩 迪希 肯嫩茨柳尔嫩" },
      { speaker: "B", german: "Schön dich auch kennenzulernen, Sarah.", chinese: "我也很高兴见到你，萨拉。", pronunciation: "舍恩 迪希 奥希 肯嫩茨柳尔嫩, 萨拉" },
    ]
  },
  // 14. 来自哪里
  {
    id: "meeting-origin",
    title: "来自哪里",
    titleChinese: "出身地を尋ねる",
    scenario: "Nach der Herkunft fragen",
    scenarioChinese: "询问对方来自哪里",
    lines: [
      { speaker: "A", german: "Woher kommst du?", chinese: "你来自哪里？", pronunciation: "沃黑尔 科姆斯特 杜" },
      { speaker: "B", german: "Ich komme aus Japan. Und du?", chinese: "我来自日本。你呢？", pronunciation: "伊希 科么 奥斯 日本. 翁特 杜" },
      { speaker: "A", german: "Ich komme aus den USA.", chinese: "我来自美国。", pronunciation: "伊希 科么 奥斯 登 乌萨" },
      { speaker: "B", german: "Schön! Das ist ein wunderschönes Land.", chinese: "真好！那个国家很美。", pronunciation: "舍恩! 达斯 伊斯特 艾因 翁德舍内斯 兰特" },
    ]
  },
  // 15. 工作/学习情况
  {
    id: "meeting-work",
    title: "工作学习",
    titleChinese: "仕事・学び",
    scenario: "Über Arbeit und Studium sprechen",
    scenarioChinese: "询问工作和学习情况",
    lines: [
      { speaker: "A", german: "Was machst du?", chinese: "你是做什么工作的？", pronunciation: "瓦斯 马希斯特 杜" },
      { speaker: "B", german: "Ich bin IT-Ingenieur. Und du?", chinese: "我是IT工程师。你呢？", pronunciation: "伊希 宾 IT-因格尼奥尔. 翁特 杜" },
      { speaker: "A", german: "Ich bin Studentin.", chinese: "我是大学生。", pronunciation: "伊希 宾 施图丁亭" },
      { speaker: "B", german: "Was studierst du?", chinese: "你学什么专业？", pronunciation: "瓦斯 施图迪希特 杜" },
      { speaker: "A", german: "Ich studiere BWL.", chinese: "我在学工商管理。", pronunciation: "伊希 施图迪雷 贝韦埃尔" },
    ]
  },
  // 16. 为什么来这里
  {
    id: "meeting-whyhere",
    title: "为什么来",
    titleChinese: "なぜ来たのか",
    scenario: "Nach dem Grund fragen",
    scenarioChinese: "询问对方为什么来这里",
    lines: [
      { speaker: "A", german: "Was bringt dich hierher?", chinese: "你为什么来这里？", pronunciation: "瓦斯 布林特 迪希 黑尔黑尔" },
      { speaker: "B", german: "Ich bin hier wegen der Arbeit. Und du?", chinese: "我来这里工作。你呢？", pronunciation: "伊希 宾 黑尔 韦根 德尔 阿尔拜特. 翁特 杜" },
      { speaker: "A", german: "Ich bin hier für eine Konferenz.", chinese: "我来参加一个会议。", pronunciation: "伊希 宾 黑尔 菲尔 艾内 孔费伦茨" },
      { speaker: "B", german: "Schön! Was für eine Konferenz?", chinese: "真好！什么类型的会议？", pronunciation: "舍恩! 瓦斯 菲尔 艾内 孔费伦茨" },
      { speaker: "A", german: "Es geht um künstliche Intelligenz.", chinese: "是关于人工智能的会议。", pronunciation: "埃斯 格特 翁 克ünst利希 因特利根茨" },
    ]
  },
  // 17. 兴趣爱好
  {
    id: "meeting-hobby",
    title: "兴趣爱好",
    titleChinese: "趣味・関心事",
    scenario: "Über Hobbys sprechen",
    scenarioChinese: "谈论兴趣爱好",
    lines: [
      { speaker: "A", german: "Was machst du gern in deiner Freizeit?", chinese: "你空闲时间喜欢做什么？", pronunciation: "瓦斯 马希斯特 杜 格兰 因 戴纳 弗赖察伊特" },
      { speaker: "B", german: "Ich schaue gern Filme und reise gern.", chinese: "我喜欢看电影和旅行。", pronunciation: "伊希 绍伊 格兰 菲尔姆 翁特 莱泽 格兰" },
      { speaker: "A", german: "Das klingt toll! Wo bist du schon gereist?", chinese: "听起来很棒！你去过哪里旅行？", pronunciation: "达斯 克林特 托尔! 沃 比斯特 杜 雄 格尔莱斯特" },
      { speaker: "B", german: "Ich war schon in vielen Ländern Europas.", chinese: "我去过欧洲很多国家。", pronunciation: "伊希 瓦尔 雄 因 菲伦 伦德恩 奥伊罗帕斯" },
      { speaker: "A", german: "Das ist toll! Ich reise auch gern.", chinese: "太棒了！我也喜欢旅行。", pronunciation: "达斯 伊斯特 托尔! 伊希 莱泽 奥希 格兰" },
    ]
  },
  // 18. 寒暄评价
  {
    id: "meeting-smalltalk",
    title: "寒暄评价",
    titleChinese: "世間話・評価",
    scenario: "Small Talk machen",
    scenarioChinese: "寒暄和评价",
    lines: [
      { speaker: "A", german: "Wie gefällt dir Japan?", chinese: "你觉得日本怎么样？", pronunciation: "维 格弗尔特 迪尔 日本" },
      { speaker: "B", german: "Ich liebe es hier. Das Essen ist fantastisch.", chinese: "我很喜欢这里。食物太棒了。", pronunciation: "伊希 利贝 埃斯 黑尔. 达斯 埃森 伊斯特 范塔斯蒂希" },
      { speaker: "A", german: "Ja, japanisches Essen ist wirklich lecker.", chinese: "是的，日本料理很好吃。", pronunciation: "呀, 日本尼谢斯 埃森 伊斯特 维尔利希 莱克" },
      { speaker: "B", german: "Die Menschen hier sind auch sehr freundlich.", chinese: "这里的人也非常友好。", pronunciation: "迪 门辛 黑尔 辛特 奥希 贼尔 弗罗伊特利希" },
      { speaker: "A", german: "Willkommen in Japan! Ich hoffe, dir gefällt es hier.", chinese: "欢迎来到日本！希望你喜欢在这里的时光。", pronunciation: "维尔kommen 因 日本! 伊希 霍费, 迪尔 格弗尔特 埃斯 黑尔" },
    ]
  },
  // 19. 结束对话
  {
    id: "meeting-closing",
    title: "结束对话",
    titleChinese: "会話の終了",
    scenario: "Gespräch beenden",
    scenarioChinese: "礼貌结束对话",
    lines: [
      { speaker: "A", german: "Es war schön, mit dir zu sprechen.", chinese: "很高兴和你聊天。", pronunciation: "埃斯 瓦尔 舍恩, 米特 迪尔 茨u 施普雷亨" },
      { speaker: "B", german: "Gleichfalls, schön mit dir zu sprechen.", chinese: "我也很高兴和你聊天。", pronunciation: "格莱希falls, 舍恩 米特 迪尔 茨u 施普雷亨" },
      { speaker: "A", german: "Lass uns in Kontakt bleiben.", chinese: "保持联系。", pronunciation: "拉斯 翁斯 因 孔塔kt 布莱本" },
      { speaker: "B", german: "Gerne! Hier ist meine Visitenkarte.", chinese: "好的！这是我的名片。", pronunciation: "格埃尔内! 黑尔 伊斯特 迈纳 维齐腾卡尔特" },
      { speaker: "A", german: "Danke. Ich melde mich bald bei dir.", chinese: "谢谢。我会尽快联系你的。", pronunciation: "丹克. 伊希 梅尔de 米希 巴尔特 贝 迪尔" },
      { speaker: "B", german: "Ich freue mich darauf. Hab einen schönen Tag!", chinese: "期待你的联系！祝你今天愉快！", pronunciation: "伊希 弗罗伊 米希 达劳弗. 哈普 艾嫩 舍嫩 塔克" },
    ]
  },
];

// 对话分类
const dialogCategories = [
  { id: "all", name: "全部对话" },
  { id: "daily", name: "日常社交" },
  { id: "meeting", name: "初次见面" },
  { id: "travel", name: "旅行交通" },
  { id: "dining", name: "餐饮" },
  { id: "shopping", name: "购物" },
  { id: "health", name: "医疗健康" },
  { id: "work", name: "工作商务" },
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
  { id: "phrase", name: "常用短句" },
  { id: "selfIntro", name: "自我介绍" },
  { id: "dialog", name: "主题对话" },
];

// 短句子分类
const phraseCategories = [
  { id: "greeting", name: "问候" },
  { id: "farewell", name: "告别" },
  { id: "gratitude", name: "感谢" },
  { id: "apology", name: "道歉" },
  { id: "polite", name: "礼貌用语" },
  { id: "restaurant", name: "餐厅点餐" },
  { id: "shopping", name: "购物" },
  { id: "directions", name: "问路" },
  { id: "emergency", name: "紧急情况" },
  { id: "emotions", name: "情感表达" },
  { id: "numbers", name: "数字相关" },
  { id: "time", name: "时间相关" },
  { id: "weather", name: "天气" },
  { id: "phone", name: "电话" },
  { id: "work", name: "工作学习" },
  { id: "hobbies", name: "兴趣爱好" },
  { id: "hotel", name: "酒店住宿" },
  { id: "health", name: "身体状况" },
];

// 自我介绍常用短句
const selfIntroPhrases = [
  // 问候与介绍
  { german: "Guten Tag! Ich heiße Lisa Müller.", chinese: "您好！我叫丽莎·米勒。", pronunciation: "古腾 塔克! 伊希 嗨ß 丽莎 米勒", category: "greeting" },
  { german: "Freut mich. Ich bin Peter Schmidt.", chinese: "很高兴认识你。我叫彼得·施密特。", pronunciation: "弗罗伊特 米希. 伊希 宾 彼得 施密特", category: "greeting" },
  { german: "Freut mich auch! Schön, Sie kennenzulernen.", chinese: "我也很高兴！很高兴认识您。", pronunciation: "弗罗伊特 米希 奥希! 舍恩, 贼 肯嫩茨柳尔嫩", category: "greeting" },

  // 来自哪里
  { german: "Ich komme aus Berlin.", chinese: "我来自柏林。", pronunciation: "伊希 科么 奥斯 柏林", category: "origin" },
  { german: "Ich komme aus München.", chinese: "我来自慕尼黑。", pronunciation: "伊希 科么 奥斯 明兴", category: "origin" },
  { german: "Woher kommen Sie?", chinese: "您来自哪里？", pronunciation: "沃黑尔 科门 贼", category: "origin" },
  { german: "Ich komme aus China.", chinese: "我来自中国。", pronunciation: "伊希 科么 奥斯 希纳", category: "origin" },

  // 年龄
  { german: "Ich bin 25 Jahre alt.", chinese: "我25岁。", pronunciation: "伊希 宾 茨万茨弗 雅雷 阿尔特", category: "age" },
  { german: "Ich bin erst 18 Jahre alt.", chinese: "我才18岁。", pronunciation: "伊希 宾 埃斯特 茨万茨弗 雅雷 阿尔特", category: "age" },
  { german: "Wie alt sind Sie?", chinese: "您多大了？", pronunciation: "维 阿尔特 辛德 贼", category: "age" },

  // 职业
  { german: "Ich bin Lehrerin.", chinese: "我是老师。", pronunciation: "伊希 宾 莱雷林", category: "job" },
  { german: "Ich bin Studentin.", chinese: "我是大学生。", pronunciation: "伊希 宾 施图丁亭", category: "job" },
  { german: "Ich bin Arzt.", chinese: "我是医生。", pronunciation: "伊希 宾 阿尔茨特", category: "job" },
  { german: "Ich bin Ingenieur.", chinese: "我是工程师。", pronunciation: "伊希 宾 因格尼奥尔", category: "job" },
  { german: "Was machen Sie beruflich?", chinese: "您是做什么工作的？", pronunciation: "瓦斯 马亨 贼 贝吕弗利希", category: "job" },

  // 学习
  { german: "Ich studiere Deutsch an der Universität.", chinese: "我在大学学习德语。", pronunciation: "伊希 施图迪雷 德意志 安 德尔 乌尼维尔齐特", category: "study" },
  { german: "Ich studiere Informatik.", chinese: "我学习计算机科学。", pronunciation: "伊希 施图迪雷 因弗尔马蒂克", category: "study" },
  { german: "Ich lerne Deutsch erst seit einem Jahr.", chinese: "我才学了一年德语。", pronunciation: "伊希 勒尔恩 德意志 埃斯特 希特 艾因 姆 雅尔", category: "study" },

  // 德语水平
  { german: "Sprechen Sie gut Deutsch?", chinese: "您德语说得很好吗？", pronunciation: "施普雷chen 贼 古特 德意志", category: "germanLevel" },
  { german: "Mein Deutsch ist noch nicht so gut.", chinese: "我的德语还不是很好。", pronunciation: "迈因 德意志 伊斯特 诺希 尼希特 佐 古特", category: "germanLevel" },
  { german: "Ich spreche ein bisschen Deutsch.", chinese: "我说一点德语。", pronunciation: "伊希 施普雷赫 艾因 比申 德意志", category: "germanLevel" },

  // 兴趣爱好
  { german: "Mein Hobby ist Musik hören.", chinese: "我的爱好是听音乐。", pronunciation: "迈因 霍比 伊斯特 穆济克 赫伦", category: "hobby" },
  { german: "Ich mag Filme sehen.", chinese: "我喜欢看电影。", pronunciation: "伊希 马克 菲尔梅 泽恩", category: "hobby" },
  { german: "Ich spiele gern Fußball.", chinese: "我喜欢踢足球。", pronunciation: "伊希 施皮勒 格兰 福特巴尔", category: "hobby" },
  { german: "Was sind Ihre Hobbys?", chinese: "您的爱好是什么？", pronunciation: "瓦斯 辛德 伊雷 霍比斯", category: "hobby" },

  // 住宿
  { german: "Ich wohne in Berlin.", chinese: "我住在柏林。", pronunciation: "伊希 沃内 因 柏林", category: "living" },
  { german: "Ich wohne bei meiner Familie.", chinese: "我和家人住在一起。", pronunciation: "伊希 沃内 拜 迈纳 法米利", category: "living" },

  // 家庭
  { german: "Ich habe eine Schwester.", chinese: "我有一个姐姐。", pronunciation: "伊希 哈伯 艾纳 施韦斯特尔", category: "family" },
  { german: "Meine Familie ist sehr klein.", chinese: "我的家人很少。", pronunciation: "迈纳 法米利 伊斯特 贼尔 克莱因", category: "family" },

  // 结束语
  { german: "Das ist schon sehr gut! Weiter so!", chinese: "已经很好！继续加油！", pronunciation: "达斯 伊斯特 雄 贼尔 古特! 维特 尔 佐", category: "closing" },
  { german: "Schön, Sie kennenzulernen.", chinese: "很高兴认识您。", pronunciation: "舍恩, 贼 肯嫩茨柳尔嫩", category: "closing" },
];

// 自我介绍短句子分类
const selfIntroCategories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候介绍" },
  { id: "origin", name: "来自哪里" },
  { id: "age", name: "年龄" },
  { id: "job", name: "职业" },
  { id: "study", name: "学习" },
  { id: "germanLevel", name: "德语水平" },
  { id: "hobby", name: "兴趣爱好" },
  { id: "living", name: "居住" },
  { id: "family", name: "家庭" },
  { id: "closing", name: "结束语" },
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

// 数字子分类
const numberCategories = [
  { id: "0-10", name: "0-10" },
  { id: "11-20", name: "11-20" },
  { id: "21-30", name: "21-30" },
  { id: "31-100", name: "31-100" },
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
  const [selectedNumberSubcategory, setSelectedNumberSubcategory] = useState<string | null>(null); // 数字子分类
  const [selectedPhraseSubcategory, setSelectedPhraseSubcategory] = useState<string | null>(null); // 短句子分类
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [quizDifficulty, setQuizDifficulty] = useState<2 | 3 | 4>(2);
  const [quizCount, setQuizCount] = useState(5); // 答题数量
  const [quizType, setQuizType] = useState<"chinese" | "german" | "gender" | "spelling" | "input" | "verb" | "sentence" | "listening" | "listeningArticle" | "weekdayLogic" | "monthLogic" | "phoneNumber" | "dialogListen" | "dialogKeyword" | "dialogPractice" | "selfIntro">("chinese"); // 题目类型
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

  // 是否显示电话号码的德语读法
  const [showPhoneNumberText, setShowPhoneNumberText] = useState(false);

  // 对话听力练习数据
  const [dialogListenData, setDialogListenData] = useState<{
    dialogId: string;
    question: string; // 播放的句子
    questionChinese: string;
    options: { german: string; chinese: string; isCorrect: boolean }[];
    dialogTitle: string;
  } | null>(null);

  // 对话接龙练习数据
  const [dialogPracticeData, setDialogPracticeData] = useState<{
    dialogId: string;
    context: string; // 前面的对话
    question: string; // 当前句子（A说的）
    questionSpeaker: string;
    correctAnswer: string;
    options: { german: string; chinese: string; isCorrect: boolean }[];
    dialogTitle: string;
  } | null>(null);

  // 是否显示对话听力题目
  const [showDialogListenQuestion, setShowDialogListenQuestion] = useState(false);

  // 对话学习状态
  const [selectedDialogCategory, setSelectedDialogCategory] = useState("all"); // 对话分类
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0); // 当前对话索引
  const [showDialogChinese, setShowDialogChinese] = useState(true); // 是否显示中文
  const [showDialogPronunciation, setShowDialogPronunciation] = useState(true); // 是否显示发音
  const [currentDialogLineIndex, setCurrentDialogLineIndex] = useState(0); // 当前对话行索引

  // 自我介绍学习状态
  const [selectedSelfIntroCategory, setSelectedSelfIntroCategory] = useState("all"); // 自我介绍分类
  const [currentSelfIntroIndex, setCurrentSelfIntroIndex] = useState(0); // 当前自我介绍短句索引
  const [showSelfIntroChinese, setShowSelfIntroChinese] = useState(true); // 是否显示中文
  const [showSelfIntroPronunciation, setShowSelfIntroPronunciation] = useState(true); // 是否显示发音

  // 根据分类筛选对话
  const getFilteredDialogs = () => {
    if (selectedDialogCategory === "all") {
      return dialogs;
    }
    // 将对话分类映射到对话ID
    const categoryMap: Record<string, string[]> = {
      daily: ["self-intro", "friends-chatting"],
      meeting: ["meeting-greeting", "meeting-introduce", "meeting-askname", "meeting-origin", "meeting-work", "meeting-whyhere", "meeting-hobby", "meeting-smalltalk", "meeting-closing"],
      travel: ["asking-directions", "airport"],
      dining: ["restaurant-order"],
      shopping: ["shopping"],
      health: ["doctor"],
      work: ["job-interview", "bank"],
    };
    const allowedIds = categoryMap[selectedDialogCategory] || [];
    return dialogs.filter(d => allowedIds.includes(d.id));
  };

  // 根据分类筛选自我介绍短句
  const getFilteredSelfIntroPhrases = () => {
    if (selectedSelfIntroCategory === "all") {
      return selfIntroPhrases;
    }
    return selfIntroPhrases.filter(p => p.category === selectedSelfIntroCategory);
  };

  // 获取筛选后的对话列表
  const filteredDialogs = getFilteredDialogs();

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

  // 过滤单词（支持动词和数字子分类）
  const filteredWords = (() => {
    if (selectedCategory === "all") {
      return words;
    }
    let result = words.filter(w => w.category === selectedCategory);
    // 如果是动词分类且选中了子分类
    if (selectedCategory === "verb" && selectedVerbSubcategory) {
      result = result.filter(w => w.verbSubcategory === selectedVerbSubcategory);
    }
    // 如果是数字分类且选中了子分类
    if (selectedCategory === "number" && selectedNumberSubcategory) {
      result = result.filter(w => w.numberSubcategory === selectedNumberSubcategory);
    }
    // 如果是短句分类且选中了子分类
    if (selectedCategory === "phrase" && selectedPhraseSubcategory) {
      result = result.filter(w => w.phraseCategory === selectedPhraseSubcategory);
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

    // 对话听力理解题型
    if (quizType === "dialogListen") {
      // 使用筛选后的对话列表
      const availableDialogs = getFilteredDialogs();
      if (availableDialogs.length === 0) {
        alert("没有可用的对话，请先选择对话分类");
        return;
      }

      // 随机选择一个对话
      const randomDialog = availableDialogs[Math.floor(Math.random() * availableDialogs.length)];

      // 随机选择对话中的一个句子作为听力内容
      const randomLineIndex = Math.floor(Math.random() * randomDialog.lines.length);
      const correctLine = randomDialog.lines[randomLineIndex];

      // 生成错误选项（从其他对话中随机选择句子）
      const otherDialogs = dialogs.filter(d => d.id !== randomDialog.id);
      const wrongOptions: { german: string; chinese: string; isCorrect: boolean }[] = [];

      while (wrongOptions.length < 3 && otherDialogs.length > 0) {
        const randomOtherDialog = otherDialogs[Math.floor(Math.random() * otherDialogs.length)];
        const randomOtherLine = randomOtherDialog.lines[Math.floor(Math.random() * randomOtherDialog.lines.length)];

        // 确保不重复
        if (!wrongOptions.some(opt => opt.german === randomOtherLine.german)) {
          wrongOptions.push({
            german: randomOtherLine.german,
            chinese: randomOtherLine.chinese,
            isCorrect: false
          });
        }
        // 移除已使用的对话，防止无限循环
        otherDialogs.splice(otherDialogs.indexOf(randomOtherDialog), 1);
      }

      // 组合选项并打乱
      const allOptions = [
        { german: correctLine.german, chinese: correctLine.chinese, isCorrect: true },
        ...wrongOptions
      ].sort(() => Math.random() - 0.5);

      setDialogListenData({
        dialogId: randomDialog.id,
        question: correctLine.german,
        questionChinese: correctLine.chinese,
        options: allOptions,
        dialogTitle: randomDialog.title
      });
      setShowDialogListenQuestion(false);
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      // 播放听力句子
      setTimeout(() => {
        setIsPlayingAudio(true);
        speak(correctLine.german);
        setTimeout(() => {
          setIsPlayingAudio(false);
          setShowDialogListenQuestion(true);
        }, 2000);
      }, 500);

      return;
    }

    // 对话接龙练习题型
    if (quizType === "dialogPractice") {
      // 使用筛选后的对话列表
      const availableDialogs = getFilteredDialogs();
      if (availableDialogs.length === 0) {
        alert("没有可用的对话，请先选择对话分类");
        return;
      }

      // 随机选择一个对话
      const randomDialog = availableDialogs[Math.floor(Math.random() * availableDialogs.length)];

      // 随机选择一个B角色说话的句子（用于生成选项），但显示的是A的话，让用户选B的回复
      // 对话通常是 A-B-A-B 交替，所以我们要找 B 说话的那句作为正确答案
      const bLines = randomDialog.lines.filter(l => l.speaker === "B");
      if (bLines.length === 0) {
        // 如果没有B说的话，跳过这个对话，重新选择
        const otherDialogs = availableDialogs.filter(d => d.id !== randomDialog.id);
        if (otherDialogs.length === 0) {
          alert("没有可用的对话");
          return;
        }
        // 递归选择另一个对话
        const newRandomDialog = otherDialogs[Math.floor(Math.random() * otherDialogs.length)];
        const newBLines = newRandomDialog.lines.filter(l => l.speaker === "B");
        if (newBLines.length === 0) {
          alert("没有可用的对话");
          return;
        }
        // 使用新对话
        const correctBLines = newBLines[Math.floor(Math.random() * newBLines.length)];
        const correctLineIndex = newRandomDialog.lines.findIndex(l => l.german === correctBLines.german);

        let context = "";
        if (correctLineIndex > 0) {
          context = newRandomDialog.lines.slice(0, correctLineIndex).map(l =>
            `${l.speaker === "A" ? "A" : "B"}: ${l.german}`
          ).join("\n");
        }

        const questionLine = correctLineIndex > 0 ? newRandomDialog.lines[correctLineIndex - 1] : null;
        const question = questionLine ? questionLine.german : newRandomDialog.lines[0].german;

        // 生成错误选项
        const wrongOptions: { german: string; chinese: string; isCorrect: boolean }[] = [];
        const allOtherDialogs = dialogs.filter(d => d.id !== newRandomDialog.id);
        while (wrongOptions.length < 3 && allOtherDialogs.length > 0) {
          const randomOtherDialog = allOtherDialogs[Math.floor(Math.random() * allOtherDialogs.length)];
          const otherBLines = randomOtherDialog.lines.filter(l => l.speaker === "B");
          if (otherBLines.length > 0) {
            const randomOtherLine = otherBLines[Math.floor(Math.random() * otherBLines.length)];
            if (!wrongOptions.some(opt => opt.german === randomOtherLine.german)) {
              wrongOptions.push({
                german: randomOtherLine.german,
                chinese: randomOtherLine.chinese,
                isCorrect: false
              });
            }
          }
          allOtherDialogs.splice(allOtherDialogs.indexOf(randomOtherDialog), 1);
        }

        const allOptions = [
          { german: correctBLines.german, chinese: correctBLines.chinese, isCorrect: true },
          ...wrongOptions
        ].sort(() => Math.random() - 0.5);

        setDialogPracticeData({
          dialogId: newRandomDialog.id,
          context: context,
          question: question,
          questionSpeaker: questionLine ? questionLine.speaker : "A",
          correctAnswer: correctBLines.german,
          options: allOptions,
          dialogTitle: newRandomDialog.title
        });
        setSelectedOption(null);
        setQuizResult(null);
        setQuizTimeout(false);
        setTimeLeft(quizTimer);
        setTimerActive(quizTimer > 0);
        return;
      }

      const correctBLines = bLines[Math.floor(Math.random() * bLines.length)];
      const correctLineIndex = randomDialog.lines.findIndex(l => l.german === correctBLines.german);

      // 找到前一句对话（可能是A或B说的）
      let context = "";
      if (correctLineIndex > 0) {
        context = randomDialog.lines.slice(0, correctLineIndex).map(l =>
          `${l.speaker === "A" ? "A" : "B"}: ${l.german}`
        ).join("\n");
      }

      // 生成错误选项（从其他对话的B角色句子中随机选择）
      const otherDialogs = dialogs.filter(d => d.id !== randomDialog.id);
      const wrongOptions: { german: string; chinese: string; isCorrect: boolean }[] = [];

      while (wrongOptions.length < 3 && otherDialogs.length > 0) {
        const randomOtherDialog = otherDialogs[Math.floor(Math.random() * otherDialogs.length)];
        const otherBLines = randomOtherDialog.lines.filter(l => l.speaker === "B");
        if (otherBLines.length > 0) {
          const randomOtherLine = otherBLines[Math.floor(Math.random() * otherBLines.length)];
          if (!wrongOptions.some(opt => opt.german === randomOtherLine.german)) {
            wrongOptions.push({
              german: randomOtherLine.german,
              chinese: randomOtherLine.chinese,
              isCorrect: false
            });
          }
        }
        otherDialogs.splice(otherDialogs.indexOf(randomOtherDialog), 1);
      }

      // 找到前一句是谁说的，作为题目显示
      const questionLine = correctLineIndex > 0 ? randomDialog.lines[correctLineIndex - 1] : null;
      const question = questionLine ? questionLine.german : randomDialog.lines[0].german;

      // 组合选项并打乱
      const allOptions = [
        { german: correctBLines.german, chinese: correctBLines.chinese, isCorrect: true },
        ...wrongOptions
      ].sort(() => Math.random() - 0.5);

      setDialogPracticeData({
        dialogId: randomDialog.id,
        context: context,
        question: question,
        questionSpeaker: questionLine ? questionLine.speaker : "A",
        correctAnswer: correctBLines.german,
        options: allOptions,
        dialogTitle: randomDialog.title
      });
      setSelectedOption(null);
      setQuizResult(null);
      setQuizTimeout(false);
      setTimeLeft(quizTimer);
      setTimerActive(quizTimer > 0);

      return;
    }

    // 自我介绍题型
    if (quizType === "selfIntro") {
      const availablePhrases = getFilteredSelfIntroPhrases();
      if (availablePhrases.length === 0) {
        alert("没有可用的自我介绍短句，请先选择分类");
        return;
      }

      // 随机选择一个短句
      const randomPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];

      // 生成错误选项
      const wrongPhrases = availablePhrases.filter(p => p.german !== randomPhrase.german);
      const wrongOptions: { german: string; chinese: string; isCorrect: boolean }[] = [];

      while (wrongOptions.length < 3 && wrongPhrases.length > 0) {
        const randomIndex = Math.floor(Math.random() * wrongPhrases.length);
        const wrongPhrase = wrongPhrases[randomIndex];
        wrongPhrases.splice(randomIndex, 1);

        if (!wrongOptions.some(opt => opt.german === wrongPhrase.german)) {
          wrongOptions.push({
            german: wrongPhrase.german,
            chinese: wrongPhrase.chinese,
            isCorrect: false
          });
        }
      }

      // 组合选项并打乱
      const allOptions: QuizOption[] = [
        { word: { german: randomPhrase.german, chinese: randomPhrase.chinese, pronunciation: randomPhrase.pronunciation || "", category: "selfIntro" }, isCorrect: true },
        ...wrongOptions.map(wp => ({
          word: { german: wp.german, chinese: wp.chinese, pronunciation: "", category: "selfIntro" as const },
          isCorrect: false
        }))
      ].sort(() => Math.random() - 0.5);

      setQuizWord({
        german: randomPhrase.german,
        chinese: randomPhrase.chinese,
        pronunciation: randomPhrase.pronunciation || "",
        category: "selfIntro"
      });
      setQuizOptions(allOptions);
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
    setShowPhoneNumberText(false); // 重置电话号码读法显示状态
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
          <div className="flex justify-end mb-2 gap-2">
            <Link
              href="/02-edu/001-language/listenning"
              className="text-sm px-3 py-1 bg-teal-100 text-teal-600 rounded-full hover:bg-teal-200 transition"
            >
              📞 听力题 →
            </Link>
            <Link
              href="/02-edu/001-language/SentencePractice"
              className="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
            >
              📝 简单句子 →
            </Link>
            <Link
              href="/02-edu/001-language/spelling-test"
              className="text-sm px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition"
            >
              🔢 数字拼写 →
            </Link>
            <Link
              href="/02-edu/001-language/select_question"
              className="text-sm px-3 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition"
            >
              ❓ 选择题 →
            </Link>
          </div>
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
             quizType === "dialogListen" ? "对话听力理解" :
             quizType === "dialogKeyword" ? "对话关键词记忆" :
             quizType === "dialogPractice" ? "对话接龙练习" :
             quizType === "selfIntro" ? "自我介绍短句" :
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
                  <button
                    onClick={() => setQuizType("dialogListen")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "dialogListen"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                    }`}
                  >
                    对话听力
                  </button>
                  <button
                    onClick={() => setQuizType("dialogPractice")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "dialogPractice"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    对话接龙
                  </button>
                  <button
                    onClick={() => setQuizType("selfIntro")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      quizType === "selfIntro"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    自我介绍
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
                    setSelectedNumberSubcategory(null);
                    setSelectedPhraseSubcategory(null);
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

            {/* 数字子分类筛选 */}
            {selectedCategory === "number" && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setSelectedNumberSubcategory(null);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedNumberSubcategory === null
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-teal-50"
                  }`}
                >
                  全部数字
                  <span className="ml-0.5 text-xs opacity-70">
                    ({words.filter(w => w.category === "number").length})
                  </span>
                </button>
                {numberCategories.map((subcat) => {
                  const count = words.filter(w => w.category === "number" && w.numberSubcategory === subcat.id).length;
                  return (
                    <button
                      key={subcat.id}
                      onClick={() => {
                        setSelectedNumberSubcategory(subcat.id);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs transition ${
                        selectedNumberSubcategory === subcat.id
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-teal-50"
                      }`}
                    >
                      {subcat.name}
                      <span className="ml-0.5 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 短句分类筛选 */}
            {selectedCategory === "phrase" && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setSelectedPhraseSubcategory(null);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedPhraseSubcategory === null
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-rose-50"
                  }`}
                >
                  全部短句
                  <span className="ml-0.5 text-xs opacity-70">
                    ({words.filter(w => w.category === "phrase").length})
                  </span>
                </button>
                {phraseCategories.map((subcat) => {
                  const count = words.filter(w => w.category === "phrase" && w.phraseCategory === subcat.id).length;
                  return (
                    <button
                      key={subcat.id}
                      onClick={() => {
                        setSelectedPhraseSubcategory(subcat.id);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs transition ${
                        selectedPhraseSubcategory === subcat.id
                          ? "bg-rose-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-rose-50"
                      }`}
                    >
                      {subcat.name}
                      <span className="ml-0.5 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 自我介绍分类筛选 */}
            {selectedCategory === "selfIntro" && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setSelectedSelfIntroCategory("all");
                    setCurrentSelfIntroIndex(0);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedSelfIntroCategory === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-green-50"
                  }`}
                >
                  全部
                  <span className="ml-0.5 text-xs opacity-70">({selfIntroPhrases.length})</span>
                </button>
                {selfIntroCategories.map((cat) => {
                  const count = selfIntroPhrases.filter(p => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedSelfIntroCategory(cat.id);
                        setCurrentSelfIntroIndex(0);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs transition ${
                        selectedSelfIntroCategory === cat.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50"
                      }`}
                    >
                      {cat.name}
                      <span className="ml-0.5 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 自我介绍学习界面 */}
            {selectedCategory === "selfIntro" && (mode as string) === "learn" && (
              <div className="max-w-2xl mx-auto">
                {/* 当前短句 */}
                {(() => {
                  const phrases = getFilteredSelfIntroPhrases();
                  const currentPhrase = phrases[currentSelfIntroIndex];
                  if (!currentPhrase) return null;

                  return (
                    <>
                      <div className="text-center mb-4">
                        <span className="text-sm text-gray-400">
                          {selfIntroCategories.find(c => c.id === currentPhrase.category)?.name || "自我介绍"}
                        </span>
                      </div>

                      {/* 短句卡片 */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-6 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-4">{currentPhrase.german}</div>
                        {showSelfIntroPronunciation && currentPhrase.pronunciation && (
                          <div className="text-lg text-gray-500 mb-4">{currentPhrase.pronunciation}</div>
                        )}
                        {showSelfIntroChinese && (
                          <div className="text-xl text-green-700">{currentPhrase.chinese}</div>
                        )}
                      </div>

                      {/* 控制按钮 */}
                      <div className="flex justify-center gap-2 mb-6">
                        <button
                          onClick={() => setShowSelfIntroChinese(!showSelfIntroChinese)}
                          className={`px-3 py-1 rounded-lg text-xs transition ${
                            showSelfIntroChinese
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          中文
                        </button>
                        <button
                          onClick={() => setShowSelfIntroPronunciation(!showSelfIntroPronunciation)}
                          className={`px-3 py-1 rounded-lg text-xs transition ${
                            showSelfIntroPronunciation
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          发音
                        </button>
                      </div>

                      {/* 导航按钮 */}
                      <div className="flex justify-between items-center mb-6">
                        <button
                          onClick={() => setCurrentSelfIntroIndex(prev => {
                            const phrases = getFilteredSelfIntroPhrases();
                            return prev > 0 ? prev - 1 : phrases.length - 1;
                          })}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          上一句
                        </button>
                        <span className="text-sm text-gray-500">
                          {currentSelfIntroIndex + 1} / {phrases.length}
                        </span>
                        <button
                          onClick={() => setCurrentSelfIntroIndex(prev => {
                            const phrases = getFilteredSelfIntroPhrases();
                            return prev < phrases.length - 1 ? prev + 1 : 0;
                          })}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          下一句
                        </button>
                      </div>

                      {/* 播放发音按钮 */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => speak(currentPhrase.german)}
                          className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <span>🔊</span> 播放发音
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 对话分类筛选 */}
            {selectedCategory === "dialog" && (
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setSelectedDialogCategory("all");
                    setCurrentDialogIndex(0);
                    setCurrentDialogLineIndex(0);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition ${
                    selectedDialogCategory === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  全部对话
                  <span className="ml-0.5 text-xs opacity-70">({dialogs.length})</span>
                </button>
                {dialogCategories.map((cat) => {
                  // 计算该分类下的对话数量
                  const categoryMap: Record<string, string[]> = {
                    daily: ["self-intro", "friends-chatting"],
                    meeting: ["meeting-greeting", "meeting-introduce", "meeting-askname", "meeting-origin", "meeting-work", "meeting-whyhere", "meeting-hobby", "meeting-smalltalk", "meeting-closing"],
                    travel: ["asking-directions", "airport"],
                    dining: ["restaurant-order"],
                    shopping: ["shopping"],
                    health: ["doctor"],
                    work: ["job-interview", "bank"],
                  };
                  const allowedIds = categoryMap[cat.id] || [];
                  const count = dialogs.filter(d => allowedIds.includes(d.id)).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedDialogCategory(cat.id);
                        setCurrentDialogIndex(0);
                        setCurrentDialogLineIndex(0);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs transition ${
                        selectedDialogCategory === cat.id
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                      }`}
                    >
                      {cat.name}
                      <span className="ml-0.5 text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 对话列表（未选择对话时显示） */}
            {selectedCategory === "dialog" && filteredDialogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>没有找到符合条件的对话</p>
              </div>
            )}

            {/* 对话模式下的开始答题按钮 */}
            {selectedCategory === "dialog" ? (
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setQuizType("dialogListen");
                    startQuiz();
                  }}
                  className="px-6 py-2 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition text-base"
                >
                  开始对话听力 →
                </button>
                <button
                  onClick={() => {
                    setQuizType("dialogPractice");
                    startQuiz();
                  }}
                  className="px-6 py-2 bg-indigo-500 text-white rounded-full font-medium hover:bg-indigo-600 transition text-base"
                >
                  开始对话接龙 →
                </button>
              </div>
            ) : selectedCategory === "selfIntro" ? (
              <button
                onClick={() => {
                  setQuizType("selfIntro");
                  startQuiz();
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition text-base"
              >
                开始答题 →
              </button>
            ) : (
              <button
                onClick={startQuiz}
                className="px-6 py-2 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition text-base"
              >
                开始答题 →
              </button>
            )}
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
                  setSelectedNumberSubcategory(null);
                  setSelectedPhraseSubcategory(null);
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
                    ({cat.id === "dialog" ? dialogs.length : words.filter(w => w.category === cat.id).length})
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

        {/* 学习模式：数字子分类筛选 */}
        {mode === "learn" && selectedCategory === "number" && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setSelectedNumberSubcategory(null);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                selectedNumberSubcategory === null
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
              }`}
            >
              全部数字
              <span className="ml-1 text-xs opacity-70">
                ({words.filter(w => w.category === "number").length})
              </span>
            </button>
            {numberCategories.map((subcat) => {
              const count = words.filter(w => w.category === "number" && w.numberSubcategory === subcat.id).length;
              return (
                <button
                  key={subcat.id}
                  onClick={() => {
                    setSelectedNumberSubcategory(subcat.id);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedNumberSubcategory === subcat.id
                      ? "bg-teal-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                  }`}
                >
                  {subcat.name}
                  <span className="ml-1 text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 学习模式：短句分类筛选 */}
        {mode === "learn" && selectedCategory === "phrase" && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setSelectedPhraseSubcategory(null);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                selectedPhraseSubcategory === null
                  ? "bg-rose-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-rose-50"
              }`}
            >
              全部短句
              <span className="ml-1 text-xs opacity-70">
                ({words.filter(w => w.category === "phrase").length})
              </span>
            </button>
            {phraseCategories.map((subcat) => {
              const count = words.filter(w => w.category === "phrase" && w.phraseCategory === subcat.id).length;
              return (
                <button
                  key={subcat.id}
                  onClick={() => {
                    setSelectedPhraseSubcategory(subcat.id);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedPhraseSubcategory === subcat.id
                      ? "bg-rose-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-rose-50"
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

                {/* 显示/隐藏德语读法按钮 */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowPhoneNumberText(!showPhoneNumberText)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      showPhoneNumberText
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {showPhoneNumberText ? "🙈 隐藏读法" : "👁️ 显示读法"}
                  </button>
                </div>

                {/* 显示德语读法 */}
                {showPhoneNumberText && phoneNumberData && (
                  <div className="bg-teal-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-lg text-gray-800 font-medium">
                      {phoneNumberData.germanText}
                    </p>
                  </div>
                )}

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
            ) : quizType === "dialogListen" ? (
              // 对话听力理解题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                {/* 对话标题 */}
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">
                    来自：{dialogListenData?.dialogTitle}
                  </span>
                </div>

                {/* 播放按钮 */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      if (dialogListenData?.question) {
                        setIsPlayingAudio(true);
                        speak(dialogListenData.question);
                        setTimeout(() => setIsPlayingAudio(false), 2000);
                      }
                    }}
                    disabled={isPlayingAudio || !showDialogListenQuestion}
                    className={`px-8 py-4 rounded-full transition ${
                      isPlayingAudio
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    {isPlayingAudio ? "🔊 播放中..." : "🎧 播放句子"}
                  </button>
                </div>

                {/* 题目区域 */}
                {showDialogListenQuestion && dialogListenData && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4">
                      你刚才听到的句子是什么意思？
                    </p>

                    {/* 选项 */}
                    <div className="space-y-3">
                      {dialogListenData.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const showResult = quizResult !== null;
                        const isCorrect = option.isCorrect;

                        let buttonClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                        if (showResult) {
                          if (isCorrect) {
                            buttonClass += "bg-green-500 text-white";
                          } else if (isSelected && !isCorrect) {
                            buttonClass += "bg-red-500 text-white";
                          } else {
                            buttonClass += "bg-gray-100 text-gray-400 cursor-not-allowed";
                          }
                        } else {
                          buttonClass += isSelected
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-purple-50 border-2 border-purple-200";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (showResult) return;
                              setSelectedOption(idx);
                              const isAnswerCorrect = option.isCorrect;

                              if (isAnswerCorrect) {
                                setQuizResult("correct");
                                playSound("correct");
                                setQuizRecords(prev => [...prev, {
                                  german: dialogListenData!.question,
                                  chinese: dialogListenData!.questionChinese,
                                  selected: option.chinese,
                                  isCorrect: true,
                                  isTimeout: false,
                                  gender: undefined
                                }]);
                              } else {
                                setQuizResult("wrong");
                                playSound("wrong");
                                setQuizRecords(prev => [...prev, {
                                  german: dialogListenData!.question,
                                  chinese: dialogListenData!.questionChinese,
                                  selected: option.chinese,
                                  isCorrect: false,
                                  isTimeout: false,
                                  gender: undefined
                                }]);
                              }
                            }}
                            disabled={showResult}
                            className={buttonClass}
                          >
                            {option.chinese}
                          </button>
                        );
                      })}
                    </div>

                    {/* 显示正确答案（答题后） */}
                    {quizResult !== null && (
                      <div className="mt-4 bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-gray-600 mb-2">正确答案：</p>
                        <p className="text-xl font-bold text-blue-600 mb-2">
                          {dialogListenData?.question}
                        </p>
                        <p className="text-gray-500">
                          {dialogListenData?.questionChinese}
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
                )}
              </div>
            ) : quizType === "dialogPractice" ? (
              // 对话接龙练习题型
              <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
                {/* 对话标题 */}
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">
                    来自：{dialogPracticeData?.dialogTitle}
                  </span>
                </div>

                {/* 对话上下文 */}
                {dialogPracticeData?.context && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
                    <p className="text-xs text-gray-500 mb-2">对话上下文：</p>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {dialogPracticeData.context}
                    </pre>
                  </div>
                )}

                {/* 当前句子（题目） */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-sm text-purple-600 font-medium">
                      {dialogPracticeData?.questionSpeaker === "A" ? "A 说：" : "B 说："}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 leading-relaxed">
                    {dialogPracticeData?.question}
                  </p>
                  <button
                    onClick={() => dialogPracticeData?.question && speak(dialogPracticeData.question)}
                    className="mt-2 p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
                    title="播放发音"
                  >
                    🔊
                  </button>
                </div>

                <p className="text-center text-gray-500 mb-4">
                  B 会怎么回答？
                </p>

                {/* 选项 */}
                <div className="space-y-3">
                  {dialogPracticeData?.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const showResult = quizResult !== null;
                    const isCorrect = option.isCorrect;

                    let buttonClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-500 text-white";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-500 text-white";
                      } else {
                        buttonClass += "bg-gray-100 text-gray-400";
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += "bg-purple-500 text-white";
                      } else {
                        buttonClass += "bg-purple-50 text-purple-700 border-2 border-purple-200 hover:bg-purple-100";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (showResult) return;
                          setSelectedOption(idx);
                          const isAnswerCorrect = option.isCorrect;

                          if (isAnswerCorrect) {
                            setQuizResult("correct");
                            playSound("correct");
                            setQuizRecords(prev => [...prev, {
                              german: option.german,
                              chinese: option.chinese,
                              selected: option.chinese,
                              isCorrect: true,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          } else {
                            setQuizResult("wrong");
                            playSound("wrong");
                            setQuizRecords(prev => [...prev, {
                              german: option.german,
                              chinese: option.chinese,
                              selected: option.chinese,
                              isCorrect: false,
                              isTimeout: false,
                              gender: undefined
                            }]);
                          }
                        }}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        <div className="flex items-center justify-between px-4">
                          <span className="text-left">{option.german}</span>
                          {showResult && isCorrect && <span>✓</span>}
                          {showResult && isSelected && !isCorrect && <span>✗</span>}
                        </div>
                        {showResult && (
                          <p className="text-sm mt-1 opacity-80">{option.chinese}</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 显示正确答案（答题后） */}
                {quizResult !== null && dialogPracticeData && (
                  <div className="mt-4 bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-gray-600 mb-2">正确答案：</p>
                    <p className="text-xl font-bold text-blue-600 mb-2">
                      {dialogPracticeData.correctAnswer}
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
                  {(quizType === "chinese" || quizType === "spelling" || quizType === "input" || quizType === "verb" || quizType === "selfIntro") && (
                    <button
                      onClick={() => speak(quizWord.german)}
                      className="p-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
                      title="播放发音"
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

        {/* 学习模式：对话学习界面 */}
        {mode === "learn" && selectedCategory === "dialog" && filteredDialogs.length > 0 && (
          <div className="max-w-2xl mx-auto">
            {/* 对话标题和场景 */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {filteredDialogs[currentDialogIndex]?.title}
              </h2>
              <p className="text-sm text-gray-500">
                {filteredDialogs[currentDialogIndex]?.scenarioChinese}
              </p>
            </div>

            {/* 对话内容 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
              {filteredDialogs[currentDialogIndex]?.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`mb-3 ${
                    line.speaker === "A" ? "text-left" : "text-right"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-lg p-3 ${
                      line.speaker === "A"
                        ? "bg-blue-500 text-white"
                        : "bg-purple-500 text-white"
                    }`}
                  >
                    <div className="font-medium text-sm">{line.german}</div>
                    {showDialogPronunciation && line.pronunciation && (
                      <div className="text-xs opacity-80 mt-1">
                        {line.pronunciation}
                      </div>
                    )}
                    {showDialogChinese && (
                      <div className="text-xs opacity-90 mt-1 border-t border-white/20 pt-1">
                        {line.chinese}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setShowDialogChinese(!showDialogChinese)}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  showDialogChinese
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setShowDialogPronunciation(!showDialogPronunciation)}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  showDialogPronunciation
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                发音
              </button>
            </div>

            {/* 对话导航 */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setCurrentDialogIndex((prev) => (prev > 0 ? prev - 1 : filteredDialogs.length - 1));
                  setCurrentDialogLineIndex(0);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                上一段
              </button>
              <span className="text-sm text-gray-500">
                {currentDialogIndex + 1} / {filteredDialogs.length}
              </span>
              <button
                onClick={() => {
                  setCurrentDialogIndex((prev) => (prev < filteredDialogs.length - 1 ? prev + 1 : 0));
                  setCurrentDialogLineIndex(0);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                下一段
              </button>
            </div>

            {/* 播放对话语音 */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  const dialog = filteredDialogs[currentDialogIndex];
                  if (dialog) {
                    dialog.lines.forEach((line, idx) => {
                      setTimeout(() => {
                        speak(line.german);
                      }, idx * 2000);
                    });
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <span>🔊</span> 播放对话
              </button>
            </div>
          </div>
        )}

        {/* 学习模式：单词卡片 */}
        {mode === "learn" && selectedCategory !== "dialog" && (
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
          </>
        )}

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
        </div>
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
