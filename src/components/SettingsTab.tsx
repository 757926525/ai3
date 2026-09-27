import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { COMPUTE_ENGINES } from '@/lib/constants';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, showToast, isDarkMode, toggleDarkMode, auth } = useApp();

  const [computeEngine, setComputeEngine] = useState(settings.computeEngine || 'pollinations');
  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [siliconApiKey, setSiliconApiKey] = useState(settings.siliconApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');
  const [stabilityApiKey, setStabilityApiKey] = useState(settings.stabilityApiKey || '');
  const [enableNsfw, setEnableNsfw] = useState(settings.enableNsfw ?? true);

  // Status Light 1: Cloudflare Workers AI API Status (🟢 Connected / 🔴 Disconnected / 🟡 Checking)
  const [cfAiStatus, setCfAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [cfAiMessage, setCfAiStatusMessage] = useState('正在检测 Cloudflare AI Key 连通状态...');

  // Status Light 2: Cloudflare D1 Backend Binding Status (🟢 Bound / 🔴 Unbound / 🟡 Checking)
  const [d1Status, setD1Status] = useState<'bound' | 'unbound' | 'checking'>('checking');
  const [d1Message, setD1StatusMessage] = useState('正在检测 D1 后台数据库绑定...');

  const [isTestingCf, setIsTestingCf] = useState(false);
  const [isSyncingD1, setIsSyncingD1] = useState(false);

  useEffect(() => {
    checkCloudflareAIConnection();
    checkD1Connection();
  }, [cfAccountId, cfApiToken]);

  const checkCloudflareAIConnection = async () => {
    if (!cfAccountId.trim() || !cfApiToken.trim()) {
      setCfAiStatus('disconnected');
      setCfAiStatusMessage('未配置 Cloudflare Account ID 或 Token');
      return;
    }

    setCfAiStatus('checking');
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId.trim()}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfApiToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'a cute fox', num_steps: 1 }),
      });

      if (res.ok) {
        setCfAiStatus('connected');
        setCfAiStatusMessage('Cloudflare Workers AI Token 正常，边缘算力准备就绪');
      } else {
        setCfAiStatus('disconnected');
        setCfAiStatusMessage('Cloudflare AI 鉴权未通过，请检查 Account ID 和 Token');
      }
    } catch {
      setCfAiStatus('disconnected');
      setCfAiStatusMessage('无法连接 Cloudflare API 端点');
    }
  };

  const checkD1Connection = async () => {
    setD1Status('checking');
    try {
      const res = await fetch('/api/d1/sync');
      const json = await res.json();
      if (json.connected) {
        setD1Status('bound');
        setD1StatusMessage(json.message || 'Cloudflare D1 后台数据库绑定正常，云端落库已激活');
      } else {
        setD1Status('unbound');
        setD1StatusMessage('未绑定 D1 数据库 (env.DB)，自动使用浏览器 IndexedDB 离线存储');
      }
    } catch {
      setD1Status('unbound');
      setD1StatusMessage('仅本地存储 (无 D1 后台数据库)');
    }
  };

  const handleTestCfAIAction = async () => {
    setIsTestingCf(true);
    await checkCloudflareAIConnection();
    setIsTestingCf(false);
    showToast('Cloudflare Workers AI 连通性测试完成', 'info');
  };

  const handleSyncD1Push = async () => {
    setIsSyncingD1(true);
    try {
      const res = await fetch('/api/d1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          username: auth.username || 'admin',
          settingsData: { ...settings, enableNsfw },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || '已成功推送设置到 D1！', 'success');
      } else {
        showToast(json.message || json.error || 'D1 同步未完成', 'info');
      }
    } catch {
      showToast('同步处理失败，请确认 wrangler.toml 绑定', 'error');
    } finally {
      setIsSyncingD1(false);
    }
  };

  const handleSave = () => {
    updateSettings({
      computeEngine,
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      siliconApiKey: siliconApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      stabilityApiKey: stabilityApiKey.trim(),
      enableNsfw,
    });
    showToast('全局设置已成功保存！', 'success');
    checkCloudflareAIConnection();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Cloudflare Dual Status Lights Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦊</span>
            <div>
              <h3 className="text-sm font-black tracking-tight">Cloudflare 连通与绑定双状态指示灯</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                实时监视 Workers AI 接口连通性与 D1 数据库后台绑定状态
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            保存配置
          </button>
        </div>

        {/* Status Light 1: Workers AI API Status */}
        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-md ${
                cfAiStatus === 'connected'
                  ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse'
                  : cfAiStatus === 'checking'
                  ? 'bg-amber-400 shadow-amber-400/50 animate-bounce'
                  : 'bg-rose-500 shadow-rose-500/50'
              }`}
            />
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>指示灯 1：Cloudflare Workers AI 接入状态</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    cfAiStatus === 'connected'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : cfAiStatus === 'checking'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {cfAiStatus === 'connected' ? '🟢 接入成功' : cfAiStatus === 'checking' ? '🟡 检测中' : '🔴 未接入/鉴权失败'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{cfAiMessage}</div>
            </div>
          </div>

          <button
            onClick={handleTestCfAIAction}
            disabled={isTestingCf}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold whitespace-nowrap"
          >
            {isTestingCf ? '检测中...' : '重新检测'}
          </button>
        </div>

        {/* Status Light 2: D1 Database Backend Binding Status */}
        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-md ${
                d1Status === 'bound'
                  ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse'
                  : d1Status === 'checking'
                  ? 'bg-amber-400 shadow-amber-400/50 animate-bounce'
                  : 'bg-rose-500 shadow-rose-500/50'
              }`}
            />
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>指示灯 2：Cloudflare D1 后台绑定状态</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    d1Status === 'bound'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : d1Status === 'checking'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {d1Status === 'bound' ? '🟢 D1 已绑定' : d1Status === 'checking' ? '🟡 检测中' : '🔴 未绑定 (离线存储)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{d1Message}</div>
            </div>
          </div>

          <button
            onClick={handleSyncD1Push}
            disabled={isSyncingD1}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
          >
            {isSyncingD1 ? '同步中...' : '手动同步D1'}
          </button>
        </div>

        {/* Cloudflare Account ID & Token Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Cloudflare Account ID (账户 ID)
            </label>
            <input
              type="text"
              placeholder="例如: a1b2c3d4..."
              value={cfAccountId}
              onChange={(e) => setCfAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Cloudflare Workers AI API Token
            </label>
            <input
              type="password"
              placeholder="例如: Bearer token..."
              value={cfApiToken}
              onChange={(e) => setCfApiToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Compute Engine Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
            🚀 融合算力引擎选择
          </h3>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-blue-700 transition"
          >
            保存配置
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPUTE_ENGINES.map((engine) => (
            <label
              key={engine.id}
              className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                computeEngine === engine.id
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
              }`}
            >
              <input
                type="radio"
                name="computeEngine"
                value={engine.id}
                checked={computeEngine === engine.id}
                onChange={(e) => setComputeEngine(e.target.value)}
                className="mt-1 text-blue-600"
              />
              <div className="ml-2.5">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {engine.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {engine.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Other Provider API Keys */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            其他开放平台 Key 配置
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                SiliconFlow Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={siliconApiKey}
                onChange={(e) => setSiliconApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Safety Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>🔥 自由艺术生成模式 (解禁敏感艺术限制)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
              {enableNsfw ? '已开启 (无滤镜)' : '已关闭 (严格过滤)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            开启后允许生成全品类自由艺术画面，不再自动叠加安全负向词限制
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableNsfw}
            onChange={(e) => {
              setEnableNsfw(e.target.checked);
              updateSettings({ enableNsfw: e.target.checked });
              showToast(e.target.checked ? '自由艺术模式已开启！' : '安全过滤模式已开启', 'info');
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* System Mode Switch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{isDarkMode ? '🌙' : '☀️'}</span>
          <div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-100">
              夜间模式 (Dark Mode)
            </div>
            <div className="text-[11px] text-slate-400">
              切换高对比度夜光深色视觉主题
            </div>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
        >
          {isDarkMode ? '切换浅色' : '切换夜间'}
        </button>
      </div>
    </div>
  );
};
