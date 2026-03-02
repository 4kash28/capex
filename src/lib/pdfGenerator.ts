import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';

// Helper to format currency for PDF (removes ₹ symbol which might not render well in standard fonts)
export const formatCurrencyPDF = (amount: number) => {
  return formatCurrency(amount).replace('₹', 'Rs. ');
};

interface ReportHeaderOptions {
  title: string;
  subtitle?: string;
  metadata?: Record<string, string>;
}

export const generateProfessionalPDF = (
  options: ReportHeaderOptions,
  tables: {
    title?: string;
    headers: string[];
    rows: any[][];
    summary?: Record<string, string>;
  }[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate 500
  const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate 200
  
  let currentY = 20;

  // --- Watermark ---
  doc.setTextColor(241, 245, 249); // Slate 100
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  // Save graphics state
  doc.saveGraphicsState();
  doc.setGState(new (doc.GState as any)({ opacity: 0.4 }));
  doc.text('SYSTEM GENERATED', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  });
  doc.restoreGraphicsState();

  // --- Header Section ---
  
  // Company/App Logo or Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('CAPEX TRACKER PRO', 14, currentY);
  
  // System ID / Date on the right
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  const reportId = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getTime().toString().slice(-4)}`;
  doc.text(`Report ID: ${reportId}`, pageWidth - 14, currentY - 4, { align: 'right' });
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - 14, currentY + 1, { align: 'right' });
  
  // Accent line
  currentY += 8;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  
  currentY += 12;

  // Report Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(options.title.toUpperCase(), 14, currentY);
  
  if (options.subtitle) {
    currentY += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text(options.subtitle, 14, currentY);
  }
  
  currentY += 10;

  // Metadata (Two-column layout)
  if (options.metadata) {
    const entries = Object.entries(options.metadata);
    if (entries.length > 0) {
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      
      const boxHeight = Math.ceil(entries.length / 2) * 8 + 8;
      doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'FD');
      
      currentY += 8;
      doc.setFontSize(9);
      
      entries.forEach(([key, value], index) => {
        const isRightColumn = index % 2 !== 0;
        const xPos = isRightColumn ? pageWidth / 2 + 5 : 18;
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(`${key}:`, xPos, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryColor);
        doc.text(value, xPos + doc.getTextWidth(`${key}: `) + 2, currentY);
        
        if (isRightColumn || index === entries.length - 1) {
          currentY += 8;
        }
      });
      currentY += 6;
    }
  } else {
    currentY += 5;
  }

  // --- Tables Section ---
  tables.forEach((table, index) => {
    // Add page break if not enough space for table header
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    if (table.title) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(table.title.toUpperCase(), 14, currentY);
      currentY += 6;
    }

    if (table.summary) {
      doc.setFontSize(9);
      let summaryX = 14;
      Object.entries(table.summary).forEach(([key, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(`${key}:`, summaryX, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryColor);
        const valueX = summaryX + doc.getTextWidth(`${key}: `) + 1;
        doc.text(value, valueX, currentY);
        
        summaryX = valueX + doc.getTextWidth(value) + 12;
      });
      currentY += 8;
    }

    autoTable(doc, {
      startY: currentY,
      head: [table.headers],
      body: table.rows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 4,
        lineColor: borderColor,
        lineWidth: 0.1,
        textColor: [51, 65, 85], // Slate 700
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        textTransform: 'uppercase',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: lightBg,
      },
      columnStyles: {
        // Assume last column is usually amount, right align it
        [table.headers.length - 1]: { halign: 'right', fontStyle: 'bold' }
      },
      didDrawPage: (data) => {
        // Footer
        const str = `Page ${(doc as any).internal.getNumberOfPages()}`;
        
        // Footer Line
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...secondaryColor);
        
        const generatedStr = `This is a system generated report. No signature is required. | Powered by ARtecH Group`;
        doc.text(generatedStr, 14, pageHeight - 10);
        
        doc.setFont('helvetica', 'normal');
        doc.text(
          str,
          pageWidth - 14 - doc.getTextWidth(str),
          pageHeight - 10
        );
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  // End of Report Marker
  if (currentY < pageHeight - 30) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text('*** END OF REPORT ***', pageWidth / 2, currentY, { align: 'center' });
  }

  return doc;
};
