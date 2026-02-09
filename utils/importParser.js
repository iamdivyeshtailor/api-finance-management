const Papa = require('papaparse');
const pdfParse = require('pdf-parse');

// Keyword → category mapping (lowercase keywords)
const KEYWORD_MAP = {
  zomato: 'Food',
  swiggy: 'Food',
  food: 'Food',
  restaurant: 'Food',
  dominos: 'Food',
  pizza: 'Food',
  cafe: 'Food',
  dining: 'Food',
  petrol: 'Transport',
  diesel: 'Transport',
  uber: 'Transport',
  ola: 'Transport',
  rapido: 'Transport',
  metro: 'Transport',
  irctc: 'Transport',
  railway: 'Transport',
  fuel: 'Transport',
  amazon: 'Shopping',
  flipkart: 'Shopping',
  myntra: 'Shopping',
  ajio: 'Shopping',
  meesho: 'Shopping',
  shopping: 'Shopping',
  mall: 'Shopping',
  netflix: 'Entertainment',
  hotstar: 'Entertainment',
  spotify: 'Entertainment',
  movie: 'Entertainment',
  pvr: 'Entertainment',
  inox: 'Entertainment',
  jio: 'Bills',
  airtel: 'Bills',
  vodafone: 'Bills',
  electricity: 'Bills',
  broadband: 'Bills',
  recharge: 'Bills',
  bill: 'Bills',
  rent: 'Rent',
  society: 'Rent',
  maintenance: 'Rent',
  hospital: 'Health',
  medical: 'Health',
  pharmacy: 'Health',
  apollo: 'Health',
  doctor: 'Health',
  medicine: 'Health',
  gym: 'Health',
};

/**
 * Parse SBI date formats: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
 */
function parseSBIDate(str) {
  if (!str) return null;
  const trimmed = str.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD MMM YYYY (e.g., "15 Jan 2025")
  const monthNameMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (monthNameMatch) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Parse Indian comma format: "1,23,456.78" → 123456.78
 */
function parseAmount(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Auto-categorize a description against user's configured categories.
 * Falls back to "Uncategorized".
 */
function autoCategorize(description, userCategories) {
  const desc = (description || '').toLowerCase();
  const categoryNames = (userCategories || []).map((c) => (typeof c === 'string' ? c : c.name));

  // Check keyword map
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (desc.includes(keyword)) {
      // Match against user's categories (case-insensitive)
      const match = categoryNames.find(
        (name) => name.toLowerCase() === category.toLowerCase()
      );
      if (match) return match;
      // If user doesn't have this category, still return the mapped name
      return category;
    }
  }

  return 'Uncategorized';
}

/**
 * Find the header row and map column indices for SBI CSV.
 * SBI statements can have varying column names.
 */
function findColumnIndices(headers) {
  const indices = { date: -1, description: -1, debit: -1, credit: -1 };
  const lower = headers.map((h) => (h || '').toLowerCase().trim());

  for (let i = 0; i < lower.length; i++) {
    if (lower[i].includes('date') && indices.date === -1) indices.date = i;
    if ((lower[i].includes('description') || lower[i].includes('narration') || lower[i].includes('particular')) && indices.description === -1)
      indices.description = i;
    if ((lower[i].includes('debit') || lower[i].includes('withdrawal')) && indices.debit === -1)
      indices.debit = i;
    if ((lower[i].includes('credit') || lower[i].includes('deposit')) && indices.credit === -1)
      indices.credit = i;
  }

  return indices;
}

/**
 * Parse CSV buffer (SBI bank statement format)
 */
function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const { data, errors } = Papa.parse(text, { skipEmptyLines: true });

  if (errors.length > 0 && data.length === 0) {
    throw new Error('Failed to parse CSV: ' + errors[0].message);
  }

  if (data.length < 2) {
    throw new Error('CSV file has no data rows');
  }

  // Find header row (first row with "date" in it)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i].map((c) => (c || '').toLowerCase());
    if (row.some((c) => c.includes('date'))) {
      headerIdx = i;
      break;
    }
  }

  const cols = findColumnIndices(data[headerIdx]);

  if (cols.date === -1) {
    throw new Error('Could not find Date column in CSV');
  }
  if (cols.debit === -1 && cols.credit === -1) {
    throw new Error('Could not find Debit/Credit columns in CSV');
  }

  const transactions = [];

  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i];
    const dateStr = row[cols.date];
    const date = parseSBIDate(dateStr);
    if (!date) continue; // Skip rows without valid date

    const description = (cols.description !== -1 ? row[cols.description] : '').trim();
    const debitAmt = cols.debit !== -1 ? parseAmount(row[cols.debit]) : 0;
    const creditAmt = cols.credit !== -1 ? parseAmount(row[cols.credit]) : 0;

    if (debitAmt === 0 && creditAmt === 0) continue; // Skip zero-amount rows

    transactions.push({
      date: date.toISOString(),
      description: description || 'Bank Transaction',
      amount: debitAmt || creditAmt,
      type: debitAmt > 0 ? 'debit' : 'credit',
      category: '',
      tags: [],
    });
  }

  return transactions;
}

/**
 * Parse PDF buffer (SBI statement — best-effort line extraction)
 */
async function parsePDF(buffer) {
  const { text } = await pdfParse(buffer);
  const lines = text.split('\n').filter((l) => l.trim());
  const transactions = [];

  // Match lines that start with a date pattern
  const datePattern = /(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})/;
  // Amount pattern: Indian format with optional decimals
  const amountPattern = /(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/g;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const date = parseSBIDate(dateMatch[1]);
    if (!date) continue;

    // Extract all amounts from the line
    const amounts = [];
    let m;
    while ((m = amountPattern.exec(line)) !== null) {
      const val = parseAmount(m[1]);
      if (val > 0) amounts.push(val);
    }
    amountPattern.lastIndex = 0;

    if (amounts.length === 0) continue;

    // Description: text between date and first amount
    const afterDate = line.substring(line.indexOf(dateMatch[0]) + dateMatch[0].length);
    const descMatch = afterDate.match(/^\s*(.+?)\s+[\d,]+/);
    const description = descMatch ? descMatch[1].trim() : 'Bank Transaction';

    // Use the largest amount (heuristic for the transaction amount)
    const amount = Math.max(...amounts);

    transactions.push({
      date: date.toISOString(),
      description: description.substring(0, 200) || 'Bank Transaction',
      amount,
      type: 'debit', // PDF parsing can't reliably distinguish, default to debit
      category: '',
      tags: [],
    });
  }

  return transactions;
}

module.exports = { parseCSV, parsePDF, parseSBIDate, parseAmount, autoCategorize };
