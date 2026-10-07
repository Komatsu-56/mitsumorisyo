/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EstimateHeaderData, EstimateItem } from '../types/estimate';
import { getNormalizedMaterials } from '../utils/estimateCalculations';
import { ResponsiveA4Container } from './ResponsiveA4Container';

interface SampleSheet2Props {
  items: EstimateItem[];
  header?: EstimateHeaderData;
  // Optional single page mode
  activePageOnly?: number; // 1-indexed, if specified only render that page
  disableResponsive?: boolean;
  idPrefix?: string;
}

export const ITEMS_PER_BREAKDOWN_PAGE = 5;

export const SampleSheet2: React.FC<SampleSheet2Props> = ({
  items,
  header,
  activePageOnly,
  disableResponsive = false,
  idPrefix = '',
}) => {
  const formatNumber = (val: number) => (val ?? 0).toLocaleString();

  // Grand total across all items
  const grandTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Split items into chunks of ITEMS_PER_BREAKDOWN_PAGE (5 items per A4 page)
  const pages: EstimateItem[][] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_BREAKDOWN_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_BREAKDOWN_PAGE));
  }

  // If items is empty, show 1 empty page
  if (pages.length === 0) {
    pages.push([]);
  }

  const totalPages = pages.length;

  return (
    <div className="w-full max-w-full space-y-8 flex flex-col items-center">
      {pages.map((pageItems, pageIdx) => {
        const pageNumber = pageIdx + 1;
        if (activePageOnly && activePageOnly !== pageNumber) {
          return null;
        }

        const isLastPage = pageNumber === totalPages;

        const pageContent = (
          <div
            id={`${idPrefix}estimate-breakdown-${pageNumber}`}
            className="estimate-sheet w-[820px] min-w-[820px] min-h-[1100px] h-[1120px] mx-auto bg-white p-8 sm:p-10 border border-slate-300 text-black text-[11px] leading-tight select-none flex flex-col justify-between page-break shrink-0"
          >
            {/* Top Container */}
            <div>
              {/* Sheet Title & Page Indicator */}
              <div className="flex items-center justify-between mb-2 border-b-2 border-black pb-1">
                <div className="w-24"></div>

                <div className="text-center flex-1">
                  <span className="text-xl font-bold tracking-[0.6em] inline-block font-serif pl-3">
                    内　訳　明　細　書
                  </span>
                </div>

                <div className="w-24 text-right text-xs font-mono font-bold">
                  （ {pageNumber} / {totalPages} ）
                </div>
              </div>

              {/* Outer Bordered Breakdown Table */}
              <div className="border-2 border-black mt-3">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black text-center font-medium">
                      <th className="border-r border-black py-1.5 w-12 shrink-0 whitespace-nowrap text-center">項目</th>
                      <th className="border-l border-black border-r border-black py-1.5 px-3 min-w-[260px] text-center whitespace-nowrap">件　　　　　　名</th>
                      <th className="border-l border-black border-r border-black py-1.5 w-20 shrink-0 whitespace-nowrap text-center">数　量</th>
                      <th className="border-l border-black border-r border-black py-1.5 w-24 shrink-0 whitespace-nowrap text-center">単価（円）</th>
                      <th className="border-l border-black py-1.5 w-28 shrink-0 whitespace-nowrap text-center">金額（円）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Top subheader indicator */}
                    <tr className="border-b border-black/30">
                      <td className="border-r border-black py-1"></td>
                      <td className="border-l border-black border-r border-black py-1 px-3 font-semibold text-gray-800">
                        ({header?.projectCategory ?? '本案件内訳'}{header?.projectSubject ? ` : ${header.projectSubject}` : ''})
                      </td>
                      <td className="border-l border-black border-r border-black py-1"></td>
                      <td className="border-l border-black border-r border-black py-1"></td>
                      <td className="border-l border-black py-1"></td>
                    </tr>

                    {/* Items on this page */}
                    {pageItems.map((item, idxOnPage) => {
                      const globalIdx = pageIdx * ITEMS_PER_BREAKDOWN_PAGE + idxOnPage + 1;
                      const b = item.breakdown;
                      const itemTotal = item.amount;
                      const mats = getNormalizedMaterials(b);
                      const effectiveMats =
                        mats.length > 0
                          ? mats
                          : [
                              {
                                id: 'mat-default',
                                name: '材料一式',
                                quantity: 1,
                                unit: '式',
                                unitPrice: b.materialAmount,
                                amount: b.materialAmount,
                              },
                            ];

                      // Dynamic rowSpan:
                      // Title row (1) + 材料費見出し行 (1) + 各材料明細行 (effectiveMats.length) + 取替調整費 (1) + 運搬交通費 (1) + 諸経費 (1) + 計 (1)
                      const itemRowSpan = 1 + 1 + effectiveMats.length + 4;

                      return (
                        <React.Fragment key={item.id}>
                          {/* Item Title Row */}
                          <tr className="border-t border-black">
                            {/* Item Number */}
                            <td
                              rowSpan={itemRowSpan}
                              className="border-r border-black align-top py-2 text-center font-mono font-bold text-xs"
                            >
                              {globalIdx}
                            </td>

                            {/* Title */}
                            <td className="border-l border-black border-r border-black pt-2 pb-1 px-3 font-bold text-xs text-slate-900 break-words">
                              {item.title}
                            </td>
                            <td className="border-l border-black border-r border-black"></td>
                            <td className="border-l border-black border-r border-black"></td>
                            <td className="border-l border-black"></td>
                          </tr>

                          {/* 1. 材料費: 見出し行（金額は各品名側で計上されるため空欄） */}
                          <tr className="border-t border-dotted border-black/20">
                            <td className="border-l border-black border-r border-black py-1 px-3">
                              <div className="text-gray-900 font-medium">・材料費</div>
                            </td>
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black py-1"></td>
                          </tr>
                          {effectiveMats.map((mat, mIdx) => (
                            <tr key={mat.id || mIdx} className="border-t border-dotted border-black/15">
                              <td className="border-l border-black border-r border-black py-0.5 px-3">
                                <div className="pl-4 text-[10px] text-gray-800 leading-snug flex items-center">
                                  <span className="text-gray-400 mr-1 text-[9px] shrink-0">└</span>
                                  <span className="break-words">{mat.name}</span>
                                </div>
                              </td>
                              <td className="border-l border-black border-r border-black py-0.5 text-center font-mono text-[10px] text-gray-700">
                                {mat.quantity} {mat.unit || '式'}
                              </td>
                              <td className="border-l border-black border-r border-black py-0.5 text-right font-mono pr-2 text-[10px] text-gray-600">
                                {mat.unitPrice ? formatNumber(mat.unitPrice) : ''}
                              </td>
                              <td className="border-l border-black py-0.5 text-right font-mono pr-2 font-medium text-[10px] text-gray-800">
                                {formatNumber(mat.amount)}
                              </td>
                            </tr>
                          ))}

                          {/* 2. 取替調整費 */}
                          <tr className="border-t border-dotted border-black/20">
                            <td className="border-l border-black border-r border-black py-1 px-3 text-gray-900 font-medium">
                              ・取替調整費
                            </td>
                            <td className="border-l border-black border-r border-black py-1 text-center font-mono">
                              1 式
                            </td>
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black py-1 text-right font-mono pr-2 font-medium">
                              {formatNumber(b.replacementLaborAmount)}
                            </td>
                          </tr>

                          {/* 3. 運搬交通費 */}
                          <tr className="border-t border-dotted border-black/20">
                            <td className="border-l border-black border-r border-black py-1 px-3 text-gray-900 font-medium">
                              ・運搬交通費
                            </td>
                            <td className="border-l border-black border-r border-black py-1 text-center font-mono">
                              1 式
                            </td>
                            <td className="border-l border-black border-r border-black py-1 text-right font-mono pr-2 text-gray-600">
                              {formatNumber(b.transportAmount)}
                            </td>
                            <td className="border-l border-black py-1 text-right font-mono pr-2 font-medium">
                              {formatNumber(b.transportAmount)}
                            </td>
                          </tr>

                          {/* 4. 諸経費 */}
                          <tr className="border-t border-dotted border-black/20">
                            <td className="border-l border-black border-r border-black py-1 px-3 text-gray-900 font-medium">
                              ・諸経費
                            </td>
                            <td className="border-l border-black border-r border-black py-1 text-center font-mono">
                              1 式
                            </td>
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black py-1 text-right font-mono pr-2 font-medium">
                              {formatNumber(b.overheadAmount)}
                            </td>
                          </tr>

                          {/* Subtotal 計 for this Item */}
                          <tr className="border-b border-black">
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black border-r border-black py-1"></td>
                            <td className="border-l border-black border-r border-black py-1 text-center font-bold">
                              計
                            </td>
                            <td className="border-l border-black py-1 text-right font-mono pr-2 font-bold text-xs">
                              ¥{formatNumber(itemTotal)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Bottom Summary: 頁小計は不要、最終頁の内訳合計（税抜）のみ表示 */}
                    {isLastPage && (
                      <tr className="border-t-2 border-black font-bold">
                        <td className="border-r border-black py-2"></td>
                        <td className="border-l border-black border-r border-black py-2 px-3 text-right">
                          内訳合計（税抜）
                        </td>
                        <td className="border-l border-black border-r border-black py-2"></td>
                        <td className="border-l border-black border-r border-black py-2"></td>
                        <td className="border-l border-black py-2 text-right font-mono pr-2 text-xs">
                          ¥{formatNumber(grandTotal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Footer Space (No 以上 on breakdown sheet) */}
            <div className="pt-2 border-t border-slate-200"></div>
          </div>
        );

        if (disableResponsive) {
          return <React.Fragment key={`breakdown-page-${pageNumber}`}>{pageContent}</React.Fragment>;
        }

        return (
          <ResponsiveA4Container key={`breakdown-page-${pageNumber}`} className="w-full max-w-full">
            {pageContent}
          </ResponsiveA4Container>
        );
      })}
    </div>
  );
};
