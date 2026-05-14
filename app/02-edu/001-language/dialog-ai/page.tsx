"use client";

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'grammarCheck' | 'reply';
}

const MODES = [
  { id: 'teacher', name: '德语老师' },
  { id: 'ticket', name: '火车站购票' }
];

export default function DialoguebungPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useTTS, setUseTTS] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState(0.80);
  const [mode, setMode] = useState('teacher');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = async (text: string) => {
    if (!useTTS) return;
    try {
      const rateValue = ttsSpeed.toFixed(2).replace(/\.?0+$/, '');
      const response = await fetch('http://localhost:8000/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'de-DE-KatjaNeural',
          rate: rateValue
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          const audio = new Audio(data.audio);
          audio.play();
        }
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const extractGerman = (content: string) => {
    const match = content.match(/德语：([\s\S]*?)(?=中文：|$)/);
    return match ? match[1].trim() : content;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/02-edu/001-language/dialog-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode }),
      });

      const data = await response.json();

      if (data.grammarCheck || data.reply) {
        const assistantMessages: Message[] = [];

        // 添加语法检查结果（不朗读）
        if (data.grammarCheck) {
          assistantMessages.push({
            role: 'assistant',
            content: data.grammarCheck,
            type: 'grammarCheck'
          });
        }

        // 添加对话回复（可以朗读）
        if (data.reply) {
          assistantMessages.push({
            role: 'assistant',
            content: data.reply,
            type: 'reply'
          });

          // 自动朗读德语回复
          if (useTTS) {
            const germanText = extractGerman(data.reply);
            setTimeout(() => speak(germanText), 500);
          }
        }

        setMessages([...newMessages, ...assistantMessages]);
      } else {
        alert(data.error || '发送失败');
      }
    } catch (err) {
      alert('发送失败: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  const changeMode = (newMode: string) => {
    setMode(newMode);
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold">德语对话练习</h1>
            <button
              onClick={clearChat}
              className="px-3 py-1 bg-blue-700 rounded text-sm hover:bg-blue-800"
            >
              新对话
            </button>
          </div>
          {/* 模式选择 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => changeMode(m.id)}
                className={`px-3 py-1 rounded text-sm ${
                  mode === m.id
                    ? 'bg-white text-blue-600 font-bold'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useTTS}
                onChange={(e) => setUseTTS(e.target.checked)}
                className="w-4 h-4"
              />
              自动朗读
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showContent}
                onChange={(e) => setShowContent(e.target.checked)}
                className="w-4 h-4"
              />
              显示内容
            </label>
            <label className="flex items-center gap-2">
              语速:
              <select
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(Number(e.target.value))}
                className="px-2 py-1 rounded text-blue-800"
              >
                <option value={0.50}>很慢</option>
                <option value={0.80} selected>慢</option>
                <option value={1}>正常</option>
              </select>
            </label>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <p className="text-lg mb-2">你好！我是你的德语老师。</p>
              <p>请用德语、中文或英文和我聊天，我会用德语回复你。</p>
              <p className="text-sm mt-4">试着说一句德语吧，例如：</p>
              <p className="text-sm text-blue-600">Hallo, wie geht es dir?</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {msg.role === 'user' || msg.type === 'grammarCheck' || showContent
                    ? msg.content
                    : '⋯⋯'}
                </p>
                {/* 只有 reply 类型显示朗读按钮 */}
                {msg.role === 'assistant' && msg.type === 'reply' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => speak(extractGerman(msg.content))}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      🔊 朗读德语
                    </button>
                    <button
                      onClick={() => setShowContent(!showContent)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showContent ? '🙈 隐藏' : '👁️ 显示'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的消息... (Enter 发送)"
              className="flex-1 p-3 border rounded-lg resize-none h-20"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '发送'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}