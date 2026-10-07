/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EstimateHeaderData } from '../types/estimate';
import {
  Building2,
  Calendar,
  FileText,
  User,
  MapPin,
  Phone,
  FileCheck,
  CheckCircle2,
  RotateCcw,
  Eye,
  Layers,
  FileDown,
} from 'lucide-react';
import { INITIAL_HEADER_DATA } from '../data/sampleEstimate';
import { ViewMode } from './TopNav';

interface CoverEditScreenProps {
  header: EstimateHeaderData;
  setHeader: React.Dispatch<React.SetStateAction<EstimateHeaderData>>;
  onGoToPreview: (mode?: ViewMode) => void;
  onExportPdf: () => void;
  onBackToItems?: () => void;
}

export const CoverEditScreen: React.FC<CoverEditScreenProps> = ({
  header,
  setHeader,
  onGoToPreview,
  onExportPdf,
  onBackToItems,
}) => {
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleChange = (key: keyof EstimateHeaderData, value: any) => {
    setHeader((prev) => ({ ...prev, [key]: value }));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleReset = () => {
    setHeader(INITIAL_HEADER_DATA);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-900 text-white font-bold text-xs rounded-md">
                表紙編集
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                見積書 表紙・基本情報・条件の編集
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              宛名、見積番号、工事件名、受渡・施工条件、自社会社情報などを直接編集できます。編集内容は表紙・プレビューに即座に反映されます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              初期見本に戻す
            </button>
            <button
              onClick={() => onGoToPreview('page1')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              表紙プレビューを見る
            </button>
            <button
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              PDF保存
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-fade-in mt-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            表紙データを更新しました（見積書表紙プレビューに即座に反映中）
          </div>
        )}
      </div>

      {/* Section 1: Customer & Date Info */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            1. 見積先宛名 & 発行日・見積番号
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              顧客名・宛名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={header.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="例: 株式会社〇〇 御中 / XX XX 様"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              見積番号
            </label>
            <input
              type="text"
              value={header.estimateNumber}
              onChange={(e) => handleChange('estimateNumber', e.target.value)}
              className="w-full text-xs font-mono font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="例: 第 2026-001 号"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-800 block mb-1">
              参照日付・号数（宛名下の文書参照情報）
            </label>
            <input
              type="text"
              value={header.referenceDateInfo}
              onChange={(e) => handleChange('referenceDateInfo', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 　年　月　日付　第　号"
            />
          </div>
        </div>

        {/* Date: Year Month Day */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">発行年</label>
            <input
              type="text"
              value={header.dateYear}
              onChange={(e) => handleChange('dateYear', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-center"
              placeholder="2026"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">発行月</label>
            <input
              type="text"
              value={header.dateMonth}
              onChange={(e) => handleChange('dateMonth', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-center"
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">発行日</label>
            <input
              type="text"
              value={header.dateDay}
              onChange={(e) => handleChange('dateDay', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-center"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Project Subject & Greeting */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            2. 工事件名 & 案件分類・挨拶文
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              作業件名（表紙および内訳に印字）<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={header.projectSubject}
              onChange={(e) => handleChange('projectSubject', e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="例: 昇降機設備補修作業"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              案件分類（分類ヘッダーに印字）
            </label>
            <input
              type="text"
              value={header.projectCategory}
              onChange={(e) => handleChange('projectCategory', e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 本案件内訳"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] text-slate-600 block mb-1">挨拶文 1行目</label>
            <input
              type="text"
              value={header.greetingLine1}
              onChange={(e) => handleChange('greetingLine1', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-600 block mb-1">挨拶文 2行目</label>
            <input
              type="text"
              value={header.greetingLine2}
              onChange={(e) => handleChange('greetingLine2', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Commercial Conditions */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            3. 施工条件・受渡条件（表紙左側に明記）
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">受渡場所</label>
            <input
              type="text"
              value={header.deliveryPlace}
              onChange={(e) => handleChange('deliveryPlace', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 貴XXXX内 / 貴社指定現場"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">受渡期間</label>
            <input
              type="text"
              value={header.deliveryPeriod}
              onChange={(e) => handleChange('deliveryPeriod', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: お打ち合わせの上 / ご発注後約3週間"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">施工条件</label>
            <input
              type="text"
              value={header.constructionTerms}
              onChange={(e) => handleChange('constructionTerms', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 土・日・祝日を除く平日昼間施工"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">見積有効期限</label>
            <input
              type="text"
              value={header.validityPeriod}
              onChange={(e) => handleChange('validityPeriod', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 発行日より3ヶ月"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">お支払い条件</label>
            <input
              type="text"
              value={header.paymentTerms}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 工事完了後現金でお支払い願います / 貴社指定条件"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Issuer Company Info */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            4. 発行元情報（自社名・所在地・連絡先・代表者）
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              自社名（会社名）<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={header.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 株式会社〇〇"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">支店・部署名</label>
            <input
              type="text"
              value={header.branchName}
              onChange={(e) => handleChange('branchName', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="例: 東京支店"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">郵便番号</label>
            <input
              type="text"
              value={header.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="〒100-0001"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">電話番号</label>
            <input
              type="text"
              value={header.tel}
              onChange={(e) => handleChange('tel', e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="XXX-XXX-XXXX（Telは自動で1つ付与されます）"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">住所1</label>
            <input
              type="text"
              value={header.address1}
              onChange={(e) => handleChange('address1', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="東京都千代田区〇〇 1-2-3"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">住所2（ビル名等）</label>
            <input
              type="text"
              value={header.address2}
              onChange={(e) => handleChange('address2', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="(〇〇ビル 4F)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">代表者役職</label>
            <input
              type="text"
              value={header.representativeTitle}
              onChange={(e) => handleChange('representativeTitle', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="代表取締役"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">代表者氏名</label>
            <input
              type="text"
              value={header.representativeName}
              onChange={(e) => handleChange('representativeName', e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              placeholder="山田 太郎"
            />
          </div>
        </div>

        {/* Stamp Titles */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            承認印欄タイトル（表紙右下の3連枠）
          </label>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={header.stamp1Title}
              onChange={(e) => handleChange('stamp1Title', e.target.value)}
              className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-center"
              placeholder="枠1 (例: 承認)"
            />
            <input
              type="text"
              value={header.stamp2Title}
              onChange={(e) => handleChange('stamp2Title', e.target.value)}
              className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-center"
              placeholder="枠2 (例: 審査)"
            />
            <input
              type="text"
              value={header.stamp3Title}
              onChange={(e) => handleChange('stamp3Title', e.target.value)}
              className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-center"
              placeholder="枠3 (例: 担当)"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
        <button
          onClick={() => (onBackToItems ? onBackToItems() : onGoToPreview('input'))}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
        >
          ← 工事項目入力画面に戻る
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoToPreview('page1')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            表紙プレビューを確認する
          </button>
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            PDF出力
          </button>
        </div>
      </div>
    </div>
  );
};
