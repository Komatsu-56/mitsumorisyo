import React from 'react';
import { EstimateHeaderData, EstimateItem } from '../types/estimate';
import { ResponsiveA4Container } from './ResponsiveA4Container';

interface SampleSheet1Props {
  header: EstimateHeaderData;
  items: EstimateItem[];
  disableResponsive?: boolean;
  idPrefix?: string;
}

export const SampleSheet1: React.FC<SampleSheet1Props> = ({
  header,
  items,
  disableResponsive = false,
  idPrefix = '',
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.floor(subtotal * (header.taxRate ?? 0.1));
  const grandTotal = subtotal + taxAmount;

  // Format currency with commas
  const formatNumber = (val: number) => val.toLocaleString();
  const cleanTel = (header.tel || '').replace(/^Tel\s*/i, '').trim();

  const sheetContent = (
    <div
      id={`${idPrefix}estimate-page-1`}
      className="estimate-sheet w-[820px] min-w-[820px] min-h-[1100px] h-[1120px] mx-auto bg-white p-8 sm:p-10 border border-slate-300 text-black text-[12px] leading-tight select-none flex flex-col justify-between page-break shrink-0"
    >
      {/* 1. Header Title & Top Right Date */}
      <div className="relative mb-3 pt-1">
          <div className="text-center">
            <span className="text-2xl font-bold tracking-[1em] border-b-4 border-double border-black pb-1 pl-4 inline-block font-serif">
              見　積　書
            </span>
          </div>
          <div className="text-right text-xs font-mono sm:absolute sm:right-0 sm:top-1 mt-2 sm:mt-0">
            <div>
              {header.dateYear} 年 {header.dateMonth} 月 {header.dateDay} 日
            </div>
            <div className="mt-0.5">
              見積番号　{header.estimateNumber}
            </div>
          </div>
        </div>

        {/* 2. Upper Block: Client, Conditions & Total (Left) vs Issuer Info & Stamp Box (Right) */}
        <div className="grid grid-cols-12 gap-4 mb-3">
          {/* Left Column: Customer, Greeting, 5 Conditions, Total Amount (7 cols) */}
          <div className="col-span-7 pr-2 flex flex-col justify-between">
            <div>
              {/* Customer Name with double bottom border */}
              <div className="border-b-4 border-double border-black pb-1 mb-2">
                <span className="text-lg font-bold tracking-wider inline-block">
                  {header.customerName || '　'}
                </span>
              </div>

              {/* Reference Document Line */}
              <div className="text-[11px] text-gray-700 mb-1 pl-4">
                {header.referenceDateInfo ?? '　　年　　月　　日付　　第　　　　号'}
              </div>

              {/* Greeting text */}
              <div className="text-xs leading-normal mb-2 text-gray-900">
                <div>{header.greetingLine1 ?? 'ご照会に対し下記のとおりお見積申し上げます。'}</div>
                <div>{header.greetingLine2 ?? '何卒ご用命賜わりますよう願い上げます。'}</div>
              </div>

              {/* 5 Conditions with dashed underlines */}
              <div className="border-t border-dashed border-black/80 text-xs">
                <div className="border-b border-dashed border-black/80 py-0.5 flex items-center">
                  <span className="w-24 shrink-0 font-medium tracking-widest">受 渡 場 所</span>
                  <span className="truncate">{header.deliveryPlace ?? '貴社指定場所'}</span>
                </div>
                <div className="border-b border-dashed border-black/80 py-0.5 flex items-center">
                  <span className="w-24 shrink-0 font-medium tracking-widest">受 渡 期 間</span>
                  <span className="truncate">{header.deliveryPeriod ?? 'お打ち合わせの上'}</span>
                </div>
                <div className="border-b border-dashed border-black/80 py-0.5 flex items-center">
                  <span className="w-24 shrink-0 font-medium tracking-widest">施 工 条 件</span>
                  <span className="truncate">{header.constructionTerms ?? '土・日・祝日を除く平日昼間施工'}</span>
                </div>
                <div className="border-b border-dashed border-black/80 py-0.5 flex items-center">
                  <span className="w-24 shrink-0 font-medium tracking-tight">見積有効期間</span>
                  <span className="truncate">{header.validityPeriod ?? '発行日より１ヶ月間'}</span>
                </div>
                <div className="border-b border-dashed border-black/80 py-0.5 flex items-center">
                  <span className="w-24 shrink-0 font-medium tracking-tight">お支払い条件</span>
                  <span className="truncate">{header.paymentTerms ?? '工事完了後現金でお支払い賜わり度'}</span>
                </div>
              </div>
            </div>

            {/* Grand Total Amount Box with double bottom underline as in Image */}
            <div className="mt-2.5 border-b-4 border-double border-black pb-0.5 flex items-baseline justify-between px-1 font-serif">
              <div className="flex items-baseline gap-4">
                <span className="text-sm font-bold tracking-[0.4em]">総　額</span>
                <span className="text-2xl font-bold font-mono tracking-tight">
                  ¥{formatNumber(grandTotal)}.-
                </span>
              </div>
              <span className="text-xs text-gray-800">
                (消費税込)
              </span>
            </div>
          </div>

          {/* Right Column: Issuer Info & Approval Box (5 cols) matching Image 3 */}
          <div className="col-span-5 flex flex-col justify-between items-end pl-2">
            {/* Issuer Information matching Image 3 layout */}
            <div className="text-xs leading-relaxed text-black text-left w-fit font-sans">
              <div className="font-mono">{header.postalCode}</div>
              <div>{header.address1}</div>
              {header.address2 && <div>{header.address2}</div>}
              <div className="font-mono pl-8 sm:pl-10 my-0.5 text-black">
                Tel  {cleanTel}
              </div>
              <div className="font-bold text-sm tracking-wider text-black mt-1">
                {header.companyName}
              </div>
              {header.branchName && (
                <div className="text-xs font-medium text-black">
                  {header.branchName}
                </div>
              )}
              <div className="flex items-center gap-6 text-xs pl-8 sm:pl-10 mt-1">
                <span className="font-medium text-black">
                  {header.representativeTitle}
                </span>
                <span className="font-bold text-black">
                  {header.representativeName}
                </span>
              </div>
            </div>

            {/* Stamp / Approval Seal Box (3 Cells: 担当 on right) */}
            <div className="mt-3 flex justify-end">
              <table className="border-collapse border-2 border-black text-center text-xs w-56">
                <tbody>
                  <tr className="border-b border-black h-6 bg-gray-50/40">
                    <td className="border-r border-black w-1/3">
                      {header.stamp1Title || ''}
                    </td>
                    <td className="border-r border-black w-1/3">
                      {header.stamp2Title || ''}
                    </td>
                    <td className="w-1/3 text-gray-800 font-medium">
                      {header.stamp3Title || '担　当'}
                    </td>
                  </tr>
                  <tr className="h-16">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Main Items Table (項目 | 件名 | 単価 | 数量 | 金額) matching image.png */}
        <div className="border-2 border-black flex-1 flex flex-col mt-2 min-h-[620px]">
          <table className="w-full h-full border-collapse text-[11px] flex-1">
            <thead>
              <tr className="border-b-2 border-black text-center font-medium bg-gray-50/20">
                <th className="border-r border-black py-1.5 w-14 shrink-0 whitespace-nowrap text-center">項目</th>
                <th className="border-r border-black py-1.5 px-3 min-w-[260px] text-center whitespace-nowrap">件　　　　　　名</th>
                <th className="border-r border-black py-1.5 w-24 shrink-0 whitespace-nowrap text-center">単　　価</th>
                <th className="border-r border-black py-1.5 w-20 shrink-0 whitespace-nowrap text-center">数　量</th>
                <th className="py-1.5 w-32 shrink-0 whitespace-nowrap text-center">金　　額</th>
              </tr>
            </thead>
            <tbody>
              {/* Subheader: 案件分類 / 作業件名 */}
              <tr>
                <td className="border-r border-black py-1"></td>
                <td className="border-r border-black py-1 px-3">
                  <div className="font-semibold">{header.projectCategory ?? '本案件内訳'}</div>
                  <div className="pl-4 font-medium">{header.projectSubject ?? '昇降機機能維持修理'}</div>
                </td>
                <td className="border-r border-black py-1"></td>
                <td className="border-r border-black py-1"></td>
                <td className="py-1"></td>
              </tr>

              {/* List of Main Items:
                  - 項目, 件名, 単価 columns have NO horizontal borders between items!
                  - 数量 and 金額 columns have solid horizontal borders under each item! */}
              {items.map((item, idx) => (
                <tr key={item.id} className="h-6.5">
                  <td className="border-r border-black py-0.5 text-center font-mono whitespace-nowrap">
                    {idx + 1}.
                  </td>
                  <td className="border-r border-black py-0.5 px-3 font-medium whitespace-nowrap">
                    {item.title}
                  </td>
                  <td className="border-r border-black py-0.5"></td>
                  <td className="border-r border-black border-b border-black py-0.5 text-center font-mono whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border-b border-black py-0.5 text-right font-mono pr-3 font-medium whitespace-nowrap">
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              ))}

              {/* Summary Rows directly below item 9 */}
              <tr className="h-6.5">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black border-b border-black py-0.5 px-2 text-center font-medium">
                  合　　計
                </td>
                <td className="border-b border-black py-0.5 text-right font-mono pr-3 font-medium">
                  {formatNumber(subtotal)}
                </td>
              </tr>

              <tr className="h-6.5">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black border-b border-black py-0.5 px-2 text-center font-medium">
                  消費税額
                </td>
                <td className="border-b border-black py-0.5 text-right font-mono pr-3 font-medium">
                  {formatNumber(taxAmount)}
                </td>
              </tr>

              <tr className="h-6.5">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black border-b border-black py-0.5 px-2 text-center font-bold">
                  総　　計
                </td>
                <td className="border-b border-black py-0.5 text-right font-mono pr-3 font-bold">
                  ¥{formatNumber(grandTotal)}
                </td>
              </tr>

              <tr className="h-10">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="py-2 text-center tracking-[1em] font-medium text-xs">
                  以　　上
                </td>
              </tr>

              {/* Remaining space extending down to the bottom border of the table */}
              <tr className="h-full">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  );

  if (disableResponsive) {
    return sheetContent;
  }

  return <ResponsiveA4Container className="w-full max-w-full">{sheetContent}</ResponsiveA4Container>;
};
