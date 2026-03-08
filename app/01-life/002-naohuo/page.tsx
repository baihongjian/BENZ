'use client';

import { useState, useEffect } from 'react';

// ============================================
// 题目类型
// ============================================
interface Question {
  id: number;
  type: 'addition' | 'subtraction' | 'multiplication' | 'comparison';
  question: string;
  answer: number;
  options: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// 生成题目
function generateQuestion(id: number): Question {
  const types: ('addition' | 'subtraction' | 'multiplication' | 'comparison')[] = ['addition', 'subtraction', 'multiplication', 'comparison'];
  const type = types[Math.floor(Math.random() * types.length)];

  let question: string;
  let answer: number;
  let options: number[];
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';

  switch (type) {
    case 'addition':
      const addA = Math.floor(Math.random() * 50) + 1;
      const addB = Math.floor(Math.random() * 50) + 1;
      question = `${addA} + ${addB} = ?`;
      answer = addA + addB;
      difficulty = addA + addB > 50 ? 'medium' : 'easy';
      break;
    case 'subtraction':
      const subA = Math.floor(Math.random() * 50) + 20;
      const subB = Math.floor(Math.random() * subA);
      question = `${subA} - ${subB} = ?`;
      answer = subA - subB;
      difficulty = subA > 40 ? 'medium' : 'easy';
      break;
    case 'multiplication':
      const mulA = Math.floor(Math.random() * 9) + 1;
      const mulB = Math.floor(Math.random() * 9) + 1;
      question = `${mulA} × ${mulB} = ?`;
      answer = mulA * mulB;
      difficulty = 'medium';
      break;
    case 'comparison':
      const compA = Math.floor(Math.random() * 100);
      const compB = Math.floor(Math.random() * 100);
      const symbols = ['<', '>', '='];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      let isCorrect = false;
      if (symbol === '<' && compA < compB) isCorrect = true;
      else if (symbol === '>' && compA > compB) isCorrect = true;
      else if (symbol === '=' && compA === compB) isCorrect = true;

      question = `${compA} ${symbol} ${compB}`;
      answer = isCorrect ? 1 : 0;
      difficulty = 'easy';
      break;
    default:
      question = '1 + 1 = ?';
      answer = 2;
  }

  // 生成干扰选项
  options = generateOptions(answer, difficulty);

  return { id, type, question, answer, options, difficulty };
}

function generateOptions(correctAnswer: number, difficulty: 'easy' | 'medium' | 'hard'): number[] {
  const options = new Set<number>();
  options.add(correctAnswer);

  while (options.size < 4) {
    let offset = Math.floor(Math.random() * 10) + 1;
    if (Math.random() > 0.5) offset = -offset;
    const wrong = correctAnswer + offset;
    if (wrong >= 0 && wrong !== correctAnswer && !options.has(wrong)) {
      options.add(wrong);
    }
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

// ============================================
// 主页面
// ============================================
export default function NaohuoPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // 生成题目
  const initQuestions = () => {
    const newQuestions = Array.from({ length: 10 }, (_, i) => generateQuestion(i + 1));
    setQuestions(newQuestions);
  };

  const startGame = () => {
    initQuestions();
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowResult(false);
    setStreak(0);
    setGameStarted(true);
  };

  const handleOptionClick = (option: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === questions[currentIndex].answer;
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount(c => c + 1);
      setStreak(s => s + 1);
      // 分数计算：基础分 + 连续奖励
      const baseScore = questions[currentIndex].difficulty === 'hard' ? 30 : questions[currentIndex].difficulty === 'medium' ? 20 : 10;
      const streakBonus = Math.min(streak * 5, 50);
      setScore(s => s + baseScore + streakBonus);
    } else {
      setWrongCount(c => c + 1);
      setStreak(0);
    }

    setShowResult(true);

    // 1秒后下一题
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setShowResult(false);
      } else {
        setGameStarted(false);
      }
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'addition': return '➕';
      case 'subtraction': return '➖';
      case 'multiplication': return '✖️';
      case 'comparison': return '🔢';
      default: return '❓';
    }
  };

  // 重新开始
  const resetGame = () => {
    setGameStarted(false);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowResult(false);
    setStreak(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-400">
      {/* 标题 */}
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">🧠 脑力训练 - 计算题</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 开始画面 */}
        {!gameStarted && questions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🧮</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">计算题训练</h2>
            <p className="text-gray-600 mb-6">10道计算题，考验你的计算能力！</p>
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="bg-green-100 px-2 py-1 rounded">简单</span>
                <span className="text-gray-500">+10分</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-yellow-100 px-2 py-1 rounded">中等</span>
                <span className="text-gray-500">+20分</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-red-100 px-2 py-1 rounded">困难</span>
                <span className="text-gray-500">+30分</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">连续答对可获得额外奖励分！</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
            >
              开始挑战
            </button>
          </div>
        )}

        {/* 结算画面 */}
        {!gameStarted && questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">{correctCount >= 8 ? '🎉' : correctCount >= 5 ? '👍' : '💪'}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">挑战完成！</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-500">正确</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
                <div className="text-sm text-gray-500">错误</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-500">总分</div>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-6">
              最高连续正确: {streak} 题
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
            >
              再来一次
            </button>
          </div>
        )}

        {/* 游戏进行中 */}
        {gameStarted && questions.length > 0 && (
          <>
            {/* 进度条 */}
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>进度 {currentIndex + 1}/10</span>
                <span>得分: {score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-green-500 rounded-xl p-3 text-center text-white">
                <div className="text-2xl font-bold">{correctCount}</div>
                <div className="text-xs opacity-80">正确</div>
              </div>
              <div className="flex-1 bg-red-500 rounded-xl p-3 text-center text-white">
                <div className="text-2xl font-bold">{wrongCount}</div>
                <div className="text-xs opacity-80">错误</div>
              </div>
              <div className="flex-1 bg-yellow-500 rounded-xl p-3 text-center text-white">
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-xs opacity-80">连胜</div>
              </div>
            </div>

            {/* 题目卡片 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* 题目头部 */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-400 p-4 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">第 {currentIndex + 1} 题</span>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(questions[currentIndex].difficulty)}`}>
                    {questions[currentIndex].difficulty === 'easy' ? '简单' : questions[currentIndex].difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                <div className="text-center mt-4">
                  <span className="text-4xl font-bold">{questions[currentIndex].question}</span>
                </div>
              </div>

              {/* 选项区域 */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {questions[currentIndex].options.map((option, index) => {
                    let buttonClass = 'bg-gray-100 hover:bg-blue-50 text-gray-800';
                    if (showResult) {
                      if (option === questions[currentIndex].answer) {
                        buttonClass = 'bg-green-500 text-white';
                      } else if (option === selectedOption) {
                        buttonClass = 'bg-red-500 text-white';
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        disabled={showResult}
                        className={`${buttonClass} py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 disabled:transform-none`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* 答题反馈 */}
                {showResult && (
                  <div className={`mt-4 text-center py-2 rounded-lg ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className="font-bold">{isCorrect ? '✅ 正确！' : '❌ 错误！'}</span>
                    {!isCorrect && <span className="ml-2">答案是: {questions[currentIndex].answer}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* 底部提示 */}
            <div className="mt-4 text-center text-white/70 text-sm">
              {streak > 2 && <span className="text-yellow-300 font-bold">🔥 {streak} 连击！</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
