"use client";

import type { DatabaseGemstone } from "@/shared/types";

// Simple logger for export service
const logger = {
  info: (message: string, data?: any) => console.log(`[EXPORT INFO] ${message}`, data),
  error: (message: string, error?: any, data?: any) => console.error(`[EXPORT ERROR] ${message}`, error, data),
  warn: (message: string, data?: any) => console.warn(`[EXPORT WARN] ${message}`, data),
};

export interface ExportOptions {
  selectedGemstones?: string[]; // Array of gemstone IDs to export
  format: 'csv' | 'pdf';
  includeImages?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: Blob;
  fileName?: string;
  error?: string;
}

export class ExportService {
  /**
   * Export gemstones to CSV format
   */
  static async exportToCSV(gemstones: DatabaseGemstone[], options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting CSV export', {
        gemstoneCount: gemstones.length,
        includeImages: options.includeImages,
        includeMetadata: options.includeMetadata
      });

      const headers = [
        'Serial Number',
        'Name',
        'Color',
        'Cut',
        'Clarity',
        'Weight (carats)',
        'Length (mm)',
        'Width (mm)',
        'Depth (mm)',
        'Price Amount',
        'Price Currency',
        'Premium Price Amount',
        'Premium Price Currency',
        'In Stock',
        'Delivery Days',
        'Internal Code',
        'Description',
        'Created At',
        'Updated At'
      ];

      if (options.includeImages) {
        headers.push('Image URLs');
      }

      const rows = gemstones.map(gemstone => {
        const row = [
          gemstone.serial_number,
          gemstone.name,
          gemstone.color,
          gemstone.cut,
          gemstone.clarity,
          gemstone.weight_carats.toString(),
          gemstone.length_mm?.toString() || '',
          gemstone.width_mm?.toString() || '',
          gemstone.depth_mm?.toString() || '',
          gemstone.price_amount.toString(),
          gemstone.price_currency,
          gemstone.premium_price_amount?.toString() || '',
          gemstone.premium_price_currency || '',
          gemstone.in_stock ? 'Yes' : 'No',
          gemstone.delivery_days?.toString() || '',
          gemstone.internal_code || '',
          gemstone.description || '',
          gemstone.created_at,
          gemstone.updated_at
        ];

        if (options.includeImages) {
          // TODO: Fetch image URLs for each gemstone
          row.push(''); // Placeholder for image URLs
        }

        return row;
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      logger.info('CSV export completed successfully', {
        gemstoneCount: gemstones.length,
        fileSize: blob.size
      });

      return {
        success: true,
        data: blob,
        fileName: `gemstones-export-${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      logger.error('CSV export failed', error as Error, {
        gemstoneCount: gemstones.length
      });

      return {
        success: false,
        error: `CSV export failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Export gemstones to PDF format
   */
  static async exportToPDF(gemstones: DatabaseGemstone[], options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting PDF export', {
        gemstoneCount: gemstones.length,
        includeImages: options.includeImages,
        includeMetadata: options.includeMetadata
      });

      // For now, we'll create a simple HTML-based PDF
      // In a production environment, you'd use a library like jsPDF or Puppeteer

      const htmlContent = this.generateHTMLContent(gemstones, options);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });

      logger.info('PDF export completed successfully', {
        gemstoneCount: gemstones.length,
        fileSize: blob.size
      });

      return {
        success: true,
        data: blob,
        fileName: `gemstones-export-${new Date().toISOString().split('T')[0]}.html`
      };
    } catch (error) {
      logger.error('PDF export failed', error as Error, {
        gemstoneCount: gemstones.length
      });

      return {
        success: false,
        error: `PDF export failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private static generateHTMLContent(gemstones: DatabaseGemstone[], options: ExportOptions): string {
    const date = new Date().toLocaleDateString();

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gemstone Catalog Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin-bottom: 10px; }
          .header .date { color: #6b7280; }
          .stats { background: #f3f4f6; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
          .gemstone { border: 1px solid #e5e7eb; margin-bottom: 20px; padding: 15px; border-radius: 8px; }
          .gemstone-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .serial-number { font-weight: bold; color: #2563eb; }
          .price { font-size: 18px; font-weight: bold; color: #059669; }
          .details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
          .detail-item { margin-bottom: 8px; }
          .detail-label { font-weight: bold; color: #374151; }
          .detail-value { color: #6b7280; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status.in-stock { background: #dcfce7; color: #166534; }
          .status.out-of-stock { background: #fef2f2; color: #dc2626; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Gemstone Catalog Export</h1>
          <div class="date">Generated on ${date}</div>
        </div>

        <div class="stats">
          <strong>Total Gemstones:</strong> ${gemstones.length}
          ${options.selectedGemstones ? `<br><strong>Selected for Export:</strong> ${options.selectedGemstones.length}` : ''}
        </div>
    `;

    gemstones.forEach(gemstone => {
      const price = `$${(gemstone.price_amount / 100).toLocaleString()} ${gemstone.price_currency}`;
      const premiumPrice = gemstone.premium_price_amount
        ? `$${(gemstone.premium_price_amount / 100).toLocaleString()} ${gemstone.premium_price_currency}`
        : 'N/A';

      html += `
        <div class="gemstone">
          <div class="gemstone-header">
            <div class="serial-number">${gemstone.serial_number}</div>
            <div class="price">${price}</div>
          </div>

          <div class="details">
            <div class="detail-item">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${gemstone.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Color:</span>
              <span class="detail-value">${gemstone.color}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cut:</span>
              <span class="detail-value">${gemstone.cut}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Clarity:</span>
              <span class="detail-value">${gemstone.clarity}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Weight:</span>
              <span class="detail-value">${gemstone.weight_carats} carats</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Dimensions:</span>
              <span class="detail-value">
                ${gemstone.length_mm || 0} × ${gemstone.width_mm || 0} × ${gemstone.depth_mm || 0} mm
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Premium Price:</span>
              <span class="detail-value">${premiumPrice}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Stock Status:</span>
              <span class="status ${gemstone.in_stock ? 'in-stock' : 'out-of-stock'}">
                ${gemstone.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            ${gemstone.delivery_days ? `
            <div class="detail-item">
              <span class="detail-label">Delivery:</span>
              <span class="detail-value">${gemstone.delivery_days} days</span>
            </div>
            ` : ''}
            ${gemstone.internal_code ? `
            <div class="detail-item">
              <span class="detail-label">Internal Code:</span>
              <span class="detail-value">${gemstone.internal_code}</span>
            </div>
            ` : ''}
            ${gemstone.description ? `
            <div class="detail-item" style="grid-column: 1 / -1;">
              <span class="detail-label">Description:</span>
              <div class="detail-value">${gemstone.description}</div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Trigger file download
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data || !result.fileName) {
      logger.error('Cannot download file - invalid result', null, { result });
      return;
    }

    try {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('File download initiated', {
        fileName: result.fileName,
        fileSize: result.data.size
      });
    } catch (error) {
      logger.error('File download failed', error as Error, {
        fileName: result.fileName
      });
    }
  }

  /**
   * Get export statistics
   */
  static getExportStats(gemstones: DatabaseGemstone[]): {
    total: number;
    inStock: number;
    outOfStock: number;
    totalValue: number;
    avgPrice: number;
  } {
    const inStock = gemstones.filter(g => g.in_stock).length;
    const totalValue = gemstones.reduce((sum, g) => sum + g.price_amount, 0);
    const avgPrice = totalValue / gemstones.length;

    return {
      total: gemstones.length,
      inStock,
      outOfStock: gemstones.length - inStock,
      totalValue: totalValue / 100, // Convert from cents
      avgPrice: avgPrice / 100
    };
  }
}
