import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { CURRENCY } from './domain';

// Brand colours
const GOLD = rgb(1, 0.816, 0); // #FFD000
const GOLD_DARK = rgb(0.788, 0.639, 0); // #C9A300
const MAROON = rgb(0.569, 0.149, 0.149); // #912626
const NAVY = rgb(0.027, 0.055, 0.114); // #070e1d
const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.42, 0.45);
const WHITE = rgb(1, 1, 1);
const CARD_BG = rgb(0.985, 0.98, 0.97);

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

/** Robust local filesystem image loader with HTTP fallback */
async function loadAsset(filename: string, siteUrl?: string): Promise<Uint8Array | null> {
  try {
    const cwd = process.cwd();
    const paths = [
      path.join(cwd, 'src', 'public', filename),
      path.join(cwd, 'public', filename),
      path.join(cwd, 'dist', filename),
      path.join(cwd, filename),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return new Uint8Array(fs.readFileSync(p));
      }
    }
  } catch (err) {
    console.error(`Local read failed for ${filename}:`, err);
  }

  if (siteUrl) {
    try {
      const url = `${siteUrl.replace(/\/$/, '')}/${filename}`;
      const res = await fetch(url);
      if (res.ok) {
        return new Uint8Array(await res.arrayBuffer());
      }
    } catch (err) {
      console.error(`HTTP fetch failed for ${filename}:`, err);
    }
  }
  return null;
}

/** ASCII-safe text helper for Standard WinAnsi fonts */
const safe = (s: string) => s.replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');

export async function buildRegistrationPdf(reg: PdfRegistration): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // 1. Draw elegant double border around page margins (X: 20 to 575, Y: 20 to 821)
  page.drawRectangle({
    x: 20, y: 20,
    width: width - 40, height: height - 40,
    borderColor: GOLD_DARK, borderWidth: 1,
    color: rgb(0.995, 0.99, 0.985)
  });
  page.drawRectangle({
    x: 24, y: 24,
    width: width - 48, height: height - 48,
    borderColor: GOLD_DARK, borderWidth: 0.5,
  });

  // Base URL for asset fallback
  const base = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');

  // 2. Dove Watermark (Center)
  const doveBytes = await loadAsset('dove_peace.png', base);
  if (doveBytes) {
    try {
      const dove = await doc.embedPng(doveBytes);
      const dw = 340;
      const dh = (dove.height / dove.width) * dw;
      page.drawImage(dove, {
        x: (width - dw) / 2,
        y: (height - dh) / 2 - 20,
        width: dw, height: dh,
        opacity: 0.05
      });
    } catch (e) {
      console.error('Failed to embed watermark:', e);
    }
  }

  // Y Coordinate Cursor Tracker
  let cursorY = height - 50;

  // 3. Header Logo & Brand Title
  const logoBytes = await loadAsset('logo.png', base);
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const lw = 50;
      const lh = (logo.height / logo.width) * lw;
      page.drawImage(logo, { x: 45, y: cursorY - lh - 5, width: lw, height: lh });
    } catch (e) {
      console.error('Failed to embed logo:', e);
    }
  }

  // Header texts
  page.drawText('COTTONS MODEL UNITED NATIONS', { x: 110, y: cursorY - 22, size: 16, font: serifBold, color: NAVY });
  page.drawText('CoMUN 2026  •  OFFICIAL ENTRY PASS', { x: 110, y: cursorY - 37, size: 9, font: sansBold, color: MAROON });
  page.drawText('Dates: 30 July – 1 August 2026', { x: 110, y: cursorY - 50, size: 8, font: sans, color: MUTED });

  // Generate QR Code containing the Application ID
  try {
    const qrBuffer = await QRCode.toBuffer(reg.applicationId, {
      type: 'png',
      width: 150,
      margin: 1,
      color: {
        dark: '#070e1d',
        light: '#ffffff',
      }
    });
    const qrImage = await doc.embedPng(new Uint8Array(qrBuffer));
    const qrW = 75;
    page.drawImage(qrImage, { x: width - 45 - qrW, y: cursorY - qrW - 5, width: qrW, height: qrW });

    // Label underneath QR Code
    const labelText = 'SCAN TO VERIFY';
    const labelW = sansBold.widthOfTextAtSize(labelText, 6);
    page.drawText(labelText, {
      x: width - 45 - qrW + (qrW - labelW) / 2,
      y: cursorY - qrW - 14,
      size: 6,
      font: sansBold,
      color: MUTED
    });
  } catch (e) {
    console.error('Failed to generate/embed QR code:', e);
  }

  cursorY -= 80;

  // Solid gold/maroon partition bar
  page.drawRectangle({ x: 45, y: cursorY, width: width - 90, height: 1, color: GOLD_DARK });
  cursorY -= 20;

  // Helpers for structural rendering
  const heading = (title: string, x: number, y: number, w: number) => {
    page.drawRectangle({ x, y: y - 16, width: w, height: 16, color: NAVY });
    page.drawText(safe(title.toUpperCase()), { x: x + 6, y: y - 11, size: 7.5, font: sansBold, color: WHITE });
    return y - 24;
  };

  const drawRow = (label: string, value: string, x: number, y: number, maxValW: number) => {
    page.drawText(safe(label), { x, y, size: 8.5, font: sansBold, color: MUTED });
    const lines = wrap(safe(value || '-'), sans, 8.5, maxValW);
    lines.forEach((line, idx) => {
      page.drawText(line, { x: x + 95, y: y - idx * 11, size: 8.5, font: sans, color: INK });
    });
    // Draw thin rule between rows
    page.drawLine({
      start: { x, y: y - lines.length * 11 },
      end: { x: x + wColL, y: y - lines.length * 11 },
      thickness: 0.3,
      color: rgb(0.9, 0.88, 0.85)
    });
    return y - lines.length * 11 - 10;
  };

  // Two Column Sizing
  const colL_X = 45;
  const wColL = 290;
  const colR_X = 355;
  const wColR = 195;

  let colL_Y = cursorY;
  let colR_Y = cursorY;

  // ─── LEFT COLUMN: Registration details & Delegate Details ───
  colL_Y = heading('Registration Details', colL_X, colL_Y, wColL);

  const typeLabel = reg.type === 'INDIVIDUAL'
    ? `Individual - ${reg.delegationType === 'DOUBLE' ? 'Double' : 'Single'} Delegation`
    : 'Institutional';

  colL_Y = drawRow('Category', typeLabel, colL_X, colL_Y, 185);
  if (reg.committee) {
    colL_Y = drawRow('Committee', reg.committee, colL_X, colL_Y, 185);
  }
  if (reg.portfolio) {
    colL_Y = drawRow('Portfolio Pref.', reg.portfolio, colL_X, colL_Y, 185);
  }
  colL_Y = drawRow('Registered On', reg.submittedAt.toISOString().slice(0, 10), colL_X, colL_Y, 185);

  colL_Y -= 12;

  // Render delegates / institution info
  if (reg.type === 'INDIVIDUAL') {
    reg.delegates.sort((a, b) => a.position - b.position).forEach((d) => {
      const title = reg.delegates.length > 1 ? `Delegate ${d.position} Information` : 'Delegate Information';
      colL_Y = heading(title, colL_X, colL_Y, wColL);
      colL_Y = drawRow('Full Name', d.name, colL_X, colL_Y, 185);
      colL_Y = drawRow('Email', d.email, colL_X, colL_Y, 185);
      colL_Y = drawRow('Phone', d.phone, colL_X, colL_Y, 185);
      colL_Y = drawRow('Institution', d.institution || '-', colL_X, colL_Y, 185);
      colL_Y = drawRow('Grade / Class', `Grade ${d.grade}`, colL_X, colL_Y, 185);
      colL_Y = drawRow('Nationality', d.nationality, colL_X, colL_Y, 185);
      colL_Y = drawRow('MUN Experience', d.experience, colL_X, colL_Y, 185);
      colL_Y -= 12;
    });
  } else {
    colL_Y = heading('Institution Profile', colL_X, colL_Y, wColL);
    colL_Y = drawRow('Name', reg.institutionName || '-', colL_X, colL_Y, 185);

    colL_Y -= 12;
    colL_Y = heading('Teacher-In-Charge', colL_X, colL_Y, wColL);
    colL_Y = drawRow('Name', reg.teacherName || '-', colL_X, colL_Y, 185);
    colL_Y = drawRow('Email', reg.teacherEmail || '-', colL_X, colL_Y, 185);
    colL_Y = drawRow('Phone', reg.teacherPhone || '-', colL_X, colL_Y, 185);

    colL_Y -= 12;
    colL_Y = heading('Head Delegate', colL_X, colL_Y, wColL);
    colL_Y = drawRow('Name', reg.headName || '-', colL_X, colL_Y, 185);
    colL_Y = drawRow('Email', reg.headEmail || '-', colL_X, colL_Y, 185);
    colL_Y = drawRow('Phone', reg.headPhone || '-', colL_X, colL_Y, 185);
  }

  // ─── RIGHT COLUMN: Payment Summary & Instructions ───

  // Gold themed application ID card
  const appIdCardH = 50;
  page.drawRectangle({
    x: colR_X, y: colR_Y - appIdCardH,
    width: wColR, height: appIdCardH,
    color: rgb(1, 0.985, 0.93),
    borderColor: GOLD_DARK, borderWidth: 1
  });
  page.drawText('APPLICATION ID', { x: colR_X + 12, y: colR_Y - 18, size: 7.5, font: sansBold, color: GOLD_DARK });
  page.drawText(reg.applicationId, { x: colR_X + 12, y: colR_Y - 38, size: 15, font: sansBold, color: MAROON });
  colR_Y -= appIdCardH + 18;

  // Gold themed Payment Card
  const payCardH = 75;
  page.drawRectangle({
    x: colR_X, y: colR_Y - payCardH,
    width: wColR, height: payCardH,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: NAVY, borderWidth: 1
  });
  page.drawText('AMOUNT PAYABLE AT DESK', { x: colR_X + 12, y: colR_Y - 18, size: 7.5, font: sansBold, color: NAVY });
  const amtString = reg.amountPayable > 0 ? `${CURRENCY} ${reg.amountPayable}` : 'As applicable';
  page.drawText(amtString, { x: colR_X + 12, y: colR_Y - 42, size: 18, font: serifBold, color: MAROON });
  page.drawText('STATUS: PENDING OFFLINE VERIFICATION', { x: colR_X + 12, y: colR_Y - 60, size: 6.5, font: sansBold, color: GOLD_DARK });
  colR_Y -= payCardH + 20;

  // Rules & Instructions Box
  colR_Y = heading('Entry Rules & Info', colR_X, colR_Y, wColR);

  const bullet = (text: string, x: number, y: number, w: number) => {
    page.drawCircle({ x: x + 4, y: y - 4, radius: 1.5, color: MAROON });
    const lines = wrap(text, sans, 7.5, w - 12);
    lines.forEach((line, idx) => {
      page.drawText(line, { x: x + 12, y: y - 7 - idx * 10, size: 7.5, font: sans, color: INK });
    });
    return y - lines.length * 10 - 6;
  };

  colR_Y = bullet('Bring a physical printed copy of this pass to the registration desk on Day 1.', colR_X, colR_Y, wColR);
  colR_Y = bullet('Produce a valid student ID card or government ID matching your registration details.', colR_X, colR_Y, wColR);
  colR_Y = bullet('Portfolio allocations are strictly subject to Secretariat confirmation.', colR_X, colR_Y, wColR);
  colR_Y = bullet('Standard delegate fee is payable at the desk prior to committee entry.', colR_X, colR_Y, wColR);
  colR_Y = bullet('Dress code: Business Formal / Western Formal / Traditional Attire.', colR_X, colR_Y, wColR);

  // ─── BOTTOM SIGNATURE SECTION ───
  let footerY = 100;
  page.drawLine({ start: { x: 45, y: footerY }, end: { x: 195, y: footerY }, thickness: 0.5, color: MUTED });
  page.drawText('Registrar / Treasurer', { x: 45, y: footerY - 14, size: 7.5, font: sansBold, color: MUTED });

  page.drawLine({ start: { x: width - 195, y: footerY }, end: { x: width - 45, y: footerY }, thickness: 0.5, color: MUTED });
  page.drawText('Director-General / Sec-Gen', { x: width - 195, y: footerY - 14, size: 7.5, font: sansBold, color: MUTED });

  // Centered Footer brand
  page.drawText('Peace Over Power', {
    x: (width - serifItalic.widthOfTextAtSize('Peace Over Power', 12)) / 2,
    y: 46,
    size: 12,
    font: serifItalic,
    color: MAROON
  });
  page.drawText('CoMUN 2026 — OFFICIAL DELEGATE RECORD', {
    x: (width - sansBold.widthOfTextAtSize('CoMUN 2026 — OFFICIAL DELEGATE RECORD', 6.5)) / 2,
    y: 34,
    size: 6.5,
    font: sansBold,
    color: MUTED
  });

  return doc.save();
}

/** Naive word-wrap helper */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const w of words) {
    const test = currentLine ? `${currentLine} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = w;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : ['-'];
}
