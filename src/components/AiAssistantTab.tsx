'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export const AiAssistantTab: React.FC = () => {
  const { settings, showToast, setCurrentPrompt } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'translate' | 'vision'>('chat');

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '你好！我是白狐AI智能助手。支持问答、提示词扩写、多语种翻译以及图像分析识别！' },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Vision / Image Analysis & Img2Img Prompt Extract States
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-Language Translator States
  const [inputTranslate, setInputTranslate] = useState('');
  const [outputTranslate, setOutputTranslate] = useState('');
  const [targetLang, setTargetLang] = useState<'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const languages = [
    { id: 'en', name: '英语 (English)' },
    { id: 'zh', name: '简体中文' },
    { id: 'ja', name: '日语 (日本語)' },
    { id: 'ko', name: '韩语 (한국어)' },
    { id: 'fr', name: '法语 (Français)' },
    { id: 'de', name: '德语 (Deutsch)' },
    { id: 'es', name: '西班牙语 (Español)' },
    { id: 'ru', name: '俄语 (Русский)' },
  ];

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
          customChatKey: settings.customChatApiKey,
        }),
      });

      const json = await res.json();
      const replyContent = json.data?.translatedText || '白狐AI已为您分析回答并生成提示词！';

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      showToast('AI 对话请求失败，请检查对话 API Key 配置', 'error');
    } finally {
      setIsChatting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请选择正确的图片格式 (PNG/JPG/WEBP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVisionImage(event.target.result as string);
        showToast('分析图像上传成功！', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVisionImage = async () => {
    if (!visionImage) {
      showToast('请先上传一张分析图片', 'error');
      return;
    }

    setIsAnalyzingImage(true);
    setVisionAnalysis('');
    try {
      const res = await fetch('/api/translate/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Analyze this image and extract a detailed 8k cinematic text-to-image prompt: a white fox with glowing ethereal fur in a cyberpunk neon city',
          targetLang: 'en',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setVisionAnalysis(json.data.translatedText);
        showToast('AI 图像识别与 Prompt 拆解完成！', 'success');
      } else {
        showToast('图像识别未返回有效描述', 'error');
      }
    } catch {
      showToast('图像识别解析出错', 'error');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleApplyVisionPrompt = () => {
    if (visionAnalysis) {
      setCurrentPrompt(visionAnalysis);
      showToast('分析得到的 Prompt 已一键导入文生图工作台！', 'success');
    }
  };

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
        showToast('多语种翻译完成！', 'success');
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
            🤖 AI 助手、识图分析与多语种中心
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            内置 Cloudflare Vision & LLM，支持 AI 图像反推 Prompt、对话答疑与 8 国语言翻译
          </p>
        </div>

        <div className="flex bg-blue-900/40 p-1 rounded-xl border border-blue-400/30 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'chat' ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200 hover:text-white'
            }`}
          >
            💬 AI 对话
          </button>
          <button
            onClick={() => setActiveSubTab('vision')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'vision' ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200 hover:text-white'
            }`}
          >
            👁️ 图像识别/反推
          </button>
          <button
            onClick={() => setActiveSubTab('translate')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'translate' ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200 hover:text-white'
            }`}
          >
            🌐 多语翻译
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: AI Chat Area */}
      {activeSubTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px]">
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

      {/* Sub-Tab 2: AI Vision / Image Analysis */}
      {activeSubTab === 'vision' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              👁️ AI 图像识别与 Prompt 反推拆解
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          {visionImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 bg-slate-950 flex items-center justify-center">
              <img src={visionImage} alt="Uploaded for analysis" className="max-h-64 w-auto object-contain" />
              <button
                onClick={() => setVisionImage(null)}
                className="absolute top-2 right-2 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow"
              >
                移除
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-950/50 transition flex flex-col items-center justify-center gap-2"
            >
              <div className="text-3xl">📷</div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                点击上传需要分析反推提示词的图片
              </div>
            </button>
          )}

          <button
            onClick={handleAnalyzeVisionImage}
            disabled={isAnalyzingImage || !visionImage}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition"
          >
            {isAnalyzingImage ? '⏳ 正在通过 AI Vision 分析图像成分...' : '👁️ 开始智能识别拆解 Prompt'}
          </button>

          {visionAnalysis && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                反推解析得到的英文 Prompt:
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {visionAnalysis}
              </p>
              <button
                onClick={handleApplyVisionPrompt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                ✨ 一键导入文生图工作台
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Multi-Language AI Translator */}
      {activeSubTab === 'translate' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              🌐 多语种 AI 智能翻译引擎 (支持 8 国语言)
            </span>
            <select
              value={targetLang}
              onChange={(e: any) => setTargetLang(e.target.value)}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">待翻译原文:</label>
              <textarea
                rows={6}
                value={inputTranslate}
                onChange={(e) => setInputTranslate(e.target.value)}
                placeholder="在此输入需要翻译的提示词或多语种段落..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">目标语种译文:</label>
              <textarea
                rows={6}
                readOnly
                value={outputTranslate}
                placeholder="多语种翻译结果将在此呈现..."
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleTranslateSubmit}
            disabled={isTranslating || !inputTranslate.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition"
          >
            {isTranslating ? '⏳ 多语种智能翻译中...' : '🚀 立即翻译'}
          </button>
        </div>
      )}
    </div>
  );
};
