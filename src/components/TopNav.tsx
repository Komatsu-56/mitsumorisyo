/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  RotateCcw,
  FileText,
  ListOrdered,
  Layers,
  FileSpreadsheet,
  FileDown,
  Building2,
} from 'lucide-react';

export type ViewMode = 'input' | 'cover' | 'page1' | 'page2' | 'both';

interface TopNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportPdf: () => void;
  onPrint?: () => void;
  onResetSample: () => void;
  grandTotal: number;
  itemCount: number;
  isGeneratingPdf?: boolean;
  projectSubject?: string;
  customerName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  viewMode,
  setViewMode,
  onExportPdf,
  onPrint,
  onResetSample,
  grandTotal,
  itemCount,
  isGeneratingPdf = false,
  projectSubject,
  customerName,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Single Consolidated Row Layout (lg+) */}
        <div className="hidden lg:flex h-16 items-center justify-between gap-4">
          {/* Left: Brand title & Project / Total summary */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              積算
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>見積作成システム</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                  自動計算
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="font-medium text-slate-700 truncate max-w-[160px]">
                  {customerName ? `${customerName}様` : projectSubject || '昇降機機能維持修理'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-slate-900 font-mono">¥{grandTotal.toLocaleString()}.-</span>
                <span className="text-[10px] text-slate-400">(税込)</span>
              </div>
            </div>
          </div>

          {/* Center: View Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('input')}
              className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === 'input'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              工事項目 ({itemCount})
            </button>

            <button
              onClick={() => setViewMode('page1')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === 'page1'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-700" />
              見積書 (表紙)
            </button>

            <button
              onClick={() => setViewMode('page2')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === 'page2'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
              内訳明細書
            </button>

            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === 'both'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              全頁プレビュー
            </button>
          </div>

          {/* Right: Actions (Reset, PDF) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onResetSample}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="添付見本の初期データに戻す"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onExportPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="全ページを結合したA4高精細PDFファイルをダウンロード"
            >
              <FileDown className="w-3.5 h-3.5" />
              {isGeneratingPdf ? 'PDF生成中...' : 'PDF保存'}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Responsive Layout (< lg) */}
        <div className="lg:hidden py-2.5 space-y-2">
          {/* Top Line: Brand & Info + PDF/Print actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0">
                積算
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 tracking-tight flex items-center gap-1">
                  <span>見積作成</span>
                  <span className="font-mono text-blue-700 font-bold text-[11px]">
                    ¥{grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {customerName ? `${customerName}様` : projectSubject || '昇降機修理'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onResetSample}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                title="初期見本に戻す"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onExportPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 rounded-md shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-3 h-3" />
                {isGeneratingPdf ? '生成中' : 'PDF保存'}
              </button>
            </div>
          </div>

          {/* Bottom Line: 4 Tabs Grid (Fits 100% width on any screen with ZERO horizontal scroll) */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
            <button
              onClick={() => setViewMode('input')}
              className={`py-1 text-center font-bold rounded-md transition-colors cursor-pointer truncate px-0.5 ${
                viewMode === 'input'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              工事項目
            </button>
            <button
              onClick={() => setViewMode('page1')}
              className={`py-1 text-center font-medium rounded-md transition-colors cursor-pointer truncate px-0.5 ${
                viewMode === 'page1'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600'
              }`}
            >
              見積表紙
            </button>
            <button
              onClick={() => setViewMode('page2')}
              className={`py-1 text-center font-medium rounded-md transition-colors cursor-pointer truncate px-0.5 ${
                viewMode === 'page2'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600'
              }`}
            >
              内訳明細
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`py-1 text-center font-medium rounded-md transition-colors cursor-pointer truncate px-0.5 ${
                viewMode === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600'
              }`}
            >
              全頁
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
