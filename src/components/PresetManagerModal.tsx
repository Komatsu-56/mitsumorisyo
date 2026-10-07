/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ConstructionPreset,
  PRESET_CONSTRUCTION_ITEMS,
  savePresets,
} from '../utils/estimateCalculations';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Settings,
  CheckCircle2,
  AlertCircle,
  ListPlus,
} from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: ConstructionPreset[];
  setPresets: React.Dispatch<React.SetStateAction<ConstructionPreset[]>>;
  onSelectPreset?: (presetId: string) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  setPresets,
  onSelectPreset,
}) => {
  const [newTitle, setNewTitle] = useState<string>('');
  const [newMaterialName, setNewMaterialName] = useState<string>('');
  const [newMaterialAmount, setNewMaterialAmount] = useState<number>(30000);
  const [newLaborAmount, setNewLaborAmount] = useState<number>(20000);
  const [newUnit, setNewUnit] = useState<string>('式');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add new preset item to dropdown list
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const newPreset: ConstructionPreset = {
      id: `custom-preset-${Date.now()}`,
      title,
      defaultMaterialName: newMaterialName.trim() || `${title} 部材一式`,
      defaultMaterialAmount: Math.max(0, newMaterialAmount || 0),
      defaultLaborAmount: Math.max(0, newLaborAmount || 0),
      defaultUnit: newUnit || '式',
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);

    setNewTitle('');
    setNewMaterialName('');
    setFeedbackMsg(`「${title}」をドロップダウン選択肢に追加しました。`);
    setTimeout(() => setFeedbackMsg(null), 3000);

    if (onSelectPreset) {
      onSelectPreset(newPreset.id);
    }
  };

  // Delete preset item from dropdown list
  const handleDeletePreset = (id: string, title: string) => {
    if (presets.length <= 1) {
      setFeedbackMsg('ドロップダウンには最低1つの選択肢が必要です。');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(updated);

    setFeedbackMsg(`「${title}」を選択肢から削除しました。`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Reset to default presets
  const handleResetPresets = () => {
    setPresets(PRESET_CONSTRUCTION_ITEMS);
    savePresets(PRESET_CONSTRUCTION_ITEMS);
    setFeedbackMsg('ドロップダウン選択肢を初期状態に戻しました。');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-300 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">工事項目ドロップダウン管理（追加・削除）</h3>
              <p className="text-[11px] text-slate-400">
                ドロップダウンに表示する工事項目の追加・不要な項目の削除ができます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Add New Preset Form */}
          <div className="bg-slate-50 border-2 border-blue-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">
                新しい工事項目を選択肢に追加
              </h4>
            </div>

            <form onSubmit={handleAddPreset} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    工事項目名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 非常用照明バッテリー取替"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    標準単位
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    標準材料費（円）
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newMaterialAmount}
                    onChange={(e) => setNewMaterialAmount(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    標準取替調整費（円）
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newLaborAmount}
                    onChange={(e) => setNewLaborAmount(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    標準材料品名（任意）
                  </label>
                  <input
                    type="text"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    placeholder="例: 交換用密閉蓄電池"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  選択肢に追加する
                </button>
              </div>
            </form>
          </div>

          {/* 2. Registered Presets List with Delete */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">
                ドロップダウンに登録中の項目一覧（全{presets.length}件）
              </span>
              <button
                onClick={handleResetPresets}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
                title="初期マスタの選択肢に戻す"
              >
                <RotateCcw className="w-3 h-3" />
                初期一覧に戻す
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {presets.map((preset, index) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      (材料: ¥{preset.defaultMaterialAmount.toLocaleString()} / 取替: ¥{preset.defaultLaborAmount.toLocaleString()})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeletePreset(preset.id, preset.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                    title={`「${preset.title}」を選択肢から削除`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            完了してドロップダウンに反映
          </button>
        </div>
      </div>
    </div>
  );
};
