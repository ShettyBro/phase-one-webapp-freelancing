import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { CURRENCY } from './domain';

// Brand colours
const GOLD = rgb(1, 0.816, 0); // #FFD000
const GOLD_DARK = rgb(0.788, 0.639, 0); // #C9A300
const MAROON = rgb(0.569, 0.149, 0.149); // #912626
const NAVY = rgb(0.027, 0.055, 0.114); // #070e1d
const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.42, 0.45);

export interface PdfDelegate {
  position: number;
  name: string;
  email: string;
  phone: string;
  grade: number;
  nationality: string;
  experience: string;
  institution: string | null;
}

export interface PdfRegistration {
  applicationId: string;
  type: 'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType: 'SINGLE' | 'DOUBLE' | null;
  committee: string | null;
  portfolio: string | null;
  institutionName: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  teacherPhone: string | null;
  headName: string | null;
  headEmail: string | null;
  headPhone: string | null;
  amountPayable: number;
  submittedAt: Date;
  delegates: PdfDelegate[];
}

async function fetchPng(url?: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** ASCII-safe text for the standard PDF fonts (WinAnsi). */
const safe = (s: string) => s.replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');

export async function buildRegistrationPdf(reg: PdfRegistration): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── Background ──
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.985, 0.97) });
  // Maroon → gold top band
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: MAROON });
  page.drawRectangle({ x: 0, y: height - 8, width: width / 2, height: 8, color: GOLD });

  const base = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');

  // Dove watermark (faint, centred)
  const doveBytes = await fetchPng(base ? `${base}/dove_peace.png` : undefined);
  if (doveBytes) {
    try {
      const dove = await doc.embedPng(doveBytes);
      const dw = 320;
      const dh = (dove.height / dove.width) * dw;
      page.drawImage(dove, { x: (width - dw) / 2, y: (height - dh) / 2 - 40, width: dw, height: dh, opacity: 0.06 });
    } catch { /* ignore */ }
  }

  // Logo (top centre)
  let cursorY = height - 40;
  const logoBytes = await fetchPng(base ? `${base}/logo.png` : undefined);
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const lw = 74;
      const lh = (logo.height / logo.width) * lw;
      page.drawImage(logo, { x: (width - lw) / 2, y: cursorY - lh, width: lw, height: lh });
      cursorY -= lh + 14;
    } catch { cursorY -= 10; }
  } else {
    cursorY -= 10;
  }

  const centre = (text: string, y: number, font: PDFFont, size: number, color = INK) => {
    const t = safe(text);
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (width - w) / 2, y, size, font, color });
  };

  centre('CoMUN 2026', cursorY, serifBold, 22, GOLD_DARK); cursorY -= 18;
  centre('Cottons Model United Nations', cursorY, sans, 9, MUTED); cursorY -= 26;

  // Application ID box
  const boxW = 260, boxH = 46, boxX = (width - boxW) / 2;
  cursorY -= boxH;
  page.drawRectangle({ x: boxX, y: cursorY, width: boxW, height: boxH, borderColor: GOLD_DARK, borderWidth: 1, color: rgb(1, 0.98, 0.9) });
  centre('APPLICATION ID', cursorY + boxH - 14, sansBold, 7, MUTED);
  centre(reg.applicationId, cursorY + 10, serifBold, 20, MAROON);
  cursorY -= 24;

  // ── Details table ──
  const left = 60;
  const labelX = left;
  const valueX = left + 150;
  const rowGap = 20;

  const row = (label: string, value: string) => {
    page.drawText(safe(label), { x: labelX, y: cursorY, size: 9, font: sansBold, color: MUTED });
    const lines = wrap(safe(value || '-'), sans, 10, width - valueX - 60);
    lines.forEach((ln, i) => {
      page.drawText(ln, { x: valueX, y: cursorY - i * 12, size: 10, font: sans, color: INK });
    });
    cursorY -= Math.max(rowGap, lines.length * 12 + 8);
  };

  const heading = (text: string) => {
    cursorY -= 6;
    page.drawText(safe(text), { x: left, y: cursorY, size: 11, font: serifBold, color: GOLD_DARK });
    page.drawLine({ start: { x: left, y: cursorY - 5 }, end: { x: width - 60, y: cursorY - 5 }, thickness: 0.5, color: rgb(0.85, 0.8, 0.6) });
    cursorY -= 20;
  };

  const typeLabel = reg.type === 'INDIVIDUAL'
    ? `Individual - ${reg.delegationType === 'DOUBLE' ? 'Double' : 'Single'} Delegation`
    : 'Institutional';

  heading('Registration Details');
  row('Registration Type', typeLabel);
  if (reg.committee) row('Committee', reg.committee);
  if (reg.portfolio) row('Portfolio', reg.portfolio);
  row('Submission Date', reg.submittedAt.toISOString().slice(0, 10));

  if (reg.type === 'INDIVIDUAL') {
    reg.delegates.sort((a, b) => a.position - b.position).forEach((d) => {
      heading(reg.delegates.length > 1 ? `Delegate ${d.position}` : 'Delegate');
      row('Name', d.name);
      row('Email', d.email);
      row('Phone', d.phone);
      row('Grade', String(d.grade));
      row('Nationality', d.nationality);
      row('Experience', d.experience);
      if (d.institution) row('Institution', d.institution);
    });
  } else {
    heading('Institution');
    row('Institution Name', reg.institutionName || '-');
    heading('Teacher In Charge');
    row('Name', reg.teacherName || '-');
    row('Email', reg.teacherEmail || '-');
    row('Phone', reg.teacherPhone || '-');
    heading('Head Delegate');
    row('Name', reg.headName || '-');
    row('Email', reg.headEmail || '-');
    row('Phone', reg.headPhone || '-');
  }

  heading('Payment');
  row('Amount Payable at Desk', reg.amountPayable > 0 ? `${CURRENCY} ${reg.amountPayable}` : 'As applicable at the Registration Desk');

  // ── Instructions box ──
  cursorY -= 6;
  const instrLines = [
    'Please bring a printed copy of this document during offline registration at the',
    'Registration Desk. Carry a valid ID proof. The amount above is payable at the desk.',
    'This document is your official proof of registration for CoMUN 2026.',
  ];
  const instrH = instrLines.length * 13 + 22;
  cursorY -= instrH;
  page.drawRectangle({ x: 50, y: cursorY, width: width - 100, height: instrH, color: rgb(0.98, 0.96, 0.88), borderColor: GOLD, borderWidth: 0.5 });
  page.drawText('Instructions', { x: 60, y: cursorY + instrH - 16, size: 9, font: sansBold, color: MAROON });
  instrLines.forEach((ln, i) => {
    page.drawText(safe(ln), { x: 60, y: cursorY + instrH - 32 - i * 13, size: 8.5, font: sans, color: INK });
  });

  // Footer
  centre('Peace Over Power  -  CoMUN 2026', 30, serif, 9, MUTED);
  page.drawRectangle({ x: 0, y: 0, width, height: 4, color: NAVY });

  return doc.save();
}

/** Naive word-wrap for a max pixel width. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['-'];
}
