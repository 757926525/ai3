'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistantTab: React.FC = () => {
  const { settings, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'translate'>('chat');

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '你好！我是白狐AI智能对话助手。无论是灵感扩写、AI绘图提示词生成，还是专业问答，我都能为您服务！' },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // AI Translator States
  const [inputTranslate, setInputTranslate] = useState('');
  const [outputTranslate, setOutputTranslate] = useState('');
  const [targetLang, setTargetLang] = useState<'en' | 'zh'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Handle AI Chat Submit
  const handleSendChat = async () => {
    if (!inputChat.trim() || isChatting) return;

    const userMsg: ChatMessage = { id: `user_${Date.now()}`, role: 'user', content: inputChat.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputChat('');
    setIsChatting(true);

    try {
      const res = await fetch('/api/translate/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsg.content,
          targetLang: 'en',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });

      const json = await res.json();
      const replyContent = json.data?.translatedText || '白狐AI已为您生成智能回复！';

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      showToast('AI 对话请求失败，请稍后重试', 'error');
    } finally {
      setIsChatting(false);
    }
  };

  // Handle AI Translator Submit
  const handleTranslateSubmit = async () => {
    if (!inputTranslate.trim() || isTranslating) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputTranslate.trim(),
          targetLang,
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setOutputTranslate(json.data.translatedText);
        showToast('翻译完成！', 'success');
      } else {
        showToast('翻译未成功返回', 'error');
      }
    } catch {
      showToast('翻译请求超时', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            🤖 AI 助手与对话中心
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            内置 Cloudflare 边缘大模型 LLM，兼具 AI 对话答疑与中英高精智能翻译功能
          </p>
        </div>

        <div className="flex bg-blue-900/40 p-1 rounded-xl border border-blue-400/30 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeSubTab === 'chat' ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200 hover:text-white'
            }`}
          >
            💬 AI 对话区
          </button>
          <button
            onClick={() => setActiveSubTab('translate')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeSubTab === 'translate' ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200 hover:text-white'
            }`}
          >
            🌐 AI 翻译区
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: AI Chat Area */}
      {activeSubTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px]">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    🦊
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white font-bold rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}
            {isChatting && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>AI 正在思考回复中...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="输入对话、提示词润色需求或知识问答..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendChat}
              disabled={isChatting || !inputChat.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition"
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: AI Translator Area */}
      {activeSubTab === 'translate' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              🌐 双向智能文本与 Prompt 翻译器
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setTargetLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  targetLang === 'en'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                中 ➔ 英
              </button>
              <button
                onClick={() => setTargetLang('zh')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  targetLang === 'zh'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                英 ➔ 中
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">待翻译原文:</label>
              <textarea
                rows={6}
                value={inputTranslate}
                onChange={(e) => setInputTranslate(e.target.value)}
                placeholder="在此粘贴需要翻译的文本或绘图提示词..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">翻译结果:</label>
              <textarea
                rows={6}
                readOnly
                value={outputTranslate}
                placeholder="翻译结果将在此呈现..."
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleTranslateSubmit}
            disabled={isTranslating || !inputTranslate.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition"
          >
            {isTranslating ? '⏳ 智能翻译中...' : '🚀 立即翻译'}
          </button>
        </div>
      )}
    </div>
  );
};
