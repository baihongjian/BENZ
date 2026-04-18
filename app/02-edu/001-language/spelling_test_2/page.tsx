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