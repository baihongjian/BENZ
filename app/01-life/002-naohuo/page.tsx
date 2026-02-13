'use client';

import { useState, useEffect, useRef } from 'react';

// ============================================
// 游戏卡片接口
// ============================================
interface GameCardData {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
}

// ============================================
// 1. 记忆卡片游戏
// ============================================
function MemoryGame({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState<{ id: string; emoji: string; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [pairsLeft, setPairsLeft] = useState(8);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

  useEffect(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: `${i}`, emoji, matched: false }));
    setCards(shuffled);
  }, []);

  const handleCardClick = (index: number) => {
    if (!gameStarted || gameWon) return;
    if (flipped.includes(index) || cards[index].matched) return;
    if (flipped.length >= 2) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (cards[i1].emoji === cards[i2].emoji) {
        setCards(prev => prev.map((card, i) =>
          i === i1 || i === i2 ? { ...card, matched: true } : card
        ));
        setScore(s => s + 100);
        setPairsLeft(p => {
          const newVal = p - 1;
          if (newVal === 0) setGameWon(true);
          return newVal;
        });
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const resetGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: `${i}`, emoji, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setScore(0);
    setPairsLeft(8);
    setGameStarted(true);
    setGameWon(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Score</div>
          <div className="text-2xl font-bold text-gray-800">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Left</div>
          <div className="text-2xl font-bold text-gray-800">{pairsLeft}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
        {cards.map((card, i) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(i)}
            className={`
              aspect-square rounded-md flex items-center justify-center text-xl cursor-pointer transition-all duration-150
              ${flipped.includes(i) || card.matched
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'bg-emerald-400'
              }
              ${card.matched ? 'opacity-50' : ''}
            `}
          >
            {flipped.includes(i) || card.matched ? card.emoji : ''}
          </div>
        ))}
      </div>

      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-md"
          >
            Play
          </button>
        </div>
      )}

      {gameWon && (
        <div className="text-center">
          <div className="text-xl font-bold text-orange-500 mb-2">You Won!</div>
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-md"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 2. 快速计算游戏
// ============================================
function MathGame({ onClose }: { onClose: () => void }) {
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, result;

    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      result = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a);
      result = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      result = a * b;
    }

    setProblem(`${a} ${op} ${b} = ?`);
    return result;
  };

  const [currentResult, setCurrentResult] = useState(0);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCorrect(0);
    setTime(60);
    const result = generateProblem();
    setCurrentResult(result);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!gameStarted) return;
    if (time <= 0) {
      setGameStarted(false);
      return;
    }
    const timer = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [time, gameStarted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === currentResult) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      const result = generateProblem();
      setCurrentResult(result);
    }
    setAnswer('');
  };

  return (
    <div className="p-4 text-center">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Score</div>
          <div className="text-2xl font-bold text-gray-800">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
          <div className="text-2xl font-bold text-gray-800">{time}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Correct</div>
          <div className="text-2xl font-bold text-gray-800">{correct}</div>
        </div>
      </div>

      <div className="text-4xl font-bold mb-6 text-gray-800">{problem || '? + ? = ?'}</div>

      {!gameStarted ? (
        <button
          onClick={startGame}
          className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-md"
        >
          Play
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="text-2xl text-center border border-gray-300 rounded p-2 w-28"
            placeholder="?"
            autoFocus
          />
        </form>
      )}
    </div>
  );
}

// ============================================
// 3. 反射测试游戏
// ============================================
function ReactionGame({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'wait' | 'ready'>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const [currentResult, setCurrentResult] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;
  const bestTime = times.length > 0 ? Math.min(...times) : 0;

  const handleClick = () => {
    if (status === 'idle') {
      setStatus('wait');
      const delay = 1500 + Math.random() * 2000;
      setTimeout(() => {
        setStatus('ready');
        startTimeRef.current = Date.now();
      }, delay);
    } else if (status === 'wait') {
      setStatus('idle');
    } else if (status === 'ready') {
      const time = Date.now() - startTimeRef.current;
      setTimes([...times, time]);
      setCurrentResult(time);
      setStatus('wait');
      const delay = 1500 + Math.random() * 2000;
      setTimeout(() => {
        setStatus('ready');
        startTimeRef.current = Date.now();
      }, delay);
    }
  };

  return (
    <div className="p-4 text-center">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Avg</div>
          <div className="text-xl font-bold text-gray-800">{avgTime > 0 ? `${avgTime}ms` : '-'}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Best</div>
          <div className="text-xl font-bold text-orange-500">{bestTime > 0 ? `${bestTime}ms` : '-'}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Count</div>
          <div className="text-xl font-bold text-gray-800">{times.length}</div>
        </div>
      </div>

      <div
        onClick={handleClick}
        className={`
          w-40 h-40 rounded-lg flex flex-col items-center justify-center text-white text-sm cursor-pointer mx-auto
          ${status === 'idle' ? 'bg-blue-400' : ''}
          ${status === 'wait' ? 'bg-red-400' : ''}
          ${status === 'ready' ? 'bg-green-400' : ''}
        `}
      >
        {status === 'idle' && 'Click to start'}
        {status === 'wait' && 'Wait...'}
        {status === 'ready' && 'Click!'}
      </div>

      {currentResult !== null && (
        <div className="mt-4 text-2xl font-bold text-green-500">{currentResult}ms</div>
      )}

      <p className="mt-4 text-gray-500 text-xs">Click when it turns green!</p>
    </div>
  );
}

// ============================================
// 4. 日文输入游戏
// ============================================
function WordGame({ onClose }: { onClose: () => void }) {
  const words = ['さくら', 'うさぎ', 'ひまわり', 'すし', 'おにぎり', 'はしる', 'わたくし', 'みなと'];
  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [correct, setCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextWord = () => {
    setCurrentWord(words[Math.floor(Math.random() * words.length)]);
    setInput('');
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCorrect(0);
    setTime(30);
    nextWord();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!gameStarted) return;
    if (time <= 0) {
      setGameStarted(false);
      return;
    }
    const timer = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [time, gameStarted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === currentWord) {
      setScore(s => s + 100);
      setCorrect(c => c + 1);
      nextWord();
    }
  };

  return (
    <div className="p-4 text-center">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Score</div>
          <div className="text-2xl font-bold text-gray-800">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
          <div className="text-2xl font-bold text-gray-800">{time}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Correct</div>
          <div className="text-2xl font-bold text-gray-800">{correct}</div>
        </div>
      </div>

      <div className="text-3xl font-bold mb-6 text-gray-800">{currentWord}</div>

      {!gameStarted ? (
        <button
          onClick={startGame}
          className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-md"
        >
          Play
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="text-xl text-center border border-gray-300 rounded p-2 w-40"
            placeholder="Type..."
          />
        </form>
      )}
    </div>
  );
}

// ============================================
// 5. 数字华容道游戏
// ============================================
function PuzzleGame({ onClose }: { onClose: () => void }) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [moves, setMoves] = useState(0);

  const shuffle = () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = 0; i < 100; i++) {
      const moves = getPossibleMoves();
      const move = moves[Math.floor(Math.random() * moves.length)];
      [arr[emptyIndex], arr[move]] = [arr[move], arr[emptyIndex]];
      setEmptyIndex(move);
    }
    setTiles([...arr]);
    setMoves(0);
  };

  const getPossibleMoves = () => {
    const moves: number[] = [];
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;
    if (row > 0) moves.push(emptyIndex - 3);
    if (row < 2) moves.push(emptyIndex + 3);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < 2) moves.push(emptyIndex + 1);
    return moves;
  };

  useEffect(() => {
    shuffle();
  }, []);

  const handleTileClick = (index: number) => {
    const possibleMoves = getPossibleMoves();
    if (!possibleMoves.includes(index)) return;

    const newTiles = [...tiles];
    [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
    setTiles(newTiles);
    setEmptyIndex(index);
    setMoves(m => m + 1);
  };

  const isSolved = tiles.length > 0 && tiles.every((v, i) => v === i + 1 || (i === 8 && v === 0));

  return (
    <div className="p-4 text-center">
      <div className="mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Moves</div>
        <div className="text-2xl font-bold text-gray-800">{moves}</div>
      </div>

      <div className="grid grid-cols-3 gap-1 max-w-[180px] mx-auto mb-4">
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => tile !== 0 && handleTileClick(i)}
            className={`
              w-14 h-14 rounded flex items-center justify-center text-lg font-bold
              ${tile === 0 ? 'bg-gray-200' : 'bg-emerald-400 text-white'}
            `}
          >
            {tile}
          </div>
        ))}
      </div>

      {isSolved && (
        <div className="text-green-500 font-bold">Solved!</div>
      )}

      <button
        onClick={shuffle}
        className="mt-4 px-4 py-1 bg-gray-400 text-white text-xs font-bold rounded"
      >
        Reset
      </button>
    </div>
  );
}

// ============================================
// 游戏卡片组件 - 精确模仿 Poki
// ============================================
function GameCard({ game, onClick }: { game: GameCardData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* 封面区域 */}
        <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
          <span className="text-4xl">{game.emoji}</span>
        </div>

        {/* 标题 */}
        <div className="p-2">
          <h3 className="text-sm font-bold text-gray-800 truncate">{game.title}</h3>
        </div>

        {/* 播放按钮 - Poki特色 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 分类标签组件
// ============================================
function CategoryTag({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 text-sm font-bold rounded-full transition-colors
        ${isActive
          ? 'bg-gray-800 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================
// 游戏弹窗
// ============================================
function GameModal({ game, onClose }: { game: string; onClose: () => void }) {
  const titles: Record<string, string> = {
    memory: 'Memory Game',
    math: 'Math Game',
    reaction: 'Reaction Test',
    word: 'Word Game',
    puzzle: 'Number Puzzle',
    sequence: 'Sequence Memory',
    color: 'Color Test',
    mental: 'Mental Math',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden shadow-xl">
        <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
          <h3 className="font-bold">{titles[game] || 'Game'}</h3>
          <button onClick={onClose} className="text-xl font-bold w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {game === 'memory' && <MemoryGame onClose={onClose} />}
          {game === 'math' && <MathGame onClose={onClose} />}
          {game === 'reaction' && <ReactionGame onClose={onClose} />}
          {game === 'word' && <WordGame onClose={onClose} />}
          {game === 'puzzle' && <PuzzleGame onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 主页面
// ============================================
export default function NaohuoPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // 游戏数据
  const games: GameCardData[] = [
    { id: 'memory', emoji: '🃏', title: 'Memory', description: 'Match pairs', category: 'memory', badge: 'Popular' },
    { id: 'math', emoji: '🔢', title: 'Math', description: 'Quick math', category: 'math' },
    { id: 'reaction', emoji: '⚡', title: 'Reaction', description: 'Test your reflexes', category: 'reaction', badge: 'New' },
    { id: 'word', emoji: '📝', title: 'Word', description: 'Type Japanese', category: 'word' },
    { id: 'puzzle', emoji: '🧩', title: 'Puzzle', description: 'Number puzzle', category: 'puzzle' },
    { id: 'sequence', emoji: '🎵', title: 'Sequence', description: 'Remember sequence', category: 'memory' },
    { id: 'color', emoji: '🎨', title: 'Color', description: 'Color test', category: 'reaction' },
    { id: 'mental', emoji: '🧮', title: 'Mental', description: 'Mental math', category: 'math' },
  ];

  // 分类
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'memory', label: 'Memory' },
    { id: 'math', label: 'Math' },
    { id: 'reaction', label: 'Reaction' },
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'word', label: 'Word' },
  ];

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter(g => g.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#16a34a]">
      {/* ============================================ */}
      {/* 顶部导航 - Poki风格 */}
      {/* ============================================ */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold text-gray-800">Poki</h1>
              <span className="text-sm text-gray-500 hidden sm:inline">の脳トレ</span>
            </div>

            {/* 导航 */}
            <nav className="flex gap-4">
              <a href="#" className="text-gray-600 text-sm font-bold hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 text-sm font-bold hover:text-gray-900">All Games</a>
              <a href="#" className="text-gray-600 text-sm font-bold hover:text-gray-900">Blog</a>
            </nav>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* Hero区域 - Poki风格绿色背景 */}
      {/* ============================================ */}
      <section className="bg-[#16a34a] py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Free Online Games
          </h2>
          <p className="text-white/90 text-lg mb-6">
            Brain training games - Play now!
          </p>

          {/* 搜索框 */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full px-4 py-2 pl-10 bg-white rounded-lg border-2 border-white/20 text-gray-800 placeholder-gray-500 focus:outline-none"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 统计 */}
          <div className="flex justify-center gap-12 mt-8">
            <div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-white/80 text-sm">Games</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">Free</div>
              <div className="text-white/80 text-sm">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 分类导航 */}
      {/* ============================================ */}
      <section className="bg-white border-b border-gray-200 sticky top-[49px] z-30">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <CategoryTag
                key={cat.id}
                label={cat.label}
                isActive={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 游戏网格 */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => setSelectedGame(game.id)}
            />
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* Footer */}
      {/* ============================================ */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xl font-bold text-gray-800">Poki</div>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Contact</a>
            </div>
            <div className="text-gray-400 text-sm">© 2025</div>
          </div>
        </div>
      </footer>

      {/* ============================================ */}
      {/* 游戏弹窗 */}
      {/* ============================================ */}
      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}
