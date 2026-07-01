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
  let page!: PDFPage;
  const width = 595.28;
  const height = 841.89; // A4 Size

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const base = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  const doveBytes = await loadAsset('dove_peace.png', base);
  const logoBytes = await loadAsset('logo.png', base);

  let cursorY = 0;

  const startNewPage = async () => {
    page = doc.addPage([width, height]);
    
    // Outer Border
    page.drawRectangle({
      x: 20, y: 20,
      width: width - 40, height: height - 40,
      borderColor: GOLD_DARK, borderWidth: 1.5,
      color: rgb(0.995, 0.99, 0.985) // very light cream background
    });
    // Inner Border
    page.drawRectangle({
      x: 26, y: 26,
      width: width - 52, height: height - 52,
      borderColor: GOLD_DARK, borderWidth: 0.5,
    });

    // Watermark
    if (doveBytes) {
      try {
        const dove = await doc.embedPng(doveBytes);
        const dw = 380;
        const dh = (dove.height / dove.width) * dw;
        page.drawImage(dove, {
          x: (width - dw) / 2,
          y: (height - dh) / 2,
          width: dw, height: dh,
          opacity: 0.04
        });
      } catch (e) {}
    }

    // Footer
    const footerText = 'Peace Over Power';
    page.drawText(footerText, {
      x: (width - serifItalic.widthOfTextAtSize(footerText, 14)) / 2,
      y: 40,
      size: 14,
      font: serifItalic,
      color: MAROON
    });

    cursorY = height - 50;
  };

  const checkSpace = async (needed: number) => {
    if (cursorY - needed < 70) {
      await startNewPage();
      cursorY -= 20; // Top padding for content on new page
    }
  };

  // --- START DOCUMENT ---
  await startNewPage();

  // Header Logo
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const lw = 65;
      const lh = (logo.height / logo.width) * lw;
      page.drawImage(logo, { x: 45, y: cursorY - lh, width: lw, height: lh });
    } catch (e) {}
  }

  // Header Title
  page.drawText('COTTONS MODEL UNITED NATIONS', { x: 125, y: cursorY - 20, size: 18, font: serifBold, color: NAVY });
  page.drawText('CoMUN 2026  •  OFFICIAL ENTRY PASS', { x: 125, y: cursorY - 38, size: 10, font: sansBold, color: MAROON });
  page.drawText('Dates: 30 July – 1 August 2026', { x: 125, y: cursorY - 52, size: 10, font: sans, color: MUTED });

  // QR Code
  try {
    const qrBuffer = await QRCode.toBuffer(reg.applicationId, {
      type: 'png',
      width: 250,
      margin: 1,
      color: { dark: '#070e1d', light: '#ffffff' }
    });
    const qrImage = await doc.embedPng(new Uint8Array(qrBuffer));
    const qrW = 95;
    page.drawImage(qrImage, { x: width - 45 - qrW, y: cursorY - qrW, width: qrW, height: qrW });
    
    const labelText = 'SCAN TO VERIFY';
    const labelW = sansBold.widthOfTextAtSize(labelText, 7);
    page.drawText(labelText, {
      x: width - 45 - qrW + (qrW - labelW) / 2,
      y: cursorY - qrW - 10,
      size: 7,
      font: sansBold,
      color: MUTED
    });
  } catch (e) {}

  cursorY -= 115;
  
  // Divider
  page.drawRectangle({ x: 45, y: cursorY, width: width - 90, height: 1.5, color: GOLD_DARK });
  cursorY -= 30;

  // App ID & Payment Blocks
  await checkSpace(80);
  const blockW = (width - 90 - 15) / 2; // two blocks with 15px gap
  
  // App ID
  page.drawRectangle({
    x: 45, y: cursorY - 60,
    width: blockW, height: 60,
    color: rgb(1, 0.985, 0.93),
    borderColor: GOLD_DARK, borderWidth: 1
  });
  page.drawText('APPLICATION ID', { x: 55, y: cursorY - 20, size: 9, font: sansBold, color: GOLD_DARK });
  page.drawText(reg.applicationId, { x: 55, y: cursorY - 45, size: 18, font: sansBold, color: MAROON });

  // Payment
  page.drawRectangle({
    x: 45 + blockW + 15, y: cursorY - 60,
    width: blockW, height: 60,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: NAVY, borderWidth: 1
  });
  page.drawText('AMOUNT PAYABLE AT DESK', { x: 45 + blockW + 25, y: cursorY - 20, size: 9, font: sansBold, color: NAVY });
  const amtString = reg.amountPayable > 0 ? `${CURRENCY} ${reg.amountPayable}` : 'As applicable';
  page.drawText(amtString, { x: 45 + blockW + 25, y: cursorY - 45, size: 18, font: serifBold, color: MAROON });

  cursorY -= 90;

  // Helpers for structural rendering
  const drawHeading = async (title: string) => {
    await checkSpace(40);
    page.drawRectangle({ x: 45, y: cursorY - 20, width: width - 90, height: 20, color: NAVY });
    page.drawText(safe(title.toUpperCase()), { x: 55, y: cursorY - 14, size: 10, font: sansBold, color: WHITE });
    cursorY -= 35;
  };

  const drawRow = async (label: string, value: string) => {
    const valText = safe(value || '-');
    const maxValW = 320;
    const lines = wrap(valText, sans, 11, maxValW);
    const textHeight = lines.length * 14;
    const rowHeight = Math.max(20, textHeight) + 16;
    
    await checkSpace(rowHeight + 10);
    
    page.drawText(safe(label), { x: 55, y: cursorY - 12, size: 11, font: sansBold, color: MUTED });
    
    lines.forEach((line, idx) => {
      page.drawText(line, { x: 200, y: cursorY - 12 - (idx * 14), size: 11, font: sans, color: INK });
    });
    
    cursorY -= rowHeight;
    
    page.drawLine({
      start: { x: 45, y: cursorY },
      end: { x: width - 45, y: cursorY },
      thickness: 0.5,
      color: rgb(0.9, 0.88, 0.85)
    });
    cursorY -= 10;
  };

  // --- CONTENT ---
  await drawHeading('Registration Details');
  
  const typeLabel = reg.type === 'INDIVIDUAL'
    ? `Individual - ${reg.delegationType === 'DOUBLE' ? 'Double' : 'Single'} Delegation`
    : 'Institutional';
  
  await drawRow('Category', typeLabel);
  if (reg.committee) await drawRow('Committee', reg.committee);
  if (reg.portfolio) await drawRow('Portfolio Pref.', reg.portfolio);
  await drawRow('Registered On', reg.submittedAt.toISOString().slice(0, 10));

  cursorY -= 10;

  if (reg.type === 'INDIVIDUAL') {
    const sorted = [...reg.delegates].sort((a, b) => a.position - b.position);
    for (const d of sorted) {
      const title = reg.delegates.length > 1 ? `Delegate ${d.position} Information` : 'Delegate Information';
      await drawHeading(title);
      await drawRow('Full Name', d.name);
      await drawRow('Email', d.email);
      await drawRow('Phone', d.phone);
      await drawRow('Institution', d.institution || '-');
      await drawRow('Grade / Class', `Grade ${d.grade}`);
      await drawRow('Nationality', d.nationality);
      await drawRow('MUN Experience', d.experience);
      cursorY -= 10;
    }
  } else {
    await drawHeading('Institution Profile');
    await drawRow('Name', reg.institutionName || '-');

    cursorY -= 10;
    await drawHeading('Teacher-In-Charge');
    await drawRow('Name', reg.teacherName || '-');
    await drawRow('Email', reg.teacherEmail || '-');
    await drawRow('Phone', reg.teacherPhone || '-');

    cursorY -= 10;
    await drawHeading('Head Delegate');
    await drawRow('Name', reg.headName || '-');
    await drawRow('Email', reg.headEmail || '-');
    await drawRow('Phone', reg.headPhone || '-');
  }

  // --- INSTRUCTIONS ---
  cursorY -= 10;
  await drawHeading('Entry Rules & Information');
  
  const bullet = async (text: string) => {
    const maxW = width - 115;
    const lines = wrap(text, sans, 10, maxW);
    const rowH = lines.length * 14 + 8;
    
    await checkSpace(rowH + 10);
    
    page.drawCircle({ x: 55, y: cursorY - 9, radius: 2, color: MAROON });
    lines.forEach((line, idx) => {
      page.drawText(line, { x: 65, y: cursorY - 12 - idx * 14, size: 10, font: sans, color: INK });
    });
    
    cursorY -= rowH;
  };

  await bullet('Bring a physical printed copy of this pass to the registration desk on Day 1.');
  await bullet('Produce a valid student ID card or government ID matching your registration details.');
  await bullet('Portfolio allocations are strictly subject to Secretariat confirmation.');
  await bullet('Standard delegate fee is payable at the desk prior to committee entry. Status is pending until verified offline.');
  await bullet('Dress code: Business Formal / Western Formal / Traditional Attire as per CoMUN guidelines.');

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
