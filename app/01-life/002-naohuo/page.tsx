'use client';

import { useState, useEffect, useRef } from 'react';

// 游戏类型定义
type GameType = 'memory' | 'math' | 'reaction' | 'word' | 'puzzle';

interface GameCard {
  id: string;
  emoji: string;
  matched: boolean;
}

interface GameState {
  score: number;
  time: number;
  level: number;
  playing: boolean;
}

// 记忆卡片游戏
function MemoryGame({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [pairsLeft, setPairsLeft] = useState(8);
  const [gameStarted, setGameStarted] = useState(false);

  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

  useEffect(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: `${i}`, emoji, matched: false }));
    setCards(shuffled);
  }, []);

  const handleCardClick = (index: number) => {
    if (!gameStarted) return;
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
        setPairsLeft(p => p - 1);
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
  };

  return (
    <div className="p-4">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">スコア</div>
          <div className="text-2xl font-bold text-indigo-600">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">残り</div>
          <div className="text-2xl font-bold text-indigo-600">{pairsLeft}</div>
        </div>
      </div>

      {!gameStarted && (
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold mb-4"
        >
          開始
        </button>
      )}

      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {cards.map((card, i) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(i)}
            className={`
              w-16 h-16 rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-all
              ${flipped.includes(i) || card.matched ? 'bg-white border-2 border-indigo-600' : 'bg-indigo-600'}
              ${card.matched ? 'bg-green-100 border-green-500' : ''}
            `}
          >
            {flipped.includes(i) || card.matched ? card.emoji : ''}
          </div>
        ))}
      </div>

      {pairsLeft === 0 && (
        <div className="text-center mt-4 text-green-600 font-bold text-xl">
          🎉 クリア！スコア: {score}
        </div>
      )}
    </div>
  );
}

// 快速计算游戏
function MathGame({ onClose }: { onClose: () => void }) {
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateProblem = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, result;

    switch(op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        result = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 20;
        b = Math.floor(Math.random() * a);
        result = a - b;
        break;
      default:
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
      alert(`🎯 終了！\n正解数: ${correct}\nスコア: ${score}`);
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
          <div className="text-sm text-gray-600">スコア</div>
          <div className="text-2xl font-bold text-indigo-600">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">時間</div>
          <div className="text-2xl font-bold text-indigo-600">{time}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">正解</div>
          <div className="text-2xl font-bold text-indigo-600">{correct}</div>
        </div>
      </div>

      <div className="text-4xl font-bold mb-4">{problem || '？ + ？ = ?'}</div>

      {!gameStarted ? (
        <button
          onClick={startGame}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold"
        >
          開始
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="text-2xl text-center border-2 border-indigo-600 rounded-lg p-2 w-32 mx-auto block"
            placeholder="答え"
            autoFocus
          />
        </form>
      )}
    </div>
  );
}

// 反射测试游戏
function ReactionGame({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'wait' | 'ready'>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;
  const bestTime = times.length > 0 ? Math.min(...times) : 0;

  const handleClick = () => {
    if (status === 'idle') {
      setStatus('wait');
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => setStatus('ready'), delay);
    } else if (status === 'wait') {
      // False start
      setStatus('idle');
    } else if (status === 'ready') {
      const time = Date.now() - startTimeRef.current;
      setTimes([...times, time]);
      setStatus('wait');
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        setStatus('ready');
        startTimeRef.current = Date.now();
      }, delay);
    }
  };

  useEffect(() => {
    if (status === 'ready') {
      startTimeRef.current = Date.now();
    }
  }, [status]);

  return (
    <div className="p-4 text-center">
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">平均</div>
          <div className="text-2xl font-bold text-indigo-600">{avgTime > 0 ? `${avgTime}ms` : '-'}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">ベスト</div>
          <div className="text-2xl font-bold text-indigo-600">{bestTime > 0 ? `${bestTime}ms` : '-'}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">回数</div>
          <div className="text-2xl font-bold text-indigo-600">{times.length}</div>
        </div>
      </div>

      <div
        onClick={handleClick}
        className={`
          w-48 h-48 rounded-full flex items-center justify-center text-white text-lg cursor-pointer mx-auto transition-all
          ${status === 'idle' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
          ${status === 'wait' ? 'bg-red-500' : ''}
          ${status === 'ready' ? 'bg-green-500' : ''}
        `}
      >
        {status === 'idle' && 'クリックして\n開始'}
        {status === 'wait' && '⏳ まって'}
        {status === 'ready' && '🏃 クリック！'}
      </div>

      <p className="mt-4 text-gray-600">赤 → 緑 になったら素早くクリック！</p>
    </div>
  );
}

// かな入力游戏
function WordGame({ onClose }: { onClose: () => void }) {
  const words = ['さくら', 'うさぎ', 'さくらんぼ', 'ひまわり', 'こむすび', 'わたくし', 'みなと', 'はしる'];
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
      alert(`🎯 終了！\n正解数: ${correct}\nスコア: ${score}`);
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
          <div className="text-sm text-gray-600">スコア</div>
          <div className="text-2xl font-bold text-indigo-600">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">時間</div>
          <div className="text-2xl font-bold text-indigo-600">{time}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">正解</div>
          <div className="text-2xl font-bold text-indigo-600">{correct}</div>
        </div>
      </div>

      <div className="text-3xl font-bold mb-4 tracking-widest">{currentWord}</div>

      {!gameStarted ? (
        <button
          onClick={startGame}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold"
        >
          開始
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="text-xl text-center border-2 border-indigo-600 rounded-lg p-2 w-48 mx-auto block"
            placeholder="入力してEnter"
          />
        </form>
      )}
    </div>
  );
}

// 数字パズル游戏
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

  const isSolved = tiles.every((v, i) => v === i + 1 || (i === 8 && v === 0));

  return (
    <div className="p-4 text-center">
      <div className="mb-4">
        <div className="text-sm text-gray-600">手数</div>
        <div className="text-2xl font-bold text-indigo-600">{moves}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => tile !== 0 && handleTileClick(i)}
            className={`
              w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer transition-all
              ${tile === 0 ? 'bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
            `}
          >
            {tile}
          </div>
        ))}
      </div>

      {isSolved && (
        <div className="text-green-600 font-bold text-xl mb-2">
          🎉 完成！
        </div>
      )}

      <button
        onClick={shuffle}
        className="px-4 py-2 bg-gray-500 text-white rounded-full font-bold"
      >
        リセット
      </button>
    </div>
  );
}

// 游戏卡片组件
function GameCard({
  emoji,
  title,
  desc,
  category,
  badge,
  onClick
}: {
  emoji: string;
  title: string;
  desc: string;
  category: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-xl"
    >
      <div className={`h-32 flex items-center justify-center text-5xl relative
        bg-gradient-to-br from-indigo-100 to-purple-100`}>
        {badge && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {badge}
          </span>
        )}
        {emoji}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{desc}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
            {category}
          </span>
          <span className="text-xs text-gray-400">👤 1人</span>
        </div>
      </div>
    </div>
  );
}

// 游戏弹窗
function GameModal({ game, onClose }: { game: string; onClose: () => void }) {
  const titles: Record<string, string> = {
    memory: '神経衰弱',
    math: '快速計算',
    reaction: '反射テスト',
    word: 'かな入力',
    puzzle: '数字パズル',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">{titles[game] || 'ゲーム'}</h3>
          <button onClick={onClose} className="text-2xl hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>
        {game === 'memory' && <MemoryGame onClose={onClose} />}
        {game === 'math' && <MathGame onClose={onClose} />}
        {game === 'reaction' && <ReactionGame onClose={onClose} />}
        {game === 'word' && <WordGame onClose={onClose} />}
        {game === 'puzzle' && <PuzzleGame onClose={onClose} />}
      </div>
    </div>
  );
}

// 主页面
export default function NaohuoPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const games = [
    { id: 'memory', emoji: '🃏', title: '神経衰弱', desc: 'カードを覚えてペアを見つけよう', category: '記憶力', badge: '人気' },
    { id: 'math', emoji: '🔢', title: '快速計算', desc: '制限時間内に計算問題を解こう', category: '計算力' },
    { id: 'reaction', emoji: '⚡', title: '反射テスト', desc: '緑の信号色でクリック！', category: '反射神経', badge: 'NEW' },
    { id: 'word', emoji: '📝', title: 'かな入力', desc: '表示された文字を素早く入力', category: '言語力' },
    { id: 'puzzle', emoji: '🧩', title: '数字パズル', desc: '数字を順番に並べ替えよう', category: '論理力' },
    { id: 'sequence', emoji: '🎵', title: 'リズム記憶', desc: '光の順番を覚えて再現', category: '記憶力' },
    { id: 'color', emoji: '🎨', title: '色辨别', desc: '文字の色と意味、どちらが早い？', category: '反射神経' },
    { id: 'mental', emoji: '🧮', title: '暗算チャレンジ', desc: '複雑な計算を暗算で解く', category: '計算力' },
  ];

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter(g => {
        const categories: Record<string, string[]> = {
          memory: ['記憶力'],
          math: ['計算力'],
          reaction: ['反射神経'],
          word: ['言語力'],
          puzzle: ['論理力'],
          sequence: ['記憶力'],
          color: ['反射神経'],
          mental: ['計算力'],
        };
        return categories[g.id]?.includes(activeCategory);
      });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧠</span>
            <h1 className="text-2xl font-bold">脳活ランド</h1>
          </div>
          <nav className="hidden md:flex gap-4">
            <a href="#" className="hover:bg-white/20 px-3 py-1 rounded-full transition-colors">ホーム</a>
            <a href="#" className="hover:bg-white/20 px-3 py-1 rounded-full transition-colors">ゲーム一覧</a>
            <a href="#" className="hover:bg-white/20 px-3 py-1 rounded-full transition-colors">ランキング</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">脳のトレーニング</h2>
        <p className="text-lg opacity-90 max-w-2xl mx-auto px-4">
          記憶力・計算力・反射神経を無料で鍛える！様々な脳トレゲームで毎日頭を活性化させましょう。
        </p>
        <div className="flex justify-center gap-8 mt-6 flex-wrap px-4">
          <div className="text-center">
            <div className="text-3xl font-bold">50+</div>
            <div className="text-sm opacity-80">ゲーム数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">100万+</div>
            <div className="text-sm opacity-80">プレイ回数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">無料</div>
            <div className="text-sm opacity-80">いつでも</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'すべて' },
            { id: 'memory', label: '記憶力' },
            { id: 'math', label: '計算力' },
            { id: 'reaction', label: '反射神経' },
            { id: 'puzzle', label: '論理力' },
            { id: 'word', label: '言語力' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Game Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎮 おすすめゲーム</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              emoji={game.emoji}
              title={game.title}
              desc={game.desc}
              category={game.category}
              badge={game.badge}
              onClick={() => setSelectedGame(game.id)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 text-center mt-8">
        <p className="text-lg">🧠 脳活ランド - 毎日、脳を鍛えよう！</p>
        <p className="text-gray-400 text-sm mt-2">© 2025 脳活ランド. All rights reserved.</p>
      </footer>

      {/* Game Modal */}
      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}
