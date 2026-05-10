'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 音效函数
function playSound(isCorrect: boolean) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 正确：高频音，错误：低频音
  oscillator.frequency.value = isCorrect ? 800 : 200;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// 朗读函数
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

// 类别数据
const categories = [
  { id: 'adj', name: '人的状态' },
  { id: 'state', name: '物体的状态' },
  { id: 'place', name: '场所/空间/时' },
  { id: 'mind', name: '思考/知识/发现/心/感情' },
  { id: 'action', name: '移动/动作' },
  { id: 'transport', name: '交通' },
  { id: 'building', name: '建筑' },
  { id: 'possessive', name: '物主代词' },
];

// 形容词的特性
const adjectives = [
  { id: 1, german: "alt", chinese: "老的" },
  { id: 2, german: "jung", chinese: "年轻的" },
  { id: 3, german: "arm", chinese: "贫穷的" },
  { id: 4, german: "reich", chinese: "富有的" },
  { id: 5, german: "frei", chinese: "自由的 / 空闲的" },
  { id: 6, german: "traurig", chinese: "悲伤的" },
  { id: 7, german: "glücklich", chinese: "快乐的 / 幸福的" },
  { id: 8, german: "gesund", chinese: "健康的" },
  { id: 9, german: "krank", chinese: "生病的" },
  { id: 10, german: "schwach", chinese: "虚弱的 / 弱的" },
  { id: 11, german: "stark", chinese: "强壮的 / 强的" },
  { id: 12, german: "leise", chinese: "安静的 / 小声的" },
  { id: 13, german: "müde", chinese: "疲倦的" },
  { id: 14, german: "tot", chinese: "死的" },
  { id: 15, german: "satt", chinese: "饱的" },
  { id: 16, german: "freundlich", chinese: "友好的" },
  { id: 17, german: "nett", chinese: "和蔼的 / 亲切的" },
  { id: 18, german: "klug", chinese: "聪明的" },
  { id: 19, german: "dumm", chinese: "愚蠢的" },
  { id: 20, german: "faul", chinese: "懒的" },
  { id: 21, german: "fleißig", chinese: "勤奋的" },
];

// 物体的状态
const states = [
  { id: 101, german: "groß", chinese: "大的 / 高的" },
  { id: 102, german: "klein", chinese: "小的" },
  { id: 103, german: "lang", chinese: "长的" },
  { id: 104, german: "kurz", chinese: "短的" },
  { id: 105, german: "schwer", chinese: "重的 / 困难的" },
  { id: 106, german: "leicht", chinese: "轻的 / 容易的" },
  { id: 107, german: "weit", chinese: "远的 / 宽广的" },
  { id: 108, german: "eng", chinese: "狭窄的" },
  { id: 109, german: "schnell", chinese: "快的" },
  { id: 110, german: "langsam", chinese: "慢的" },
  { id: 111, german: "schön", chinese: "美丽的" },
  { id: 112, german: "neu", chinese: "新的" },
  { id: 113, german: "hoch", chinese: "高的" },
  { id: 114, german: "frisch", chinese: "新鲜的" },
  { id: 115, german: "laut", chinese: "大声的 / 吵的" },
  { id: 116, german: "süß", chinese: "甜的 / 可爱的" },
  { id: 117, german: "ander(e)", chinese: "其他的" },
  { id: 118, german: "gleich", chinese: "一样的 / 马上" },
  { id: 119, german: "kaputt", chinese: "坏的 / 破的" },
  { id: 120, german: "wichtig", chinese: "重要的" },
];

// 场所/空间/时
const places = [
  { id: 201, german: "hier", chinese: "这里" },
  { id: 202, german: "dort", chinese: "那里" },
  { id: 203, german: "weg", chinese: "离开 / 不在了" },
  { id: 204, german: "zurück", chinese: "回来 / 回去" },
  { id: 205, german: "links", chinese: "左边" },
  { id: 206, german: "rechts", chinese: "右边" },
  { id: 207, german: "heute", chinese: "今天" },
  { id: 208, german: "gestern", chinese: "昨天" },
  { id: 209, german: "morgen", chinese: "明天 / 早上" },
  { id: 210, german: "bald", chinese: "很快" },
  { id: 211, german: "dann", chinese: "然后 / 那时" },
  { id: 212, german: "gerade", chinese: "正在 / 刚刚" },
  { id: 213, german: "jetzt", chinese: "现在" },
  { id: 214, german: "einmal", chinese: "一次 / 曾经" },
  { id: 215, german: "noch", chinese: "还 / 仍然" },
  { id: 216, german: "schon", chinese: "已经" },
  { id: 217, german: "später", chinese: "稍后" },
  { id: 218, german: "früh", chinese: "早的" },
  { id: 219, german: "spät", chinese: "晚的" },
  { id: 220, german: "erst", chinese: "才 / 仅仅" },
  { id: 221, german: "nächst(e)", chinese: "下一个" },
  { id: 222, german: "letzt(e)", chinese: "上一个 / 最后一个" },
];

// 思考/知识/发现/心/感情
const minds = [
  { id: 301, german: "denken", chinese: "思考" },
  { id: 302, german: "glauben", chinese: "相信 / 认为" },
  { id: 303, german: "erzählen", chinese: "讲述" },
  { id: 304, german: "kennen", chinese: "认识（人/地方）" },
  { id: 305, german: "wissen", chinese: "知道（事实）" },
  { id: 306, german: "finden", chinese: "觉得 / 找到" },
  { id: 307, german: "vergessen", chinese: "忘记" },
  { id: 308, german: "lieben", chinese: "爱" },
  { id: 309, german: "freuen", chinese: "高兴" },
  { id: 310, german: "danken", chinese: "感谢" },
  { id: 311, german: "gefallen", chinese: "使喜欢" },
  { id: 312, german: "sehen", chinese: "看见" },
  { id: 313, german: "hören", chinese: "听见" },
  { id: 314, german: "lachen", chinese: "笑" },
  { id: 315, german: "weinen", chinese: "哭" },
  { id: 316, german: "fühlen", chinese: "感觉" },
];

// 移动/动作
const actions = [
  { id: 401, german: "gehen", chinese: "走 / 去（步行）" },
  { id: 402, german: "fahren", chinese: "乘车 / 行驶" },
  { id: 403, german: "kommen", chinese: "来" },
  { id: 404, german: "fliegen", chinese: "飞" },
  { id: 405, german: "laufen", chinese: "跑 / 走（较快）" },
  { id: 406, german: "schwimmen", chinese: "游泳" },
  { id: 407, german: "reisen", chinese: "旅行" },
  { id: 408, german: "abfahren", chinese: "出发" },
  { id: 409, german: "ankommen", chinese: "到达" },
  { id: 410, german: "aussteigen", chinese: "下车" },
  { id: 411, german: "einsteigen", chinese: "上车" },
  { id: 412, german: "machen", chinese: "做" },
  { id: 413, german: "tun", chinese: "做" },
  { id: 414, german: "stellen", chinese: "放（竖着）" },
  { id: 415, german: "tragen", chinese: "搬 / 穿 / 拿" },
  { id: 416, german: "legen", chinese: "放（平放）" },
  { id: 417, german: "ziehen", chinese: "拉 / 搬动" },
  { id: 418, german: "hängen", chinese: "挂着 / 挂" },
  { id: 419, german: "halten", chinese: "停下 / 握住" },
  { id: 420, german: "holen", chinese: "去取" },
  { id: 421, german: "bringen", chinese: "带来" },
  { id: 422, german: "öffnen", chinese: "打开" },
  { id: 423, german: "schlagen", chinese: "打 / 敲" },
  { id: 424, german: "schicken", chinese: "发送 / 寄" },
];

// 交通
const transports = [
  { id: 501, german: "der Zug", chinese: "火车" },
  { id: 502, german: "die Straßenbahn", chinese: "有轨电车" },
  { id: 503, german: "das Auto", chinese: "汽车" },
  { id: 504, german: "der Wagen", chinese: "车辆 / 车厢" },
  { id: 505, german: "das Taxi", chinese: "出租车" },
  { id: 506, german: "der Bus", chinese: "公交车" },
  { id: 507, german: "das Fahrrad", chinese: "自行车" },
  { id: 508, german: "das Flugzeug", chinese: "飞机" },
  { id: 509, german: "die Welt", chinese: "世界" },
  { id: 510, german: "das Ausland", chinese: "国外" },
  { id: 511, german: "die Heimat", chinese: "家乡 / 祖国" },
  { id: 512, german: "Europa", chinese: "欧洲" },
  { id: 513, german: "das Problem", chinese: "问题 / 难题" },
  { id: 514, german: "die Sache", chinese: "事情 / 东西" },
  { id: 515, german: "der Plan", chinese: "计划" },
  { id: 516, german: "die Vorsicht", chinese: "小心 / 谨慎" },
];

// 建筑
const buildings = [
  { id: 601, german: "die Stadt", chinese: "城市" },
  { id: 602, german: "das Dorf", chinese: "村庄" },
  { id: 603, german: "die Straße", chinese: "街道" },
  { id: 604, german: "der Weg", chinese: "路 / 小路" },
  { id: 605, german: "der Bahnhof", chinese: "火车站" },
  { id: 606, german: "das Rathaus", chinese: "市政厅" },
  { id: 607, german: "die Kirche", chinese: "教堂" },
  { id: 608, german: "die Polizei", chinese: "警察（机构）" },
  { id: 609, german: "die Bank", chinese: "银行" },
  { id: 610, german: "das Kaufhaus", chinese: "百货商店" },
  { id: 611, german: "das Geschäft", chinese: "商店 / 生意" },
  { id: 612, german: "das Hotel", chinese: "酒店" },
  { id: 613, german: "das Restaurant", chinese: "餐厅" },
  { id: 614, german: "der Platz", chinese: "广场 / 地方" },
  { id: 615, german: "die Mitte", chinese: "中间" },
  { id: 616, german: "das Geld", chinese: "钱" },
  { id: 617, german: "der Euro", chinese: "欧元" },
  { id: 618, german: "das Geschenk", chinese: "礼物" },
];

// 物主代词
const possessives = [
  { id: 701, german: "mein", chinese: "我的" },
  { id: 702, german: "dein", chinese: "你的" },
  { id: 703, german: "sein", chinese: "他的" },
  { id: 704, german: "ihr", chinese: "她的" },
  { id: 705, german: "sein", chinese: "它的" },
  { id: 706, german: "unser", chinese: "我们的" },
  { id: 707, german: "euer", chinese: "你们的" },
  { id: 708, german: "ihr", chinese: "他们的/她们的/它们的" },
  { id: 709, german: "Ihr", chinese: "您的；您们的" },
];

// 根据类别获取数据
function getDataByCategory(categoryId: string) {
  if (categoryId === 'state') {
    return states;
  }
  if (categoryId === 'place') {
    return places;
  }
  if (categoryId === 'mind') {
    return minds;
  }
  if (categoryId === 'action') {
    return actions;
  }
  if (categoryId === 'transport') {
    return transports;
  }
  if (categoryId === 'building') {
    return buildings;
  }
  if (categoryId === 'possessive') {
    return possessives;
  }
  return adjectives;
}

// 获取所有选项
function getAllOptions(data: typeof adjectives | typeof states | typeof places | typeof minds | typeof actions | typeof transports | typeof buildings | typeof possessives, lang: 'german' | 'chinese') {
  return data.map(a => a[lang]);
}

// 生成选项（1个正确答案 + 3个干扰选项）
function generateOptions(correctAnswer: string, options: string[]): string[] {
  const pool = options.filter(o => o !== correctAnswer);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return [correctAnswer, ...shuffled.slice(0, 3)].sort(() => Math.random() - 0.5);
}

export default function SelectQuestion2() {
  const [category, setCategory] = useState('adj');
  const [mode, setMode] = useState<'de2zh' | 'zh2de'>('de2zh');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});

  const data = getDataByCategory(category);

  // 切换类别或模式时重新初始化
  useEffect(() => {
    const map: Record<number, string[]> = {};
    const optionList = getAllOptions(data, mode === 'de2zh' ? 'chinese' : 'german');
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    data.forEach(item => {
      map[item.id] = generateOptions(item[correctKey as keyof typeof item] as string, optionList);
    });
    setOptionsMap(map);
    setAnswers({});
  }, [category, mode]);

  const handleSelect = (id: number, answer: string, isCorrect: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
    playSound(isCorrect);
  };

  const getOptionClass = (itemId: number, option: string) => {
    const item = data.find(a => a.id === itemId);
    if (!item) return '';

    const correctAnswer = mode === 'de2zh' ? item.chinese : item.german;
    let baseClass = 'px-4 py-2 border rounded cursor-pointer transition-colors ';

    if (answers[itemId]) {
      if (option === correctAnswer) {
        return baseClass + 'bg-green-100 border-green-500 text-green-700';
      }
      if (answers[itemId] === option && option !== correctAnswer) {
        return baseClass + 'bg-red-100 border-red-500 text-red-700';
      }
      return baseClass + 'bg-gray-50 border-gray-200 text-gray-400';
    }

    if (answers[itemId] === option) {
      return baseClass + 'bg-blue-100 border-blue-500 text-blue-700';
    }
    return baseClass + 'bg-white border-gray-300 hover:bg-blue-50';
  };

  const correctCount = Object.entries(answers).filter(([id, answer]) => {
    const item = data.find(a => a.id === Number(id));
    if (!item) return false;
    const correctAnswer = mode === 'de2zh' ? item.chinese : item.german;
    return answer === correctAnswer;
  }).length;

  const handleReset = () => {
    setAnswers({});
    const map: Record<number, string[]> = {};
    const optionList = getAllOptions(data, mode === 'de2zh' ? 'chinese' : 'german');
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    data.forEach(item => {
      map[item.id] = generateOptions(item[correctKey as keyof typeof item] as string, optionList);
    });
    setOptionsMap(map);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/02-edu/001-language"
            className="text-blue-600 hover:underline"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            德语选择
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 答题区域 */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* 类别切换 */}
          <div className="flex justify-center gap-4 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-full ${
                  category === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 模式切换 */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setMode('de2zh')}
              className={`px-4 py-2 rounded-full ${
                mode === 'de2zh'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              德→中
            </button>
            <button
              onClick={() => setMode('zh2de')}
              className={`px-4 py-2 rounded-full ${
                mode === 'zh2de'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              中→德
            </button>
          </div>

          {/* 说明 */}
          <p className="text-gray-600 mb-6 text-center">
            {mode === 'de2zh' ? '选择每个德语词语对应的中文含义' : '选择每个中文含义对应的德语词语'}
          </p>

          {/* 题目列表 */}
          <div className="space-y-6">
            {data.map(item => (
              <div key={item.id} className="border-b pb-6 last:border-b-0">
                {/* 题目 */}
                <div className="flex items-center gap-4 mb-3">
                  {mode === 'de2zh' ? (
                    <button
                      onClick={() => speak(item.german)}
                      className="text-2xl font-bold text-blue-600 hover:text-blue-800 min-w-[140px] text-left"
                    >
                      {item.german} 🔊
                    </button>
                  ) : (
                    <span className="text-2xl font-bold text-gray-800 min-w-[140px]">
                      {item.chinese}
                    </span>
                  )}
                  <span className="text-gray-400">→</span>
                  <span className="text-lg text-gray-600">
                    {answers[item.id] || '?'}
                  </span>
                  {answers[item.id] && answers[item.id] === (mode === 'de2zh' ? item.chinese : item.german) && (
                    <span className="text-green-600">✓</span>
                  )}
                  {answers[item.id] && answers[item.id] !== (mode === 'de2zh' ? item.chinese : item.german) && (
                    <span className="text-red-600">✗</span>
                  )}
                </div>

                {/* 选项 */}
                <div className="flex flex-wrap gap-2 ml-40">
                  {optionsMap[item.id]?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.id, option, option === (mode === 'de2zh' ? item.chinese : item.german))}
                      className={getOptionClass(item.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              重置
            </button>

            <div className="text-lg">
              <span className="font-bold text-green-600">
                正确: {correctCount}/{data.length}
              </span>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}