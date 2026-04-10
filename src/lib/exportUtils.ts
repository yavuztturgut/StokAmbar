import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions for jspdf-autotable to avoid TS errors
// Some versions might need explicit import of the type
interface ExportColumn {
  header: string;
  dataKey: string;
}

/**
 * Exports data to an Excel file
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 */
export const exportToExcel = (data: Record<string, unknown>[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Create XLSX file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Exports data to a PDF file with a table layout
 * @param columns Table headers and mapping
 * @param data Data rows
 * @param filename Desired filename
 * @param title Title of the document
 */
export const exportToPDF = async (
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string,
  title: string
) => {
  const doc = new jsPDF();

  // Lazy load font to keep initial bundle size small
  try {
    const { robotoBase64 } = await import('./fonts/Roboto-Regular-base64');
    doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (error) {
    console.error('Error loading font:', error);
    // Fallback to helvetica if font loading fails
    doc.setFont('helvetica');
  }

  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  // Add Date
  const dateStr = new Date().toLocaleString('tr-TR');
  doc.text(`Oluşturulma Tarihi: ${dateStr}`, 14, 30);

  // Generate Table
  autoTable(doc, {
    startY: 40,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => item[col.dataKey] ?? '-')),
    styles: { font: doc.getFont().fontName || 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
  });

  doc.save(`${filename}.pdf`);
};
