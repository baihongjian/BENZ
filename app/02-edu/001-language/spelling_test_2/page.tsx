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

// 德语形容词数据
const categories = [
  {
    name: "人物描述",
    items: [
      { id: 101, german: "alt", chinese: "老的" },
      { id: 102, german: "jung", chinese: "年轻的" },
      { id: 103, german: "arm", chinese: "贫穷的" },
      { id: 104, german: "reich", chinese: "富有的" },
      { id: 105, german: "frei", chinese: "自由的 / 空闲的" },
      { id: 106, german: "traurig", chinese: "悲伤的" },
      { id: 107, german: "glücklich", chinese: "快乐的 / 幸福的" },
      { id: 108, german: "gesund", chinese: "健康的" },
      { id: 109, german: "krank", chinese: "生病的" },
      { id: 110, german: "schwach", chinese: "虚弱的 / 弱的" },
      { id: 111, german: "stark", chinese: "强壮的 / 强的" },
      { id: 112, german: "leise", chinese: "安静的 / 小声的" },
      { id: 113, german: "müde", chinese: "疲倦的" },
      { id: 114, german: "tot", chinese: "死的" },
      { id: 115, german: "satt", chinese: "饱的" },
      { id: 116, german: "freundlich", chinese: "友好的" },
      { id: 117, german: "nett", chinese: "和蔼的 / 亲切的" },
      { id: 118, german: "klug", chinese: "聪明的" },
      { id: 119, german: "dumm", chinese: "愚蠢的" },
      { id: 120, german: "faul", chinese: "懒的" },
      { id: 121, german: "fleißig", chinese: "勤奋的" },
    ],
  },
  {
    name: "物体状态",
    items: [
      { id: 201, german: "groß", chinese: "大的 / 高的" },
      { id: 202, german: "klein", chinese: "小的" },
      { id: 203, german: "lang", chinese: "长的" },
      { id: 204, german: "kurz", chinese: "短的" },
      { id: 205, german: "schwer", chinese: "重的 / 困难的" },
      { id: 206, german: "leicht", chinese: "轻的 / 容易的" },
      { id: 207, german: "weit", chinese: "远的 / 宽广的" },
      { id: 208, german: "eng", chinese: "狭窄的" },
      { id: 209, german: "schnell", chinese: "快的" },
      { id: 210, german: "langsam", chinese: "慢的" },
      { id: 211, german: "schön", chinese: "美丽的" },
      { id: 212, german: "neu", chinese: "新的" },
      { id: 213, german: "hoch", chinese: "高的" },
      { id: 214, german: "frisch", chinese: "新鲜的" },
      { id: 215, german: "laut", chinese: "大声的 / 吵的" },
      { id: 216, german: "süß", chinese: "甜的 / 可爱的" },
      { id: 217, german: "ander(e)", chinese: "其他的" },
      { id: 218, german: "gleich", chinese: "一样的 / 马上" },
      { id: 219, german: "kaputt", chinese: "坏的 / 破的" },
      { id: 220, german: "wichtig", chinese: "重要的" },
    ],
  },
  {
    name: "场所/空间/时",
    items: [
      { id: 301, german: "hier", chinese: "这里" },
      { id: 302, german: "dort", chinese: "那里" },
      { id: 303, german: "weg", chinese: "离开 / 不在了" },
      { id: 304, german: "zurück", chinese: "回来 / 回去" },
      { id: 305, german: "links", chinese: "左边" },
      { id: 306, german: "rechts", chinese: "右边" },
      { id: 307, german: "heute", chinese: "今天" },
      { id: 308, german: "gestern", chinese: "昨天" },
      { id: 309, german: "morgen", chinese: "明天 / 早上" },
      { id: 310, german: "bald", chinese: "很快" },
      { id: 311, german: "dann", chinese: "然后 / 那时" },
      { id: 312, german: "gerade", chinese: "正在 / 刚刚" },
      { id: 313, german: "jetzt", chinese: "现在" },
      { id: 314, german: "einmal", chinese: "一次 / 曾经" },
      { id: 315, german: "noch", chinese: "还 / 仍然" },
      { id: 316, german: "schon", chinese: "已经" },
      { id: 317, german: "später", chinese: "稍后" },
      { id: 318, german: "früh", chinese: "早的" },
      { id: 319, german: "spät", chinese: "晚的" },
      { id: 320, german: "erst", chinese: "才 / 仅仅" },
      { id: 321, german: "nächst(e)", chinese: "下一个" },
      { id: 322, german: "letzt(e)", chinese: "上一个 / 最后一个" },
    ],
  },
  {
    name: "思考/知识/心/感情",
    items: [
      { id: 401, german: "denken", chinese: "思考" },
      { id: 402, german: "glauben", chinese: "相信 / 认为" },
      { id: 403, german: "erzählen", chinese: "讲述" },
      { id: 404, german: "kennen", chinese: "认识（人/地方）" },
      { id: 405, german: "wissen", chinese: "知道（事实）" },
      { id: 406, german: "finden", chinese: "觉得 / 找到" },
      { id: 407, german: "vergessen", chinese: "忘记" },
      { id: 408, german: "lieben", chinese: "爱" },
      { id: 409, german: "freuen", chinese: "高兴" },
      { id: 410, german: "danken", chinese: "感谢" },
      { id: 411, german: "gefallen", chinese: "使喜欢" },
      { id: 412, german: "sehen", chinese: "看见" },
      { id: 413, german: "hören", chinese: "听见" },
      { id: 414, german: "lachen", chinese: "笑" },
      { id: 415, german: "weinen", chinese: "哭" },
      { id: 416, german: "fühlen", chinese: "感觉" },
    ],
  },
  {
    name: "移动/动作",
    items: [
      { id: 501, german: "gehen", chinese: "走 / 去（步行）" },
      { id: 502, german: "fahren", chinese: "乘车 / 行驶" },
      { id: 503, german: "kommen", chinese: "来" },
      { id: 504, german: "fliegen", chinese: "飞" },
      { id: 505, german: "laufen", chinese: "跑 / 走（较快）" },
      { id: 506, german: "schwimmen", chinese: "游泳" },
      { id: 507, german: "reisen", chinese: "旅行" },
      { id: 508, german: "abfahren", chinese: "出发" },
      { id: 509, german: "ankommen", chinese: "到达" },
      { id: 510, german: "aussteigen", chinese: "下车" },
      { id: 511, german: "einsteigen", chinese: "上车" },
      { id: 512, german: "machen", chinese: "做" },
      { id: 513, german: "tun", chinese: "做" },
      { id: 514, german: "stellen", chinese: "放（竖着）" },
      { id: 515, german: "tragen", chinese: "搬 / 穿 / 拿" },
      { id: 516, german: "legen", chinese: "放（平放）" },
      { id: 517, german: "ziehen", chinese: "拉 / 搬动" },
      { id: 518, german: "hängen", chinese: "挂着 / 挂" },
      { id: 519, german: "halten", chinese: "停下 / 握住" },
      { id: 520, german: "holen", chinese: "去取" },
      { id: 521, german: "bringen", chinese: "带来" },
      { id: 522, german: "öffnen", chinese: "打开" },
      { id: 523, german: "schlagen", chinese: "打 / 敲" },
      { id: 524, german: "schicken", chinese: "发送 / 寄" },
    ],
  },
  {
    name: "交通/其他",
    items: [
      { id: 601, german: "der Zug", chinese: "火车" },
      { id: 602, german: "die Straßenbahn", chinese: "有轨电车" },
      { id: 603, german: "das Auto", chinese: "汽车" },
      { id: 604, german: "der Wagen", chinese: "车辆 / 车厢" },
      { id: 605, german: "das Taxi", chinese: "出租车" },
      { id: 606, german: "der Bus", chinese: "公交车" },
      { id: 607, german: "das Fahrrad", chinese: "自行车" },
      { id: 608, german: "das Flugzeug", chinese: "飞机" },
      { id: 609, german: "die Welt", chinese: "世界" },
      { id: 610, german: "das Ausland", chinese: "国外" },
      { id: 611, german: "die Heimat", chinese: "家乡 / 祖国" },
      { id: 612, german: "Europa", chinese: "欧洲" },
      { id: 613, german: "das Problem", chinese: "问题 / 难题" },
      { id: 614, german: "die Sache", chinese: "事情 / 东西" },
      { id: 615, german: "der Plan", chinese: "计划" },
      { id: 616, german: "die Vorsicht", chinese: "小心 / 谨慎" },
    ],
  },
  {
    name: "建筑/地点",
    items: [
      { id: 701, german: "die Stadt", chinese: "城市" },
      { id: 702, german: "das Dorf", chinese: "村庄" },
      { id: 703, german: "die Straße", chinese: "街道" },
      { id: 704, german: "der Weg", chinese: "路 / 小路" },
      { id: 705, german: "der Bahnhof", chinese: "火车站" },
      { id: 706, german: "das Rathaus", chinese: "市政厅" },
      { id: 707, german: "die Kirche", chinese: "教堂" },
      { id: 708, german: "die Polizei", chinese: "警察（机构）" },
      { id: 709, german: "die Bank", chinese: "银行" },
      { id: 710, german: "das Kaufhaus", chinese: "百货商店" },
      { id: 711, german: "das Geschäft", chinese: "商店 / 生意" },
      { id: 712, german: "das Hotel", chinese: "酒店" },
      { id: 713, german: "das Restaurant", chinese: "餐厅" },
      { id: 714, german: "der Platz", chinese: "广场 / 地方" },
      { id: 715, german: "die Mitte", chinese: "中间" },
      { id: 716, german: "das Geld", chinese: "钱" },
      { id: 717, german: "der Euro", chinese: "欧元" },
      { id: 718, german: "das Geschenk", chinese: "礼物" },
    ],
  },
  {
    name: "物主代词",
    items: [
      { id: 801, german: "mein", chinese: "我的" },
      { id: 802, german: "dein", chinese: "你的" },
      { id: 803, german: "sein", chinese: "他的" },
      { id: 804, german: "ihr", chinese: "她的" },
      { id: 805, german: "sein", chinese: "它的" },
      { id: 806, german: "unser", chinese: "我们的" },
      { id: 807, german: "euer", chinese: "你们的" },
      { id: 808, german: "ihr", chinese: "他们的/她们的/它们的" },
      { id: 809, german: "Ihr", chinese: "您的；您们的" },
    ],
  },
];

// 检查答案是否正确（忽略大小写）
function checkAnswer(input: string, correct: string): boolean {
  return input.trim().toLowerCase() === correct.toLowerCase();
}

export default function SpellingTest2() {
  const [selectedCategory, setSelectedCategory] = useState<string>("人物描述");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [inputRefs, setInputRefs] = useState<Record<number, string>>({});
  const inputElems = useRef<Record<number, HTMLInputElement>>({});

  // 获取当前类别的单词
  const currentCategory = categories.find(c => c.name === selectedCategory);
  const currentItems = currentCategory?.items || [];

  const handleInput = (id: number, value: string) => {
    setInputRefs(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (id: number) => {
    const item = currentItems.find(a => a.id === id);
    if (!item) return;

    const userInput = inputRefs[id] || '';
    const isCorrect = checkAnswer(userInput, item.german);

    setAnswers(prev => ({ ...prev, [id]: userInput }));
    playSound(isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      handleSubmit(id);
    }
  };

  const getInputClass = (itemId: number) => {
    if (!answers[itemId]) return 'border-gray-300';

    const item = currentItems.find(a => a.id === itemId);
    if (!item) return 'border-gray-300';

    if (answers[itemId] === item.german) {
      return 'border-green-500 bg-green-50';
    } else {
      return 'border-red-500 bg-red-50';
    }
  };

  const correctCount = Object.entries(answers).filter(([id, answer]) => {
    const item = currentItems.find(a => a.id === Number(id));
    return item && checkAnswer(answer, item.german);
  }).length;

  const totalAnswered = Object.keys(answers).length;

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
            德语形容词拼写
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 答题区域 */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* 类别选择 */}
          <div className="flex justify-center gap-4 mb-6">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setAnswers({});
                  setInputRefs({});
                }}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === cat.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 说明 */}
          <p className="text-gray-600 mb-6 text-center">
            看中文含义，拼写德语单词
          </p>

          {/* 题目列表 */}
          <div className="space-y-6">
            {currentItems.map(item => (
              <div key={item.id} className="border-b pb-6 last:border-b-0">
                {/* 中文含义 */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-lg text-gray-600 min-w-[120px] text-right">
                    {item.chinese}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-xl font-bold text-blue-600 min-w-[100px]">
                    {answers[item.id] || '____'}
                  </span>
                  {answers[item.id] && checkAnswer(answers[item.id], item.german) && (
                    <span className="text-green-600">✓</span>
                  )}
                  {answers[item.id] && !checkAnswer(answers[item.id], item.german) && (
                    <span className="text-red-600">✗ 正确答案: {item.german}</span>
                  )}
                </div>

                {/* 输入框 */}
                <div className="flex items-center gap-2 ml-36">
                  <input
                    ref={(el) => {
                      if (el) inputElems.current[item.id] = el;
                    }}
                    type="text"
                    value={inputRefs[item.id] || ''}
                    onChange={(e) => handleInput(item.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    onBlur={() => handleSubmit(item.id)}
                    disabled={!!answers[item.id]}
                    placeholder="输入德语单词"
                    className={`flex-1 px-4 py-2 border-2 rounded text-lg focus:outline-none focus:ring-2 ${
                      answers[item.id]
                        ? getInputClass(item.id)
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  <button
                    onClick={() => speak(item.german)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    title="朗读"
                  >
                    🔊
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <button
              onClick={() => {
                setAnswers({});
                setInputRefs({});
              }}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              重置当前
            </button>

            <div className="text-lg">
              <span className="font-bold text-green-600">
                正确: {correctCount}/{totalAnswered > 0 ? totalAnswered : currentItems.length}
              </span>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}