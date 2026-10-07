/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EstimateItem, LineSubDetail, MaterialDetailItem } from '../types/estimate';

export const FIXED_TRANSPORT_FEE = 3000;
export const OVERHEAD_RATE = 0.2; // 20%

/**
 * 内部処理計算式:
 * 運搬交通費 ＝ 3,000円（固定）
 * 諸経費 ＝ (材料費 + 取替調整費) × 0.2
 * 計 ＝ 材料費 + 取替調整費 + 運搬交通費 + 諸経費
 */
export function calculateBreakdown(
  materialAmount: number,
  replacementLaborAmount: number,
  transportAmount: number = FIXED_TRANSPORT_FEE
) {
  const safeMaterial = Math.max(0, Math.floor(materialAmount || 0));
  const safeLabor = Math.max(0, Math.floor(replacementLaborAmount || 0));
  const safeTransport = Math.max(0, Math.floor(transportAmount));
  
  // 諸経費 ＝ (材料費 + 取替調整費) × 0.2
  const overheadAmount = Math.round((safeMaterial + safeLabor) * OVERHEAD_RATE);
  
  // 計 ＝ 材料費 + 取替調整費 + 運搬交通費 + 諸経費
  const totalAmount = safeMaterial + safeLabor + safeTransport + overheadAmount;

  return {
    materialAmount: safeMaterial,
    replacementLaborAmount: safeLabor,
    transportAmount: safeTransport,
    overheadAmount,
    totalAmount,
  };
}

/**
 * 材料詳細リストの正規化（後方互換性対応）
 * materials / materialNames / materialName のいずれの形式でも
 * 品名・数量・単位・単価・金額を備えた配列に変換
 */
export function getNormalizedMaterials(b: LineSubDetail): MaterialDetailItem[] {
  if (b.materials && b.materials.length > 0) {
    return b.materials.map((m, idx) => {
      const qty = m.quantity ?? 1;
      const amount = m.amount ?? (m.unitPrice !== undefined ? m.unitPrice * qty : 0);
      const unitPrice = m.unitPrice ?? (qty > 0 ? Math.round(amount / qty) : amount);
      return {
        id: m.id || `mat-${idx}-${Date.now()}`,
        name: m.name || `材料 #${idx + 1}`,
        quantity: qty,
        unit: m.unit || '式',
        unitPrice,
        amount,
      };
    });
  }

  // If old materialNames array exists
  if (b.materialNames && b.materialNames.length > 0) {
    const validNames = b.materialNames.filter((n) => n && n.trim().length > 0);
    if (validNames.length > 1) {
      const count = validNames.length;
      const baseAmount = Math.floor(b.materialAmount / count);
      return validNames.map((name, idx) => {
        const amt = idx === count - 1 ? b.materialAmount - baseAmount * (count - 1) : baseAmount;
        return {
          id: `mat-migrated-${idx}`,
          name,
          quantity: 1,
          unit: b.materialUnit || '式',
          unitPrice: amt,
          amount: amt,
        };
      });
    } else if (validNames.length === 1) {
      return [
        {
          id: 'mat-migrated-0',
          name: validNames[0],
          quantity: b.materialQuantity ?? 1,
          unit: b.materialUnit || '式',
          unitPrice: b.materialUnitPrice ?? b.materialAmount,
          amount: b.materialAmount,
        },
      ];
    }
  }

  // Fallback to single material
  const singleName = b.materialName?.trim() || '材料一式';
  return [
    {
      id: 'mat-single-0',
      name: singleName,
      quantity: b.materialQuantity ?? 1,
      unit: b.materialUnit || '式',
      unitPrice: b.materialUnitPrice ?? b.materialAmount,
      amount: b.materialAmount,
    },
  ];
}

/**
 * 工事項目の作成ヘルパー
 */
export function createEstimateItem(params: {
  id?: string;
  itemNumber: number;
  title: string;
  quantity?: number;
  unit?: string;
  materialName?: string;
  materialNames?: string[];
  materials?: MaterialDetailItem[];
  materialAmount?: number;
  replacementLaborAmount: number;
  materialUnitPrice?: number;
  materialQuantity?: number;
  materialUnit?: string;
  overrideTotalAmount?: number;
}): EstimateItem {
  const quantity = params.quantity ?? 1;
  const unit = params.unit || '式';

  // Normalize materials
  let normalizedMaterials: MaterialDetailItem[] = [];
  if (params.materials && params.materials.length > 0) {
    normalizedMaterials = params.materials.map((m, idx) => {
      const qty = m.quantity > 0 ? m.quantity : 1;
      const amount = m.amount !== undefined ? m.amount : (m.unitPrice !== undefined ? m.unitPrice * qty : 0);
      const unitPrice = m.unitPrice !== undefined ? m.unitPrice : (qty > 0 ? Math.round(amount / qty) : amount);
      return {
        id: m.id || `mat-${Date.now()}-${idx}`,
        name: m.name || `材料 #${idx + 1}`,
        quantity: qty,
        unit: m.unit || '式',
        unitPrice,
        amount,
      };
    });
  } else {
    // Check materialNames or materialName
    let names: string[] = [];
    if (params.materialNames && params.materialNames.length > 0) {
      names = params.materialNames.map((n) => n.trim()).filter((n) => n.length > 0);
    }
    if (names.length === 0) {
      const fallbackName = params.materialName?.trim() || (params.title ? `${params.title} 部品・部材` : '材料一式');
      names = [fallbackName];
    }

    const defaultAmount = params.materialAmount ?? 0;
    if (names.length > 1) {
      const count = names.length;
      const baseAmt = Math.floor(defaultAmount / count);
      normalizedMaterials = names.map((name, idx) => {
        const amt = idx === count - 1 ? defaultAmount - baseAmt * (count - 1) : baseAmt;
        return {
          id: `mat-${idx}`,
          name,
          quantity: 1,
          unit: params.materialUnit || '式',
          unitPrice: amt,
          amount: amt,
        };
      });
    } else {
      normalizedMaterials = [
        {
          id: `mat-0`,
          name: names[0],
          quantity: params.materialQuantity ?? 1,
          unit: params.materialUnit || '式',
          unitPrice: params.materialUnitPrice ?? defaultAmount,
          amount: defaultAmount,
        },
      ];
    }
  }

  // 集計: 材料費 ＝ 各材料の金額合計 (materialsが指定されている場合、その合計を集計対象とする)
  const aggregatedMaterialAmount = normalizedMaterials.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );
  const finalMaterialAmount =
    params.materials && params.materials.length > 0
      ? aggregatedMaterialAmount
      : params.materialAmount ?? aggregatedMaterialAmount;

  const calc = calculateBreakdown(finalMaterialAmount, params.replacementLaborAmount);

  const primaryMaterial = normalizedMaterials[0];
  const names = normalizedMaterials.map((m) => m.name);

  const breakdown: LineSubDetail = {
    materialName: primaryMaterial?.name || '材料一式',
    materialNames: names,
    materials: normalizedMaterials,
    materialUnitPrice: primaryMaterial?.unitPrice ?? calc.materialAmount,
    materialQuantity: primaryMaterial?.quantity ?? 1,
    materialUnit: primaryMaterial?.unit ?? unit,
    materialAmount: calc.materialAmount,
    replacementLaborAmount: calc.replacementLaborAmount,
    transportAmount: calc.transportAmount,
    overheadAmount: calc.overheadAmount,
  };

  return {
    id: params.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    itemNumber: params.itemNumber,
    title: params.title,
    quantity,
    unit,
    unitPrice: params.overrideTotalAmount ?? calc.totalAmount,
    amount: params.overrideTotalAmount ?? calc.totalAmount,
    breakdown,
  };
}

/**
 * ドロップダウン用工事項目マスタ
 */
export interface ConstructionPreset {
  id: string;
  title: string;
  defaultMaterialName: string;
  defaultMaterialAmount: number;
  defaultLaborAmount: number;
  defaultUnit: string;
}

export const PRESET_CONSTRUCTION_ITEMS: ConstructionPreset[] = [
  {
    id: 'p-1',
    title: 'ブレーキ組立取替',
    defaultMaterialName: '電磁ブレーキコイル組立',
    defaultMaterialAmount: 262000,
    defaultLaborAmount: 106000,
    defaultUnit: '式',
  },
  {
    id: 'p-2',
    title: '巻上機ギヤオイル取替',
    defaultMaterialName: 'エレベーターオイル (NO. 61)',
    defaultMaterialAmount: 6100,
    defaultLaborAmount: 46000,
    defaultUnit: '缶',
  },
  {
    id: 'p-3',
    title: 'カゴドア連動 (STS) ベルト取替',
    defaultMaterialName: 'STSタイミングベルト組立',
    defaultMaterialAmount: 30000,
    defaultLaborAmount: 30000,
    defaultUnit: '組',
  },
  {
    id: 'p-4',
    title: 'STSプーリ組立取替',
    defaultMaterialName: '従動プーリ組立',
    defaultMaterialAmount: 29000,
    defaultLaborAmount: 16000,
    defaultUnit: '個',
  },
  {
    id: 'p-5',
    title: 'ドアマシンモーター取替',
    defaultMaterialName: 'モータ組立',
    defaultMaterialAmount: 176000,
    defaultLaborAmount: 37400,
    defaultUnit: '個',
  },
  {
    id: 'p-6',
    title: '巻上ロープ取替',
    defaultMaterialName: '主索ロープ (12mm×5本組)',
    defaultMaterialAmount: 320000,
    defaultLaborAmount: 210000,
    defaultUnit: '組',
  },
  {
    id: 'p-7',
    title: '制御盤内基板取替',
    defaultMaterialName: 'メイン制御プリント基板',
    defaultMaterialAmount: 680000,
    defaultLaborAmount: 140000,
    defaultUnit: '枚',
  },
  {
    id: 'p-8',
    title: '停電時自動着床装置バッテリー取替',
    defaultMaterialName: '密閉型蓄電池パック (24V)',
    defaultMaterialAmount: 58000,
    defaultLaborAmount: 25000,
    defaultUnit: '組',
  },
  {
    id: 'p-9',
    title: 'かご上ステーション内基板取替',
    defaultMaterialName: 'かご上リレーユニット基板',
    defaultMaterialAmount: 110000,
    defaultLaborAmount: 35000,
    defaultUnit: '枚',
  },
  {
    id: 'p-10',
    title: 'ガイドシュー・ライナー取替',
    defaultMaterialName: 'ガイドシューライナー一式',
    defaultMaterialAmount: 48000,
    defaultLaborAmount: 32000,
    defaultUnit: '組',
  },
  {
    id: 'p-11',
    title: 'ドアハンガーローラー取替・調整',
    defaultMaterialName: 'ドアハンガーベアリングローラー一式',
    defaultMaterialAmount: 38000,
    defaultLaborAmount: 28000,
    defaultUnit: '箇所',
  },
  {
    id: 'p-12',
    title: '調速機（ガバナ）点検・シーブ調整',
    defaultMaterialName: '調速機消耗部品セット',
    defaultMaterialAmount: 65000,
    defaultLaborAmount: 45000,
    defaultUnit: '式',
  },
  {
    id: 'p-13',
    title: 'インバータユニット交換',
    defaultMaterialName: 'VVVFインバータユニット',
    defaultMaterialAmount: 450000,
    defaultLaborAmount: 95000,
    defaultUnit: '台',
  },
  {
    id: 'custom',
    title: 'その他（直接入力）',
    defaultMaterialName: '資材・部材一式',
    defaultMaterialAmount: 50000,
    defaultLaborAmount: 30000,
    defaultUnit: '式',
  },
];

const PRESETS_STORAGE_KEY = 'estimate_construction_presets_v3';

export function getSavedPresets(): ConstructionPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: ConstructionPreset) => {
          let title = p.title ? p.title.replace(/3T3|３Ｔ３|３T３/g, 'STS') : p.title;
          let mat = p.defaultMaterialName
            ? p.defaultMaterialName.replace(/3T3|３Ｔ３|３T３/g, 'STS')
            : p.defaultMaterialName;

          if (mat === '従動・駆動プーリ組立') mat = '従動プーリ組立';
          if (mat === 'ドア駆動モーター組立') mat = 'モータ組立';
          if (mat === 'エレベーターギヤオイル (No.61)') mat = 'エレベーターオイル (NO. 61)';
          if (mat === 'メインマイクロコンピュータ制御基板') mat = 'メイン制御プリント基板';

          return {
            ...p,
            title,
            defaultMaterialName: mat,
          };
        });
      }
    }
  } catch (e) {
    // ignore
  }
  return PRESET_CONSTRUCTION_ITEMS;
}

export function savePresets(presets: ConstructionPreset[]) {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    // ignore
  }
}

