'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GeneratedImage } from '@/types';

export const HistoryTab: React.FC = () => {
  const { history, deleteHistoryItem, clearHistory, showToast, setCurrentPrompt, setNegativePrompt, setSelectedModel, models } = useApp();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Single deletion modal state
  const [imageToDelete, setImageToDelete] = useState<GeneratedImage | null>(null);

  // Batch management states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('提示词已复制到剪贴板！', 'success');
  };

  const handleOneClickRedraw = (item: GeneratedImage) => {
    if (item.params?.prompt) {
      setCurrentPrompt(item.params.prompt);
    }
    if (item.params?.negativePrompt) {
      setNegativePrompt(item.params.negativePrompt);
    }
    if (item.params?.model) {
      const foundM = models.find((m) => m.name === item.params.model || m.id === item.params.model);
      if (foundM) setSelectedModel(foundM);
    }
    showToast('已一键将历史参数与 Prompt 填入绘图工作台！', 'success');
    setSelectedImage(null);
  };

  const confirmSingleDelete = () => {
    if (imageToDelete) {
      deleteHistoryItem(imageToDelete.id);
      setImageToDelete(null);
      if (selectedImage?.id === imageToDelete.id) {
        setSelectedImage(null);
      }
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === history.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(history.map((item) => item.id));
    }
  };

  const confirmBatchDelete = () => {
    selectedItemIds.forEach((id) => deleteHistoryItem(id));
    setSelectedItemIds([]);
    setShowBatchDeleteConfirm(false);
    setIsBatchMode(false);
    showToast(`已批量删除 ${selectedItemIds.length} 张图片`, 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            📜 已生成图像历史档案 ({history.length})
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            采用浏览器 IndexedDB 大容量无损存储，支持一键载入参数重绘与 Cloudflare D1 云端同步
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedItemIds([]);
              }}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
            >
              {isBatchMode ? '取消批量管理' : '☑️ 批量管理'}
            </button>

            {!isBatchMode && (
              <button
                onClick={clearHistory}
                className="px-3.5 py-2 bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 border border-rose-300/30 rounded-xl text-xs font-bold transition"
              >
                🗑️ 清空历史
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batch Control Toolbar */}
      {isBatchMode && history.length > 0 && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm animate-fade-in text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200"
            >
              {selectedItemIds.length === history.length ? '取消全选' : '全选全部'}
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              已选中 <span className="text-blue-600">{selectedItemIds.length}</span> 张
            </span>
          </div>

          <button
            disabled={selectedItemIds.length === 0}
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md disabled:opacity-40"
          >
            🗑️ 批量删除选中 ({selectedItemIds.length})
          </button>
        </div>
      )}

      {/* History Grid */}
      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center space-y-3 border border-slate-200 dark:border-slate-800">
          <div className="text-4xl">🎨</div>
          <div className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            暂无已存历史记录
          </div>
          <div className="text-xs text-slate-400">
            在「文生图」中生成的画像会自动归档保存在此处，支持一键重绘
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {history.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isBatchMode) {
                    toggleSelectItem(item.id, { stopPropagation: () => {} } as any);
                  } else {
                    setSelectedImage(item);
                  }
                }}
                className={`group relative rounded-2xl overflow-hidden border aspect-square cursor-pointer transition transform ${
                  isSelected
                    ? 'border-blue-500 ring-4 ring-blue-500/30 scale-[0.98]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-950 hover:-translate-y-1 hover:shadow-xl'
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.params?.prompt || 'AI generated image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Checkbox for Batch Mode */}
                {isBatchMode && (
                  <div
                    onClick={(e) => toggleSelectItem(item.id, e)}
                    className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs shadow-md transition"
                    style={{ backgroundColor: isSelected ? '#2563eb' : 'rgba(0,0,0,0.5)' }}
                  >
                    {isSelected && '✓'}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-end text-white text-left">
                  <p className="text-[11px] font-bold line-clamp-2 leading-tight">
                    {item.params?.prompt}
                  </p>
                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-300">
                    <span>{item.modelName}</span>
                    <span>查看大图 🔍</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Image Deletion Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center text-xl mx-auto">
                🗑️
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                确认删除此图片档案？
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                此操作将从本地 IndexedDB 存储中永久删除该图片，无法撤销。
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setImageToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={confirmSingleDelete}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 shadow-md"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Deletion Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center text-xl mx-auto">
                🗑️
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                确认批量删除选中的 {selectedItemIds.length} 张图片？
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                此操作将批量清空所选择的图片档案。
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={confirmBatchDelete}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 shadow-md"
              >
                确认批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Viewer with One-Click Redraw */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                🖼️ 历史画像详情参数
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[400px] flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt="Selected history image"
                className="max-h-[400px] w-auto object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                  正向提示词 (Prompt):
                </span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {selectedImage.params?.prompt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                <span>模型: {selectedImage.modelName}</span>
                <span>• 步数: {selectedImage.params?.steps || 25}</span>
                <span>• CFG: {selectedImage.params?.guidance || 8.0}</span>
                <span>• 耗时: {selectedImage.generationTimeMs || 1200} ms</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setImageToDelete(selectedImage)}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100"
              >
                🗑️ 删除此纪录
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(selectedImage.params?.prompt || '')}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  📋 复制提示词
                </button>
                <button
                  onClick={() => handleOneClickRedraw(selectedImage)}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md"
                >
                  ⚡ 一键快捷绘图 (装载参数)
                </button>
                <a
                  href={selectedImage.imageUrl}
                  download={`foxai3_history_${Date.now()}.png`}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  💾 无损原图下载
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
