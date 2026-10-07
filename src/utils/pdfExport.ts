/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportResult {
  success: boolean;
  blob?: Blob;
  blobUrl?: string;
  error?: string;
}

export async function exportEstimateToPdf(
  elementIds: string[],
  fileName: string = '見積書.pdf',
  onProgress?: (progressText: string) => void
): Promise<PdfExportResult> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    let renderedCount = 0;

    for (let i = 0; i < elementIds.length; i++) {
      const id = elementIds[i];
      let element = document.getElementById(id);
      
      // Fallback: If pdf- prefixed element is missing, try standard element ID
      if (!element && id.startsWith('pdf-')) {
        element = document.getElementById(id.replace(/^pdf-/, ''));
      }

      if (!element) {
        console.warn(`Element with ID '${id}' not found, skipping page.`);
        continue;
      }

      if (onProgress) {
        onProgress(`ページ ${i + 1} / ${elementIds.length} を高精細レンダリング中...`);
      }

      // Render to canvas using html2canvas-pro with OKLCH / modern CSS support
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn(`Canvas for element '${id}' was empty.`);
        continue;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (renderedCount > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Preserve natural aspect ratio without stretching
      const elementAspectHeight = (canvas.height * pageWidth) / canvas.width;
      const renderHeight = Math.min(pageHeight, elementAspectHeight);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, renderHeight);
      renderedCount++;
    }

    if (renderedCount === 0) {
      throw new Error('PDFに含めるページ要素が見つかりませんでした。');
    }

    if (onProgress) {
      onProgress('PDFファイルを生成・保存中...');
    }

    // 1. Generate Blob & Blob URL for robust handling across all environments
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // 2. Attempt standard jsPDF save
    try {
      pdf.save(fileName);
    } catch (saveError) {
      console.warn('Standard pdf.save() failed, attempting anchor fallback:', saveError);
      // Fallback: programmatic anchor download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      success: true,
      blob,
      blobUrl,
    };
  } catch (error: any) {
    console.error('PDF export failed:', error);
    return {
      success: false,
      error: error?.message || 'PDF生成中にエラーが発生しました。',
    };
  }
}

