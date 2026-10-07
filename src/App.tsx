/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EstimateHeaderData, EstimateItem } from './types/estimate';
import { INITIAL_HEADER_DATA, INITIAL_ITEMS } from './data/sampleEstimate';
import { TopNav, ViewMode } from './components/TopNav';
import { SampleSheet1 } from './components/SampleSheet1';
import { SampleSheet2, ITEMS_PER_BREAKDOWN_PAGE } from './components/SampleSheet2';
import { InputScreen } from './components/InputScreen';
import { CoverEditScreen } from './components/CoverEditScreen';
import {
  Edit3,
  Calculator,
  Layers,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  X,
  Building2,
  Eye,
} from 'lucide-react';
import { exportEstimateToPdf } from './utils/pdfExport';

export default function App() {
  const [header, setHeader] = useState<EstimateHeaderData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('estimate_app_header');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_HEADER_DATA;
  });

  const [items, setItems] = useState<EstimateItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('estimate_app_items');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ITEMS;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [isEditingCover, setIsEditingCover] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgressText, setPdfProgressText] = useState<string>('');
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('見積書.pdf');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Auto-persist header and items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('estimate_app_header', JSON.stringify(header));
    } catch (e) {}
  }, [header]);

  useEffect(() => {
    try {
      localStorage.setItem('estimate_app_items', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = Math.floor(subtotal * (header.taxRate || 0.1));
  const grandTotal = subtotal + taxAmount;
  const breakdownPageCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_BREAKDOWN_PAGE));

  // Export to multi-page A4 PDF
  const handleExportPdf = async (): Promise<boolean> => {
    if (isGeneratingPdf) return false;
    setIsGeneratingPdf(true);
    setPdfProgressText('A4印刷用レイアウトを準備中...');

    // Wait a brief moment to allow React to render the dedicated PDF container
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Collect element IDs (prefer dedicated unscaled pdf- container for pristine resolution)
    const elementIds: string[] = [];
    if (document.getElementById('pdf-estimate-page-1')) {
      elementIds.push('pdf-estimate-page-1');
      for (let p = 1; p <= breakdownPageCount; p++) {
        elementIds.push(`pdf-estimate-breakdown-${p}`);
      }
    } else {
      elementIds.push('estimate-page-1');
      for (let p = 1; p <= breakdownPageCount; p++) {
        elementIds.push(`estimate-breakdown-${p}`);
      }
    }

    const fileName = `見積書_${header.projectSubject || '昇降機補修'}_${header.dateYear || '20XX'}${header.dateMonth || 'X'}${header.dateDay || 'X'}.pdf`;
    setPdfFileName(fileName);

    const result = await exportEstimateToPdf(elementIds, fileName, (msg) => {
      setPdfProgressText(msg);
    });

    setIsGeneratingPdf(false);
    setPdfProgressText('');

    if (result.success && result.blobUrl) {
      setPdfDownloadUrl(result.blobUrl);
      setStatusNotification('高精細A4 PDFのダウンロードが完了しました。');
      setTimeout(() => setStatusNotification(null), 5000);
      return true;
    } else {
      setStatusNotification(result.error || 'PDFの生成中にエラーが発生しました。もう一度お試しください。');
      setTimeout(() => setStatusNotification(null), 5000);
      return false;
    }
  };

  const handleResetSample = () => {
    try {
      localStorage.removeItem('estimate_app_header');
      localStorage.removeItem('estimate_app_items');
    } catch (e) {}
    setHeader(INITIAL_HEADER_DATA);
    setItems(INITIAL_ITEMS);
    setIsEditingCover(false);
    setStatusNotification('初期見本データに戻しました。');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-200 font-sans text-slate-900 flex flex-col selection:bg-slate-800 selection:text-white pb-16 relative w-full max-w-full overflow-x-hidden">
      {/* 1. Single Consolidated Top Navigation (No overlapping bars) */}
      <TopNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExportPdf={handleExportPdf}
        onResetSample={handleResetSample}
        grandTotal={grandTotal}
        itemCount={items.length}
        isGeneratingPdf={isGeneratingPdf}
        projectSubject={header.projectSubject}
        customerName={header.customerName}
      />

      {/* Global Status Notification Toast */}
      {statusNotification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
          {pdfDownloadUrl && (
            <a
              href={pdfDownloadUrl}
              download={pdfFileName}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold shadow-xs transition-colors ml-1 cursor-pointer"
            >
              PDFを再取得
            </a>
          )}
          <button
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PDF Generation Loading Modal */}
      {isGeneratingPdf && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center animate-spin">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">A4高精細PDF出力中</h3>
              <p className="text-xs text-slate-500 mt-1">
                {pdfProgressText || '表紙および内訳明細書をA4サイズで精密レンダリングしています...'}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Screen Main Area */}
      <main className="no-print flex-1 max-w-5xl mx-auto w-full px-2 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">
        {/* Mode: Input Screen (工事項目・原価入力) */}
        {viewMode === 'input' && (
          <InputScreen
            header={header}
            setHeader={setHeader}
            items={items}
            setItems={setItems}
            onGoToPreview={(mode) => {
              setViewMode(mode);
              if (mode === 'page1') setIsEditingCover(false);
            }}
            onExportPdf={handleExportPdf}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}

        {/* Page 1 (Cover / Overview) - 「見積表紙」タブでのみ編集設定を表示 */}
        {viewMode === 'page1' && (
          <div className="space-y-4">
            {/* Header controls for Page 1 */}
            <div className="bg-white rounded-xl border border-slate-300 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  【見積書（表紙・総括表）】
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isEditingCover
                    ? '編集モード中（入力内容はリアルタイムに下のA4表紙へ即座反映されます）'
                    : 'A4実寸印刷プレビュー'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingCover((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-xs ${
                    isEditingCover
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditingCover ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      編集を完了してプレビューのみ表示
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      表紙の項目・会社情報を編集する
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* If in edit mode, show CoverEditScreen right here */}
            {isEditingCover && (
              <div className="space-y-4 animate-fade-in">
                <CoverEditScreen
                  header={header}
                  setHeader={setHeader}
                  onGoToPreview={() => setIsEditingCover(false)}
                  onExportPdf={handleExportPdf}
                  onBackToItems={() => setViewMode('input')}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>【リアルタイム反映確認】以下のA4表紙プレビューに入力内容が即座に反映されています：</span>
                  </div>
                  <button
                    onClick={() => setIsEditingCover(false)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    編集を閉じてA4表紙のみ表示 ↑
                  </button>
                </div>
              </div>
            )}

            {/* Center-aligned responsive container without horizontal scroll */}
            <div className="w-full max-w-full flex flex-col items-center pb-6 pt-1 overflow-x-hidden">
              <SampleSheet1 header={header} items={items} />
            </div>
          </div>
        )}

        {/* Both: 全頁プレビュー（全ページ通覧用・表紙編集設定なし） */}
        {viewMode === 'both' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 pl-1">
                【1ページ目: 見積書（表紙・総括表）】
              </div>
              <div className="w-full max-w-full flex flex-col items-center pb-2 pt-1 overflow-x-hidden">
                <SampleSheet1 header={header} items={items} />
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-300 pt-6">
              <div className="text-xs font-semibold text-slate-500 pl-1">
                【2ページ目以降: 内訳明細書（4行展開・全{breakdownPageCount}頁）】
              </div>
              <div className="w-full max-w-full flex flex-col items-center pb-6 pt-1 overflow-x-hidden">
                <SampleSheet2 items={items} header={header} />
              </div>
            </div>
          </div>
        )}

        {/* Page 2: 内訳明細書単独プレビュー */}
        {viewMode === 'page2' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 pl-1 flex items-center justify-between pt-2">
              <span>
                【内訳明細書（4行展開）: 全{breakdownPageCount}ページ（各A4・5項目ごとに改ページ）】
              </span>
              <button
                onClick={() => setViewMode('input')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold text-xs cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                工事項目を追加・編集する
              </button>
            </div>
            {/* Center-aligned responsive container without horizontal scroll */}
            <div className="w-full max-w-full flex flex-col items-center pb-6 pt-1 overflow-x-hidden">
              <SampleSheet2 items={items} header={header} />
            </div>
          </div>
        )}
      </main>

      {/* 4. Dedicated Unscaled Container for High-Definition PDF Generation (Hidden unless generating) */}
      <div
        id="pdf-export-container"
        aria-hidden="true"
        className="no-print"
        style={{
          display: isGeneratingPdf ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '820px',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        <SampleSheet1 header={header} items={items} idPrefix="pdf-" disableResponsive={true} />
        <SampleSheet2 items={items} header={header} idPrefix="pdf-" disableResponsive={true} />
      </div>

      {/* 5. Pure Print Layout (Page 1 + Page 2 onwards A4 Portrait) */}
      <div className="print-only">
        <div className="page-break">
          <SampleSheet1 header={header} items={items} disableResponsive={true} />
        </div>
        <SampleSheet2 items={items} header={header} disableResponsive={true} />
      </div>
    </div>
  );
}
