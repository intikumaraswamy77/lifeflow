const fs = require('fs');
const path = require('path');
const Donation = require('../models/Donation');

const EXPORT_DIR = path.join(__dirname, '..', 'exports');

function pad(n) { return String(n).padStart(2, '0'); }

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeCsv(val) {
  const s = (val ?? '').toString();
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

async function exportDonationsCsv() {
  ensureDir(EXPORT_DIR);
  const now = new Date();
  const fname = `donations_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`;
  const fpath = path.join(EXPORT_DIR, fname);

  const headers = ['bloodBankId','donorName','bloodGroup','quantity','unit','donationDate','notes','createdAt','updatedAt'];

  try {
    const docs = await Donation.find({})
      .populate('donorId', 'name')
      .sort({ donationDate: -1 })
      .lean();
    const lines = [];
    lines.push(headers.join(','));

    for (const d of docs) {
      const row = [
        escapeCsv(d.bloodBankId),
        escapeCsv(d.donorName || d.donorId?.name || ''),
        escapeCsv(d.bloodGroup || ''),
        escapeCsv(d.quantity ?? ''),
        escapeCsv(d.unit || 'packets'),
        escapeCsv(new Date(d.donationDate || d.createdAt || Date.now()).toISOString()),
        escapeCsv(d.notes || ''),
        escapeCsv(new Date(d.createdAt || Date.now()).toISOString()),
        escapeCsv(new Date(d.updatedAt || d.createdAt || Date.now()).toISOString()),
      ];
      lines.push(row.join(','));
    }

    // Add BOM for Excel compatibility
    const csv = '\uFEFF' + lines.join('\n');
    fs.writeFileSync(fpath, csv, { encoding: 'utf8' });
    // Silenced: console.log(`[CSV Export] Wrote ${docs.length} donations to ${fpath}`);
    return { file: fpath, count: docs.length };
  } catch (err) {
    console.error('[CSV Export] Failed:', err);
    throw err;
  }
}

module.exports = {
  exportDonationsCsv,
  ensureDir: ensureDir.bind(null, EXPORT_DIR),
  EXPORT_DIR,
};
