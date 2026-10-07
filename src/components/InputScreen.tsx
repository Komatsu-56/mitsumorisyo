/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EstimateHeaderData, EstimateItem, MaterialDetailItem } from '../types/estimate';
import {
  Plus,
  Trash2,
  Calculator,
  ArrowUp,
  ArrowDown,
  Copy,
  Printer,
  FileText,
  ListOrdered,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Undo2,
  X,
  Settings,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  calculateBreakdown,
  createEstimateItem,
  getNormalizedMaterials,
  ConstructionPreset,
  getSavedPresets,
  FIXED_TRANSPORT_FEE,
  OVERHEAD_RATE,
} from '../utils/estimateCalculations';
import { INITIAL_HEADER_DATA, INITIAL_ITEMS } from '../data/sampleEstimate';
import { ITEMS_PER_BREAKDOWN_PAGE } from './SampleSheet2';
import { PresetManagerModal } from './PresetManagerModal';
import { ViewMode } from './TopNav';

interface InputScreenProps {
  header: EstimateHeaderData;
  setHeader: React.Dispatch<React.SetStateAction<EstimateHeaderData>>;
  items: EstimateItem[];
  setItems: React.Dispatch<React.SetStateAction<EstimateItem[]>>;
  onGoToPreview: (mode: ViewMode) => void;
  onExportPdf: () => void;
  onPrint: () => void;
  isGeneratingPdf?: boolean;
}

export const InputScreen: React.FC<InputScreenProps> = ({
  header,
  setHeader,
  items,
  setItems,
  onGoToPreview,
  onExportPdf,
  onPrint,
  isGeneratingPdf = false,
}) => {

  // Dynamic presets state for dropdown
  const [presets, setPresets] = useState<ConstructionPreset[]>(() => getSavedPresets());
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);

  // New item form state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() =>
    presets.length > 0 ? presets[0].id : 'custom'
  );
  const [formTitle, setFormTitle] = useState<string>(() =>
    presets.length > 0 ? presets[0].title : ''
  );
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnit, setFormUnit] = useState<string>(() =>
    presets.length > 0 ? presets[0].defaultUnit : '式'
  );

  // Multiple materials for the new item form (品名・数量・単位・単価・金額・集計連動)
  const initialPreset = presets.length > 0 ? presets[0] : null;
  const [formMaterials, setFormMaterials] = useState<MaterialDetailItem[]>(() => [
    {
      id: 'form-mat-1',
      name: initialPreset ? initialPreset.defaultMaterialName : '材料一式',
      quantity: 1,
      unit: initialPreset ? initialPreset.defaultUnit : '式',
      unitPrice: initialPreset ? initialPreset.defaultMaterialAmount : 50000,
      amount: initialPreset ? initialPreset.defaultMaterialAmount : 50000,
    },
  ]);

  const [formLaborAmount, setFormLaborAmount] = useState<number>(() =>
    presets.length > 0 ? presets[0].defaultLaborAmount : 30000
  );

  // User feedback states (No window.alert / window.confirm)
  const [justAddedTitle, setJustAddedTitle] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; title: string } | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ item: EstimateItem; index: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // 材料費の集計: 各材料の金額(amount)の合算
  const formMaterialTotal = formMaterials.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );

  // Live calculation for the new item form (材料費集計 + 取替調整費 + 交通費3,000円 + 諸経費20%)
  const newCalc = calculateBreakdown(formMaterialTotal, formLaborAmount);

  // Grand total calculations
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = Math.floor(subtotal * (header.taxRate || 0.1));
  const grandTotal = subtotal + taxAmount;
  const breakdownPageCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_BREAKDOWN_PAGE));

  // Handle preset dropdown change
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      if (preset.id !== 'custom') {
        setFormTitle(preset.title);
      } else {
        setFormTitle('');
      }
      setFormMaterials([
        {
          id: `form-mat-${Date.now()}`,
          name: preset.defaultMaterialName,
          quantity: 1,
          unit: preset.defaultUnit,
          unitPrice: preset.defaultMaterialAmount,
          amount: preset.defaultMaterialAmount,
        },
      ]);
      setFormLaborAmount(preset.defaultLaborAmount);
      setFormUnit(preset.defaultUnit);
    }
  };

  // Add Material in New Form
  const handleAddFormMaterial = () => {
    setFormMaterials((prev) => [
      ...prev,
      {
        id: `form-mat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: '',
        quantity: 1,
        unit: formUnit || '個',
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const handleUpdateFormMaterial = (
    index: number,
    field: keyof MaterialDetailItem,
    value: any
  ) => {
    setFormMaterials((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      if (field === 'quantity') {
        const q = Math.max(1, Number(value) || 1);
        target.quantity = q;
        target.amount = q * (target.unitPrice || 0);
      } else if (field === 'unitPrice') {
        const up = Math.max(0, Number(value) || 0);
        target.unitPrice = up;
        target.amount = (target.quantity || 1) * up;
      } else if (field === 'amount') {
        const a = Math.max(0, Number(value) || 0);
        target.amount = a;
        if (target.quantity > 0) {
          target.unitPrice = Math.round(a / target.quantity);
        }
      } else if (field === 'name') {
        target.name = value;
      } else if (field === 'unit') {
        target.unit = value;
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveFormMaterial = (index: number) => {
    setFormMaterials((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0
        ? filtered
        : [
            {
              id: `form-mat-${Date.now()}`,
              name: '',
              quantity: 1,
              unit: '式',
              unitPrice: 0,
              amount: 0,
            },
          ];
    });
  };

  // Add Item to Estimate
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formTitle.trim() || '新規工事項目';
    const validMaterials = formMaterials.filter(
      (m) => (m.name && m.name.trim().length > 0) || m.amount > 0
    );

    const materialsToSave: MaterialDetailItem[] =
      validMaterials.length > 0
        ? validMaterials
        : [
            {
              id: `mat-${Date.now()}`,
              name: `${finalTitle} 部材一式`,
              quantity: 1,
              unit: formUnit || '式',
              unitPrice: formMaterialTotal,
              amount: formMaterialTotal,
            },
          ];

    const newItem = createEstimateItem({
      itemNumber: items.length + 1,
      title: finalTitle,
      quantity: formQuantity > 0 ? formQuantity : 1,
      unit: formUnit || '式',
      materials: materialsToSave,
      materialAmount: formMaterialTotal,
      replacementLaborAmount: formLaborAmount,
    });

    setItems((prev) => [...prev, newItem]);
    setJustAddedTitle(finalTitle);
    setTimeout(() => setJustAddedTitle(null), 3000);
  };

  // live sync check: 材料費合計は必ず品名の集計額と一致するように自動同期
  React.useEffect(() => {
    let hasDiscrepancy = false;
    const sanitized = items.map((item) => {
      const mats = getNormalizedMaterials(item.breakdown);
      const computedTotal = mats.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      if (item.breakdown.materialAmount !== computedTotal || !item.breakdown.materials) {
        hasDiscrepancy = true;
        const calc = calculateBreakdown(computedTotal, item.breakdown.replacementLaborAmount);
        return {
          ...item,
          amount: calc.totalAmount,
          unitPrice: calc.totalAmount,
          breakdown: {
            ...item.breakdown,
            materials: mats,
            materialName: mats[0]?.name || item.breakdown.materialName || '材料一式',
            materialNames: mats.map((m) => m.name),
            materialAmount: calc.materialAmount,
            replacementLaborAmount: calc.replacementLaborAmount,
            transportAmount: calc.transportAmount,
            overheadAmount: calc.overheadAmount,
          },
        };
      }
      return item;
    });

    if (hasDiscrepancy) {
      setItems(sanitized);
    }
  }, [items, setItems]);

  // Update existing item (材料費は常に品名リストの合算値から自動計算)
  const handleUpdateItemData = (
    index: number,
    _materialAmount: number,
    laborAmount: number,
    overrides?: Partial<EstimateItem>
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      const currentMats = getNormalizedMaterials(target.breakdown);
      const computedMaterialAmount = currentMats.reduce(
        (sum, m) => sum + (Number(m.amount) || 0),
        0
      );
      const calc = calculateBreakdown(computedMaterialAmount, laborAmount);

      target.breakdown = {
        ...target.breakdown,
        materials: currentMats,
        materialAmount: calc.materialAmount,
        replacementLaborAmount: calc.replacementLaborAmount,
        transportAmount: calc.transportAmount,
        overheadAmount: calc.overheadAmount,
      };
      target.amount = calc.totalAmount;
      target.unitPrice = calc.totalAmount;

      if (overrides) {
        Object.assign(target, overrides);
      }

      updated[index] = target;
      return updated;
    });
  };

  // Multiple materials handlers for registered items (集計対象)
  const handleAddItemMaterial = (itemIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[itemIndex] };
      const currentMats = getNormalizedMaterials(target.breakdown);
      const newMats: MaterialDetailItem[] = [
        ...currentMats,
        {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: '',
          quantity: 1,
          unit: target.unit || '個',
          unitPrice: 0,
          amount: 0,
        },
      ];

      const newMaterialAmount = newMats.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const calc = calculateBreakdown(newMaterialAmount, target.breakdown.replacementLaborAmount);

      target.breakdown = {
        ...target.breakdown,
        materials: newMats,
        materialNames: newMats.map((m) => m.name),
        materialName: newMats[0]?.name || '',
        materialAmount: calc.materialAmount,
        replacementLaborAmount: calc.replacementLaborAmount,
        transportAmount: calc.transportAmount,
        overheadAmount: calc.overheadAmount,
      };
      target.amount = calc.totalAmount;
      target.unitPrice = calc.totalAmount;

      copy[itemIndex] = target;
      return copy;
    });
  };

  const handleUpdateItemMaterial = (
    itemIndex: number,
    matIndex: number,
    field: keyof MaterialDetailItem,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[itemIndex] };
      const currentMats = [...getNormalizedMaterials(target.breakdown)];
      const mat = { ...currentMats[matIndex] };

      if (field === 'quantity') {
        const q = Math.max(1, Number(value) || 1);
        mat.quantity = q;
        mat.amount = q * (mat.unitPrice || 0);
      } else if (field === 'unitPrice') {
        const up = Math.max(0, Number(value) || 0);
        mat.unitPrice = up;
        mat.amount = (mat.quantity || 1) * up;
      } else if (field === 'amount') {
        const a = Math.max(0, Number(value) || 0);
        mat.amount = a;
        if (mat.quantity > 0) {
          mat.unitPrice = Math.round(a / mat.quantity);
        }
      } else if (field === 'name') {
        mat.name = value;
      } else if (field === 'unit') {
        mat.unit = value;
      }
      currentMats[matIndex] = mat;

      const newMaterialAmount = currentMats.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const calc = calculateBreakdown(newMaterialAmount, target.breakdown.replacementLaborAmount);

      target.breakdown = {
        ...target.breakdown,
        materials: currentMats,
        materialNames: currentMats.map((m) => m.name),
        materialName: currentMats[0]?.name || '',
        materialAmount: calc.materialAmount,
        replacementLaborAmount: calc.replacementLaborAmount,
        transportAmount: calc.transportAmount,
        overheadAmount: calc.overheadAmount,
      };
      target.amount = calc.totalAmount;
      target.unitPrice = calc.totalAmount;

      copy[itemIndex] = target;
      return copy;
    });
  };

  const handleRemoveItemMaterial = (itemIndex: number, matIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[itemIndex] };
      let currentMats = getNormalizedMaterials(target.breakdown).filter((_, i) => i !== matIndex);
      if (currentMats.length === 0) {
        currentMats = [
          {
            id: `mat-${Date.now()}`,
            name: `${target.title} 部材一式`,
            quantity: 1,
            unit: target.unit || '式',
            unitPrice: 0,
            amount: 0,
          },
        ];
      }
      const newMaterialAmount = currentMats.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const calc = calculateBreakdown(newMaterialAmount, target.breakdown.replacementLaborAmount);

      target.breakdown = {
        ...target.breakdown,
        materials: currentMats,
        materialNames: currentMats.map((m) => m.name),
        materialName: currentMats[0]?.name || '',
        materialAmount: calc.materialAmount,
        replacementLaborAmount: calc.replacementLaborAmount,
        transportAmount: calc.transportAmount,
        overheadAmount: calc.overheadAmount,
      };
      target.amount = calc.totalAmount;
      target.unitPrice = calc.totalAmount;

      copy[itemIndex] = target;
      return copy;
    });
  };

  // Request deletion (opens non-blocking in-app confirmation modal)
  const handleRequestDelete = (index: number) => {
    if (items.length <= 1) {
      setAlertMessage('見積書には最低1つの項目が必要です。');
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }
    setDeleteTarget({ index, title: items[index].title });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { index } = deleteTarget;
    const itemToDelete = items[index];

    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({ ...item, itemNumber: idx + 1 }));
    });

    setRecentlyDeleted({ item: itemToDelete, index });
    setDeleteTarget(null);

    setTimeout(() => {
      setRecentlyDeleted((curr) => (curr?.item.id === itemToDelete.id ? null : curr));
    }, 6000);
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    setItems((prev) => {
      const copy = [...prev];
      copy.splice(recentlyDeleted.index, 0, recentlyDeleted.item);
      return copy.map((item, idx) => ({ ...item, itemNumber: idx + 1 }));
    });
    setRecentlyDeleted(null);
  };

  // Move item
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, itemNumber: idx + 1 }));
    });
  };

  // Duplicate item (材料データも含めて完全複製)
  const handleDuplicateItem = (index: number) => {
    const orig = items[index];
    const origMats = getNormalizedMaterials(orig.breakdown);
    const duplicatedMats = origMats.map((m, mIdx) => ({
      ...m,
      id: `mat-${Date.now()}-${mIdx}-${Math.random().toString(36).substring(2, 5)}`,
    }));
    const duplicated: EstimateItem = {
      ...orig,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${orig.title} (複写)`,
      itemNumber: items.length + 1,
      breakdown: {
        ...orig.breakdown,
        materials: duplicatedMats,
        materialNames: duplicatedMats.map((m) => m.name),
        materialName: duplicatedMats[0]?.name || '材料一式',
      },
    };
    setItems((prev) => [...prev, duplicated]);
  };

  const handleResetSample = () => {
    setHeader(INITIAL_HEADER_DATA);
    setItems(INITIAL_ITEMS);
    setAlertMessage('サンプルデータ（初期値）に戻しました。');
    setTimeout(() => setAlertMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {alertMessage && (
        <div className="bg-amber-500 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="cursor-pointer p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

          {/* Undo Delete Toast Banner */}
          {recentlyDeleted && (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                <span>「{recentlyDeleted.item.title}」を削除しました。</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndoDelete}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded cursor-pointer transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  元に戻す
                </button>
                <button
                  onClick={() => setRecentlyDeleted(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 1. Header Card with Formula Guidelines */}
          <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-md">
                    項目・原価入力
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    工事項目登録・見積計算
                  </h2>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  工事項目（ドロップダウン選択）・数量・材料費・取替調整費を入力すると、運搬交通費(3,000円)・諸経費(20%)・計を自動算出します。材料品名は複数登録できます。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsPresetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  title="ドロップダウンの項目選択肢を追加・削除"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  選択肢マスタ管理
                </button>
                <button
                  onClick={handleResetSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  初期見本に戻す
                </button>
              </div>
            </div>

            {/* Formula Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  1. 運搬交通費 (交通費)
                </span>
                <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  ¥3,000 円
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  各項目に自動算定
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  2. 諸経費
                </span>
                <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">
                  (材料費 ＋ 取替調整費) × 0.2
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  材料費と取替調整費の合計の20%を自動算出
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  3. 各項目 計（小計）
                </span>
                <div className="text-sm font-bold text-blue-700 font-mono mt-0.5">
                  材料 ＋ 取替 ＋ 交通 ＋ 諸経費
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  4要素を合算して項目金額および表紙へ連動
                </div>
              </div>
            </div>
          </div>

          {/* 2. New Item Input Form (新規工事項目 入力フォーム) */}
          <div className="bg-white rounded-xl border-2 border-blue-400 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  ＋
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    【新規入力】 工事項目の追加
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    工事項目を選択または入力し、数量・材料費・取替調整費・材料品名を入力してください
                  </p>
                </div>
              </div>

              {justAddedTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  「{justAddedTitle}」を追加しました
                </div>
              )}
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              {/* Row 1: Dropdown & Title + Dropdown Options Manager Button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      工事項目（ドロップダウン選択）<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPresetModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="ドロップダウンの項目選択肢を追加・削除"
                    >
                      <Settings className="w-3 h-3" />
                      選択肢を管理（追加/削除）
                    </button>
                  </div>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    件名・名称（直接調整・自由入力）
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    placeholder="工事項目名を入力"
                    required
                  />
                </div>
              </div>

              {/* Row 2: 数量, 単位, 材料費, 取替調整費 */}
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
                {/* 数量 */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    数量 <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value) || 1)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                    required
                  />
                </div>

                {/* 単位 */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    単位
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="式">式</option>
                    <option value="箇所">箇所</option>
                    <option value="台">台</option>
                    <option value="個">個</option>
                    <option value="組">組</option>
                    <option value="枚">枚</option>
                    <option value="缶">缶</option>
                    <option value="セット">セット</option>
                  </select>
                </div>

                {/* 材料費（集計値表示） */}
                <div className="col-span-1 sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      材料費 合計（円） <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">下部内訳と連動</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formMaterialTotal}
                    readOnly
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-right text-blue-950 cursor-not-allowed"
                    title="下部の材料一覧の金額合計から自動計算されます"
                  />
                </div>

                {/* 取替調整費 */}
                <div className="col-span-1 sm:col-span-3">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    取替調整費（円） <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formLaborAmount}
                    onChange={(e) => setFormLaborAmount(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Multiple materials with 品名, 数量, 単位, 単価, 金額 in New Item Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      材料品名・構成部品（複数登録・数量／単位／単価／金額 集計連動）
                    </label>
                    <p className="text-[11px] text-slate-500">
                      品名だけでなく数量・単位・金額を登録でき、各材料の金額合計が材料費として集計されます。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFormMaterial}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    材料品名を追加
                  </button>
                </div>

                <div className="space-y-2">
                  {formMaterials.map((mat, idx) => (
                    <div
                      key={mat.id || idx}
                      className="bg-white p-2.5 rounded-lg border border-slate-300 shadow-2xs grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono w-5 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => handleUpdateFormMaterial(idx, 'name', e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-blue-500"
                          placeholder={idx === 0 ? '材料品名（例: 電磁ブレーキコイル）' : '追加材料・部材名'}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 shrink-0">数量:</span>
                        <input
                          type="number"
                          min="1"
                          value={mat.quantity}
                          onChange={(e) => handleUpdateFormMaterial(idx, 'quantity', e.target.value)}
                          className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-medium focus:bg-white"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 shrink-0">単位:</span>
                        <input
                          type="text"
                          value={mat.unit}
                          onChange={(e) => handleUpdateFormMaterial(idx, 'unit', e.target.value)}
                          className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white"
                          placeholder="個/組/式"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 shrink-0">単価:</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={mat.unitPrice || 0}
                          onChange={(e) => handleUpdateFormMaterial(idx, 'unitPrice', e.target.value)}
                          className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-right font-mono focus:bg-white"
                        />
                      </div>

                      <div className="col-span-10 sm:col-span-2 flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">金額:</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={mat.amount || 0}
                          onChange={(e) => handleUpdateFormMaterial(idx, 'amount', e.target.value)}
                          className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-blue-200 rounded text-right font-mono font-bold text-blue-900 focus:bg-white"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-12 sm:col-span-auto flex justify-end">
                        {formMaterials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFormMaterial(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer rounded hover:bg-slate-100"
                            title="この材料を削除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600">
                  <span className="text-[11px]">
                    登録材料: <strong>{formMaterials.length}件</strong>
                  </span>
                  <div className="font-mono">
                    <span className="text-slate-500 font-sans mr-1">材料費 合計（集計結果）:</span>
                    <span className="text-sm font-bold text-blue-700">¥{formMaterialTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Live 4-line calculation card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white">4行展開 自動計算結果プレビュー</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-medium">
                    式：材料費(集計) + 取替調整費 + 運搬交通費(3,000円) + 諸経費(20%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-slate-800/90 p-2.5 rounded-lg">
                    <div className="text-slate-400 text-[10px]">① 材料費（集計）</div>
                    <div className="font-mono font-bold text-white text-sm mt-1">
                      ¥{newCalc.materialAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-800/90 p-2.5 rounded-lg">
                    <div className="text-slate-400 text-[10px]">② 取替調整費</div>
                    <div className="font-mono font-bold text-white text-sm mt-1">
                      ¥{newCalc.replacementLaborAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-800/90 p-2.5 rounded-lg border border-emerald-500/40">
                    <div className="text-emerald-300 text-[10px]">③ 交通費</div>
                    <div className="font-mono font-bold text-emerald-400 text-sm mt-1">
                      ¥{newCalc.transportAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-800/90 p-2.5 rounded-lg border border-amber-500/40">
                    <div className="text-amber-300 text-[10px]">④ 諸経費（20%）</div>
                    <div className="font-mono font-bold text-amber-400 text-sm mt-1">
                      ¥{newCalc.overheadAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 bg-blue-600 p-2.5 rounded-lg text-white font-bold flex flex-col justify-center">
                    <div className="text-blue-100 text-[10px]">項目 計（小計）</div>
                    <div className="font-mono text-base mt-0.5">
                      ¥{newCalc.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  この工事項目を見積書に追加する
                </button>
              </div>
            </form>
          </div>

          {/* 3. Items Management Table (登録済み工事項目一覧・削除・変更) */}
          <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  登録中の工事項目一覧（{items.length}件）
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                  内訳明細書: 全{breakdownPageCount}ページ（A4各5項目展開）
                </span>
              </div>

              <div className="text-xs flex items-center gap-3">
                <span className="text-slate-500">
                  税抜合計:{' '}
                  <strong className="text-slate-900 font-mono text-sm">
                    ¥{subtotal.toLocaleString()}
                  </strong>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">
                  税込御見積総額:{' '}
                  <strong className="text-blue-700 font-mono text-sm">
                    ¥{grandTotal.toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const b = item.breakdown;
                const assignedPage = Math.floor(index / ITEMS_PER_BREAKDOWN_PAGE) + 1;
                const itemMaterials = getNormalizedMaterials(b);
                const itemMaterialsTotal = itemMaterials.reduce(
                  (sum, m) => sum + (Number(m.amount) || 0),
                  0
                );

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all shadow-xs space-y-3 relative"
                  >
                    {/* Header row: Index badge, Title, Page badge, Action Buttons */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleUpdateItemData(index, b.materialAmount, b.replacementLaborAmount, {
                              title: e.target.value,
                            })
                          }
                          className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg flex-1 focus:outline-blue-500"
                          placeholder="工事項目件名"
                        />
                        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline-block">
                          (内訳書 {assignedPage}頁目)
                        </span>
                      </div>

                      {/* Actions: Move, Duplicate, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer rounded hover:bg-slate-200"
                          title="上へ移動"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer rounded hover:bg-slate-200"
                          title="下へ移動"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer rounded hover:bg-slate-200"
                          title="項目を複写"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(index)}
                          className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 cursor-pointer rounded transition-colors ml-1 border border-red-200"
                          title="この項目を削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Input Fields Row: 数量, 単位, 材料費, 取替調整費 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium h-5 flex items-center pt-1.5 mb-1">
                          数量・単位
                        </span>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItemData(
                                index,
                                b.materialAmount,
                                b.replacementLaborAmount,
                                {
                                  quantity: Number(e.target.value) || 1,
                                }
                              )
                            }
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-center font-bold"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              handleUpdateItemData(
                                index,
                                b.materialAmount,
                                b.replacementLaborAmount,
                                {
                                  unit: e.target.value,
                                }
                              )
                            }
                            className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded text-center font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1 h-5 pt-1.5">
                          <span className="text-[10px] text-slate-700 font-bold">
                            材料費 合計（円）
                          </span>
                          <span className="text-[9px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            品名集計（自動計算）
                          </span>
                        </div>
                        <input
                          type="number"
                          value={itemMaterialsTotal}
                          readOnly
                          onClick={() => {
                            setAlertMessage(
                              '材料費合計は下部の材料品名・金額の集計額から自動計算されます。金額を変更する場合は下の材料品名の金額または単価を編集してください。'
                            );
                            setTimeout(() => setAlertMessage(null), 4000);
                          }}
                          className="w-full px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-right font-bold text-blue-950 cursor-not-allowed select-none"
                          title="材料費合計は必ず下の材料品名の集計額となります。変更は下の「材料品名」欄で行ってください。"
                        />
                        <p className="text-[9px] text-slate-500 mt-0.5 text-right">
                          ※下の品名・金額の集計額と自動一致
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-medium h-5 flex items-center pt-1.5 mb-1">
                          取替調整費（円）
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={b.replacementLaborAmount}
                          onChange={(e) =>
                            handleUpdateItemData(
                              index,
                              b.materialAmount,
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-right font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Multiple Material Items Section for this item (品名・数量・単位・単価・金額 集計連動) */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            材料品名・構成部品（複数登録・数量／単位／単価／金額 集計連動）
                          </span>
                          <span className="text-[10px] text-slate-500">
                            各材料の金額が集計され、本項目の材料費および見積総額に連動します
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddItemMaterial(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                          材料品名を追加
                        </button>
                      </div>

                      <div className="space-y-2">
                        {itemMaterials.map((mat, mIdx) => (
                          <div
                            key={mat.id || mIdx}
                            className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono w-5 text-center shrink-0">
                                #{mIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={mat.name}
                                onChange={(e) =>
                                  handleUpdateItemMaterial(index, mIdx, 'name', e.target.value)
                                }
                                className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded focus:outline-blue-500 font-medium"
                                placeholder="材料品名"
                              />
                            </div>

                            <div className="col-span-4 sm:col-span-2 flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 shrink-0">数量:</span>
                              <input
                                type="number"
                                min="1"
                                value={mat.quantity}
                                onChange={(e) =>
                                  handleUpdateItemMaterial(index, mIdx, 'quantity', e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-mono font-medium focus:outline-blue-500"
                              />
                            </div>

                            <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 shrink-0">単位:</span>
                              <input
                                type="text"
                                value={mat.unit}
                                onChange={(e) =>
                                  handleUpdateItemMaterial(index, mIdx, 'unit', e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-center focus:outline-blue-500"
                                placeholder="個/組/式"
                              />
                            </div>

                            <div className="col-span-5 sm:col-span-2 flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 shrink-0">単価:</span>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={mat.unitPrice || 0}
                                onChange={(e) =>
                                  handleUpdateItemMaterial(index, mIdx, 'unitPrice', e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono focus:outline-blue-500"
                              />
                            </div>

                            <div className="col-span-10 sm:col-span-2 flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-bold shrink-0">金額:</span>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={mat.amount || 0}
                                onChange={(e) =>
                                  handleUpdateItemMaterial(index, mIdx, 'amount', e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 bg-white border border-blue-300 rounded text-right font-mono font-bold text-blue-900 focus:outline-blue-500"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-12 sm:col-span-auto flex justify-end">
                              {itemMaterials.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemMaterial(index, mIdx)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded hover:bg-slate-200"
                                  title="この材料を削除"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="text-[11px] text-slate-500">
                          内訳明細書に印字される材料内訳: <strong>{itemMaterials.length}件</strong>
                        </span>
                        <div className="font-mono">
                          <span className="text-slate-500 font-sans mr-1">材料費 小計（集計対象）:</span>
                          <span className="text-sm font-bold text-blue-700">¥{itemMaterialsTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Calculated 4-line summary pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100 rounded-lg text-[11px] font-mono">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-slate-600">
                          材料: <strong>¥{itemMaterialsTotal.toLocaleString()}</strong>
                        </span>
                        <span className="text-slate-300">＋</span>
                        <span className="text-slate-600">
                          取替: <strong>¥{b.replacementLaborAmount.toLocaleString()}</strong>
                        </span>
                        <span className="text-slate-300">＋</span>
                        <span className="text-emerald-700">
                          交通費: <strong>¥{b.transportAmount.toLocaleString()}</strong>
                        </span>
                        <span className="text-slate-300">＋</span>
                        <span className="text-amber-700">
                          諸経費(20%): <strong>¥{b.overheadAmount.toLocaleString()}</strong>
                        </span>
                      </div>

                      <div className="text-xs">
                        <span className="text-slate-500 font-sans mr-1">項目小計（計）:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ¥{item.amount.toLocaleString()}.-
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                全{items.length}件の工事項目が登録されています（A4内訳明細書：全{breakdownPageCount}ページ・各5項目）
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onGoToPreview('page1')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  1. 表紙を見る
                </button>
                <button
                  onClick={() => onGoToPreview('page2')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  2. 4行内訳明細を見る ({breakdownPageCount}頁)
                </button>
                <button
                  onClick={onExportPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  {isGeneratingPdf ? 'PDF生成中...' : '高精細PDFダウンロード'}
                </button>
                <button
                  onClick={onPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  印刷
                </button>
              </div>
            </div>
          </div>

      {/* Preset Manager Modal */}
      <PresetManagerModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        presets={presets}
        setPresets={setPresets}
        onSelectPreset={(newId) => handlePresetChange(newId)}
      />

      {/* In-App Delete Confirmation Modal (Never blocked by iFrame sandbox) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up border border-slate-300">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">工事項目の削除確認</h4>
                <p className="text-xs text-slate-500">この操作は後から「元に戻す」ことも可能です</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px]">削除対象項目：</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {deleteTarget.index + 1}. {deleteTarget.title}
              </strong>
            </div>

            <p className="text-xs text-slate-600">
              この工事項目を見積書から削除してもよろしいですか？（内訳明細書および見積表紙の合計金額から除外されます）
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
