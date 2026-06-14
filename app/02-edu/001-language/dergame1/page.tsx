"use client";

import { useState, useEffect } from 'react';

// 各类别单词数据
const categories = {
  Gesicht: [
    { word: "Gesicht", article: "das", chinese: "脸", emoji: "😊" },
    { word: "Haar", article: "das", chinese: "头发", emoji: "💇" },
    { word: "Auge", article: "das", chinese: "眼睛", emoji: "👁️" },
    { word: "Nase", article: "die", chinese: "鼻子", emoji: "👃" },
    { word: "Ohr", article: "das", chinese: "耳朵", emoji: "👂" },
    { word: "Mund", article: "der", chinese: "嘴巴", emoji: "👄" },
    { word: "Zunge", article: "die", chinese: "舌头", emoji: "👅" },
    { word: "Lippe", article: "die", chinese: "嘴唇", emoji: "💋" },
    { word: "Zahn", article: "der", chinese: "牙齿", emoji: "🦷" },
  ],
  Getränke: [
    { word: "Milch", article: "die", chinese: "牛奶", emoji: "🥛" },
    { word: "Bier", article: "das", chinese: "啤酒", emoji: "🍺" },
    { word: "Wein", article: "der", chinese: "葡萄酒", emoji: "🍷" },
    { word: "Kaffee", article: "der", chinese: "咖啡", emoji: "☕" },
    { word: "Tee", article: "der", chinese: "茶", emoji: "🍵" },
    { word: "Saft", article: "der", chinese: "果汁", emoji: "🧃" },
    { word: "Getränk", article: "das", chinese: "饮料", emoji: "🥤" },
  ],
  Obst: [
    { word: "Apfel", article: "der", chinese: "苹果", emoji: "🍎" },
    { word: "Banane", article: "die", chinese: "香蕉", emoji: "🍌" },
    { word: "Orange", article: "die", chinese: "橙子", emoji: "🍊" },
    { word: "Traube", article: "die", chinese: "葡萄", emoji: "🍇" },
    { word: "Erdbeere", article: "die", chinese: "草莓", emoji: "🍓" },
    { word: "Kirsche", article: "die", chinese: "樱桃", emoji: "🍒" },
    { word: "Obst", article: "das", chinese: "水果", emoji: "🫐" },
  ],
};

const categoryNames = Object.keys(categories);
type WordType = typeof categories.Gesicht[number];

export default function SortingGamePage() {
  const [words, setWords] = useState<WordType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryNames[0]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [useTimer, setUseTimer] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [showError, setShowError] = useState(false);

  // 初始化游戏
  const initGame = () => {
    const currentWords = categories[selectedCategory as keyof typeof categories];
    const shuffled = [...currentWords].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setSelectedIndex(-1);
    setAnswers({});
    setScore({ correct: 0, wrong: 0 });
    setTimeLeft(useTimer ? 60 : 0);
    setGameActive(true);
    setShowError(false);
  };

  // 获取当前选中的单词
  const currentWord = selectedIndex >= 0 && selectedIndex < words.length ? words[selectedIndex] : null;
  const total = score.correct + score.wrong;
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === words.length && words.length > 0;

  // 计时器
  useEffect(() => {
    if (gameActive && useTimer && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (gameActive && useTimer && timeLeft === 0) {
      setGameActive(false);
    }
  }, [timeLeft, gameActive, useTimer]);

  // 音效
  const playSound = async (correct: boolean) => {
    try {
      const freq = correct ? 800 : 200;
      const duration = correct ? 0.1 : 0.3;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('音效播放失败', e);
    }
  };

  // 选择答案
  const handleAnswer = (answer: string) => {
    if (!currentWord) return;
    if (answers[currentWord.word]) return; // 已经答过

    const isCorrect = currentWord.article === answer;

    if (isCorrect) {
      playSound(true);
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));

      // 正确时保存答案
      const newAnswers = { ...answers, [currentWord.word]: answer };
      setAnswers(newAnswers);

      // 检查是否全部完成
      const answeredCount = Object.keys(newAnswers).length;
      if (answeredCount === words.length) {
        setGameActive(false);
        return;
      }

      // 自动选择下一个未回答的单词
      for (let i = 1; i <= words.length; i++) {
        const idx = (selectedIndex + i) % words.length;
        const wordItem = words[idx];
        if (wordItem && !newAnswers[wordItem.word]) {
          setSelectedIndex(idx);
          break;
        }
      }
    } else {
      playSound(false);
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));

      // 错误时短暂显示提示，但停留在当前单词
      setShowError(true);
      setTimeout(() => setShowError(false), 300);
    }
  };

  // 选择单词 - 左右键移动
  const handleSelectWord = (index: number) => {
    if (!gameActive) return;
    if (index < 0 || index >= words.length) return;
    if (answers[words[index].word]) return; // 已答过的不允许选择
    setSelectedIndex(index);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive) return;
      if (words.length === 0) return;

      const key = e.key.toLowerCase();

      // 左右箭头选择单词
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        // 找到下一个未回答的单词
        let nextIndex = selectedIndex;
        if (nextIndex < 0) {
          nextIndex = e.key === 'ArrowRight' ? 0 : words.length - 1;
        } else {
          nextIndex = e.key === 'ArrowRight' ? nextIndex + 1 : nextIndex - 1;
        }
        // 循环查找未回答的单词
        for (let i = 0; i < words.length; i++) {
          const idx = ((nextIndex + i) % words.length + words.length) % words.length;
          const wordItem = words[idx];
          if (wordItem && !answers[wordItem.word]) {
            setSelectedIndex(idx);
            break;
          }
        }
        return;
      }

      // 如果没有选中单词，按J/K/L无效
      if (!currentWord) return;

      if (key === 'j') {
        handleAnswer('der');
      } else if (key === 'k') {
        handleAnswer('das');
      } else if (key === 'l') {
        handleAnswer('die');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, selectedIndex, currentWord, answers, words]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 rounded-lg mb-4">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setWords([]);
                setGameActive(false);
              }}
              className="text-lg font-bold bg-white text-purple-600 px-3 py-1 rounded"
            >
              {categoryNames.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <h1 className="text-2xl font-bold">词性分类</h1>
          </div>
          <p className="text-sm">→ 左右键选择单词，J=der, K=das, L=die</p>
        </div>

        {/* 计分板 */}
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={useTimer}
              onChange={(e) => setUseTimer(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-bold">⏱️ 计时</span>
          </label>

          {useTimer && (
            <div className={`px-4 py-2 rounded-lg ${timeLeft <= 10 ? "bg-red-500 text-white" : "bg-white"}`}>
              <span className="font-bold">⏱️ {timeLeft}秒</span>
            </div>
          )}

          <div className="bg-green-100 px-4 py-2 rounded-lg">
            <span className="text-green-700 font-bold">✓ {score.correct}</span>
          </div>
          <div className="bg-red-100 px-4 py-2 rounded-lg">
            <span className="text-red-600 font-bold">✗ {score.wrong}</span>
          </div>
          <div className="bg-blue-100 px-4 py-2 rounded-lg">
            <span className="text-blue-600 font-bold">{accuracy}%</span>
          </div>
          {!gameActive && (
            <button onClick={initGame} className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
              {useTimer && timeLeft === 0 ? "🔄 再玩一次" : "▶️ 开始游戏"}
            </button>
          )}
        </div>

        {/* 单词卡片列表 */}
        <div className="flex flex-wrap gap-3 mb-6">
          {words.map((word, index) => {
            const answer = answers[word.word];
            const isSelected = selectedIndex === index;
            const isCorrect = answer === word.article;
            const isAnswered = !!answer;

            return (
              <div
                key={word.word}
                onClick={() => handleSelectWord(index)}
                className={`w-28 h-28 rounded-xl shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all
                  ${isSelected ? "ring-4 ring-purple-500 scale-110" : ""}
                  ${isAnswered ? (isCorrect ? "bg-green-100" : "bg-red-100") : "bg-white hover:bg-gray-50"}
                  ${!gameActive ? "opacity-50" : ""}
                  ${isAnswered ? "cursor-default" : "cursor-pointer"}
                `}
              >
                <div className="text-2xl">{word.emoji}</div>
                <div className="text-lg font-bold">{word.word}</div>
                <div className="text-xs text-gray-500">{word.chinese}</div>
                {answer && (
                  <div className={`text-lg font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 操作提示 */}
        {gameActive && selectedIndex < 0 && (
          <div className="text-center bg-gray-200 p-4 rounded-xl mb-4">
            <p className="text-gray-600">👈 → 左右键选择单词，J/K/L 回答</p>
          </div>
        )}

        {/* 当前单词操作区 */}
        {currentWord && gameActive && (
          <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
            <div className="text-4xl mb-2">{currentWord.emoji}</div>
            <div className="text-4xl font-bold mb-2">{currentWord.word}</div>
            <div className="text-gray-500 text-xl mb-4">{currentWord.chinese}</div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleAnswer('der')} className="bg-blue-100 border-4 border-blue-500 px-6 py-3 rounded-xl text-2xl font-bold text-blue-500">der (J)</button>
              <button onClick={() => handleAnswer('das')} className="bg-green-100 border-4 border-green-500 px-6 py-3 rounded-xl text-2xl font-bold text-green-500">das (K)</button>
              <button onClick={() => handleAnswer('die')} className="bg-pink-100 border-4 border-pink-500 px-6 py-3 rounded-xl text-2xl font-bold text-pink-500">die (L)</button>
            </div>
          </div>
        )}

        {/* 游戏结束 */}
        {!gameActive && allAnswered && words.length > 0 && (
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-3xl mb-4">🎉 全部完成!</div>
            <div className="text-xl mb-2">正确: {score.correct}</div>
            <div className="text-xl mb-2">错误: {score.wrong}</div>
            <div className="text-xl mb-4">正确率: {accuracy}%</div>
            <button onClick={initGame} className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
              再玩一次
            </button>
          </div>
        )}

        {!gameActive && useTimer && timeLeft === 0 && !allAnswered && words.length > 0 && (
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-3xl mb-4">⏱️ 时间到!</div>
            <div className="text-xl mb-2">正确: {score.correct}</div>
            <div className="text-xl mb-2">错误: {score.wrong}</div>
            <div className="text-xl mb-4">正确率: {accuracy}%</div>
            <button onClick={initGame} className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
              再玩一次
            </button>
          </div>
        )}
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}