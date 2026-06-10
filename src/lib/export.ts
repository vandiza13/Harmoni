// ============================================================
// Harmoni Export Utilities
// PDF: jsPDF + autoTable
// Excel: xlsx (SheetJS)
// ============================================================

import { formatIDR, formatDate, formatMonth } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface TransactionRow {
  date: Date;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

interface ReportConfig {
  familyName: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// ─── Excel Export ─────────────────────────────────────────────
export async function exportTransactionsToExcel(
  transactions: TransactionRow[],
  config: ReportConfig
) {
  const XLSX = await import("xlsx");

  // Summary sheet
  const summaryData = [
    ["LAPORAN KEUANGAN KELUARGA HARMONI"],
    [""],
    ["Keluarga", config.familyName],
    ["Periode", formatMonth(config.month, config.year)],
    ["Tanggal cetak", formatDate(new Date())],
    [""],
    ["RINGKASAN"],
    ["Total Pemasukan", config.totalIncome],
    ["Total Pengeluaran", config.totalExpense],
    ["Saldo", config.balance],
  ];

  // Transactions sheet
  const txHeaders = ["Tanggal", "Keterangan", "Kategori", "Jenis", "Nominal (Rp)"];
  const txData = transactions.map((tx) => [
    formatDate(tx.date, "dd/MM/yyyy"),
    tx.description,
    tx.category,
    tx.type === "income" ? "Pemasukan" : "Pengeluaran",
    tx.amount,
  ]);

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Transactions sheet
  const wsTransactions = XLSX.utils.aoa_to_sheet([txHeaders, ...txData]);
  wsTransactions["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Transaksi");

  // Download
  const filename = `Harmoni_Laporan_${formatMonth(config.month, config.year)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── PDF Export ───────────────────────────────────────────────
export async function exportTransactionsToPDF(
  transactions: TransactionRow[],
  config: ReportConfig
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ─── Header
  doc.setFillColor(76, 175, 80); // brand primary
  doc.rect(0, 0, pageW, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("HARMONI", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Keuangan Keluarga", 14, 24);
  doc.setFontSize(9);
  doc.text(`${config.familyName} · ${formatMonth(config.month, config.year)}`, 14, 31);

  // ─── Summary boxes
  doc.setTextColor(38, 50, 56);
  const boxY = 45;
  const boxes = [
    { label: "Pemasukan", value: formatIDR(config.totalIncome), color: [67, 160, 71] },
    { label: "Pengeluaran", value: formatIDR(config.totalExpense), color: [229, 57, 53] },
    { label: "Saldo", value: formatIDR(config.balance), color: [3, 155, 229] },
  ];

  boxes.forEach((box, i) => {
    const x = 14 + i * 62;
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(x, boxY, 56, 18, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(box.label, x + 4, boxY + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(box.value, x + 4, boxY + 13);
  });

  // ─── Transaction table
  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  doc.setTextColor(38, 50, 56);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Pengeluaran", 14, 75);

  autoTable(doc, {
    startY: 78,
    head: [["Tanggal", "Keterangan", "Kategori", "Nominal"]],
    body: expenses.map((tx) => [
      formatDate(tx.date, "dd/MM"),
      tx.description,
      tx.category,
      formatIDR(tx.amount),
    ]),
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [38, 50, 56] },
    alternateRowStyles: { fillColor: [249, 251, 248] },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    tableWidth: "auto",
  });

  if (incomes.length > 0) {
    const afterExpenses = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 150;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Pemasukan", 14, afterExpenses + 8);

    autoTable(doc, {
      startY: afterExpenses + 11,
      head: [["Tanggal", "Keterangan", "Kategori", "Nominal"]],
      body: incomes.map((tx) => [
        formatDate(tx.date, "dd/MM"),
        tx.description,
        tx.category,
        formatIDR(tx.amount),
      ]),
      headStyles: { fillColor: [67, 160, 71], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
  }

  // ─── Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Dicetak oleh Harmoni · ${formatDate(new Date(), "dd MMMM yyyy")} · Halaman ${i} dari ${pageCount}`,
      pageW / 2, 290, { align: "center" }
    );
  }

  const filename = `Harmoni_${formatMonth(config.month, config.year)}.pdf`;
  doc.save(filename);
}

// ─── Shopping List PDF ────────────────────────────────────────
export async function exportShoppingListToPDF(
  items: { name: string; quantity?: number; unit?: string; category?: string; isChecked: boolean }[],
  listName: string
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  doc.setFillColor(76, 175, 80);
  doc.rect(0, 0, 148, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("HARMONI · Daftar Belanja", 10, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${listName} · ${formatDate(new Date())}`, 10, 20);

  autoTable(doc, {
    startY: 32,
    head: [["", "Item", "Jumlah", "Kategori"]],
    body: items.map((item) => [
      item.isChecked ? "✓" : "○",
      item.name,
      item.quantity ? `${item.quantity} ${item.unit || ""}`.trim() : "-",
      item.category || "-",
    ]),
    headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: 60 } },
    margin: { left: 10, right: 10 },
  });

  doc.save(`Belanja_${listName}.pdf`);
}
