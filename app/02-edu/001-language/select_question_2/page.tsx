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

// 获取所有选项
const allChineseOptions = adjectives.map(a => a.chinese);
const allGermanOptions = adjectives.map(a => a.german);

// 生成选项（1个正确答案 + 3个干扰选项）
function generateOptions(correctAnswer: string, options: string[]): string[] {
  const pool = options.filter(o => o !== correctAnswer);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return [correctAnswer, ...shuffled.slice(0, 3)].sort(() => Math.random() - 0.5);
}

export default function SelectQuestion2() {
  const [mode, setMode] = useState<'de2zh' | 'zh2de'>('de2zh');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});

  // 切换模式时重新初始化
  useEffect(() => {
    const map: Record<number, string[]> = {};
    const optionList = mode === 'de2zh' ? allChineseOptions : allGermanOptions;
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    adjectives.forEach(item => {
      map[item.id] = generateOptions(item[correctKey as keyof typeof item] as string, optionList);
    });
    setOptionsMap(map);
    setAnswers({});
  }, [mode]);

  const handleSelect = (id: number, answer: string, isCorrect: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
    playSound(isCorrect);
  };

  const getOptionClass = (itemId: number, option: string) => {
    const item = adjectives.find(a => a.id === itemId);
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
    const item = adjectives.find(a => a.id === Number(id));
    if (!item) return false;
    const correctAnswer = mode === 'de2zh' ? item.chinese : item.german;
    return answer === correctAnswer;
  }).length;

  const handleReset = () => {
    setAnswers({});
    const map: Record<number, string[]> = {};
    const optionList = mode === 'de2zh' ? allChineseOptions : allGermanOptions;
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    adjectives.forEach(item => {
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
            德语形容词选择
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 答题区域 */}
        <div className="bg-white rounded-lg shadow p-6">
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
            {adjectives.map(item => (
              <div key={item.id} className="border-b pb-6 last:border-b-0">
                {/* 题目 */}
                <div className="flex items-center gap-4 mb-3">
                  {mode === 'de2zh' ? (
                    <button
                      onClick={() => speak(item.german)}
                      className="text-2xl font-bold text-blue-600 hover:text-blue-800 min-w-[120px] text-left"
                    >
                      {item.german} 🔊
                    </button>
                  ) : (
                    <span className="text-2xl font-bold text-gray-800 min-w-[120px]">
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
                <div className="flex flex-wrap gap-2 ml-36">
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
                正确: {correctCount}/{adjectives.length}
              </span>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}