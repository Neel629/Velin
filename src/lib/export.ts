"use client"

import { getTransactions, getCategories, getBudgets, getSplitGroups } from "./store";
import { format } from "date-fns";
import { toast } from "sonner";

function escapeCSV(field: any): string {
  if (field === null || field === undefined) return "";
  const stringField = String(field);
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

export async function generateExportData(): Promise<string> {
  const transactions = await getTransactions();
  const categories = await getCategories();
  const budgets = await getBudgets();
  const splitGroups = await getSplitGroups();

  let csvContent = "";

  // 1. ANALYTICS SUMMARY
  csvContent += "=== VELIN ANALYTICS SUMMARY ===\n";
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx: any) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") totalIncome += amt;
    else if (tx.type === "expense") totalExpense += Math.abs(amt);
  });

  const netSavings = totalIncome - totalExpense;

  csvContent += `Generated On,${format(new Date(), "PPpp")}\n`;
  csvContent += `Total Income,${totalIncome}\n`;
  csvContent += `Total Expenses,${totalExpense}\n`;
  csvContent += `Net Savings,${netSavings}\n`;
  csvContent += `Total Transactions,${transactions.length}\n`;
  csvContent += `Total Categories,${categories.length}\n`;
  csvContent += `Active Budgets,${budgets.length}\n`;
  csvContent += `Split Groups,${splitGroups.length}\n\n`;

  // 2. TRANSACTIONS TABLE
  csvContent += "=== TRANSACTIONS ===\n";
  csvContent += "Date,Type,Category,Remarks,Quantity,Amount,Total Amount\n";

  transactions.forEach((tx: any) => {
    const date = tx.transaction_date ? format(new Date(tx.transaction_date), "yyyy-MM-dd") : "";
    const type = escapeCSV(tx.type);
    const category = escapeCSV(tx.categories?.name || "Uncategorized");
    const remarks = escapeCSV(tx.remarks);
    const qty = escapeCSV(tx.quantity);
    const amt = escapeCSV(tx.amount);
    const totalAmt = escapeCSV(tx.total_amount);

    csvContent += `${date},${type},${category},${remarks},${qty},${amt},${totalAmt}\n`;
  });

  csvContent += "\n";

  // 3. BUDGETS TABLE
  if (budgets.length > 0) {
    csvContent += "=== BUDGETS ===\n";
    csvContent += "Category,Period,Limit Amount,Alert Threshold (%)\n";
    
    budgets.forEach((b: any) => {
      const category = escapeCSV(b.categories?.name || "Unknown");
      const period = escapeCSV(b.period);
      const limit = escapeCSV(b.limit_amount);
      const alert = escapeCSV(b.alert_threshold);

      csvContent += `${category},${period},${limit},${alert}\n`;
    });
    csvContent += "\n";
  }

  // 4. SPLIT GROUPS TABLE
  if (splitGroups.length > 0) {
    csvContent += "=== SPLIT EXPENSES ===\n";
    csvContent += "Title,Date,Total Amount,Notes,Settled Status\n";

    splitGroups.forEach((g: any) => {
      const title = escapeCSV(g.title);
      const date = g.event_date ? format(new Date(g.event_date), "yyyy-MM-dd") : "";
      const total = escapeCSV(g.total_amount);
      const notes = escapeCSV(g.notes);
      
      const members = g.split_members || [];
      const settledCount = members.filter((m: any) => m.status === 'settled').length;
      const status = `${settledCount}/${members.length} settled`;

      csvContent += `${title},${date},${total},${notes},${status}\n`;
    });
  }

  return csvContent;
}

export async function downloadCSV() {
  try {
    const csvContent = await generateExportData();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Velin_Export_${format(new Date(), "yyyy-MM-dd")}.csv`);
  } catch (error) {
    toast.error("Failed to generate export data");
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadTransactionsCSV() {
  try {
    const transactions = await getTransactions();
    let csvContent = "Date,Type,Category,Remarks,Quantity,Amount,Total Amount\n";
    transactions.forEach((tx: any) => {
      const date = tx.transaction_date ? format(new Date(tx.transaction_date), "yyyy-MM-dd") : "";
      const type = escapeCSV(tx.type);
      const category = escapeCSV(tx.categories?.name || "Uncategorized");
      const remarks = escapeCSV(tx.remarks);
      const qty = escapeCSV(tx.quantity);
      const amt = escapeCSV(tx.amount);
      const totalAmt = escapeCSV(tx.total_amount);
      csvContent += `${date},${type},${category},${remarks},${qty},${amt},${totalAmt}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Velin_Transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
  } catch (error) {
    toast.error("Failed to download transactions");
  }
}

export async function downloadCategoriesCSV() {
  try {
    const categories = await getCategories();
    let csvContent = "Name,Type,Created At\n";
    categories.forEach((c: any) => {
      csvContent += `${escapeCSV(c.name)},${escapeCSV(c.type)},${c.created_at ? format(new Date(c.created_at), "yyyy-MM-dd") : ""}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Velin_Categories_${format(new Date(), "yyyy-MM-dd")}.csv`);
  } catch (error) {
    toast.error("Failed to download categories");
  }
}

export async function downloadBudgetsCSV() {
  try {
    const budgets = await getBudgets();
    let csvContent = "Category,Period,Limit Amount,Alert Threshold (%)\n";
    budgets.forEach((b: any) => {
      const category = escapeCSV(b.categories?.name || "Unknown");
      const period = escapeCSV(b.period);
      const limit = escapeCSV(b.limit_amount);
      const alert = escapeCSV(b.alert_threshold);
      csvContent += `${category},${period},${limit},${alert}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Velin_Budgets_${format(new Date(), "yyyy-MM-dd")}.csv`);
  } catch (error) {
    toast.error("Failed to download budgets");
  }
}

export async function downloadSplitsCSV() {
  try {
    const splitGroups = await getSplitGroups();
    let csvContent = "Title,Date,Total Amount,Notes,Member Name,Owed Amount,Status\n";
    splitGroups.forEach((g: any) => {
      const title = escapeCSV(g.title);
      const date = g.event_date ? format(new Date(g.event_date), "yyyy-MM-dd") : "";
      const total = escapeCSV(g.total_amount);
      const notes = escapeCSV(g.notes);
      
      const members = g.split_members || [];
      members.forEach((m: any) => {
        csvContent += `${title},${date},${total},${notes},${escapeCSV(m.member_name)},${escapeCSV(m.owed_amount)},${escapeCSV(m.status)}\n`;
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Velin_SplitExpenses_${format(new Date(), "yyyy-MM-dd")}.csv`);
  } catch (error) {
    toast.error("Failed to download split expenses");
  }
}
