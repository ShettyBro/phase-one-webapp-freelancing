/**
 * Registration PDF generator — CoMUN 2026
 *
 * Architecture notes:
 * - Logo and watermark images are embedded into the PDFDocument ONCE, then the
 *   pre-embedded PDFImage object is reused on every page.  Calling doc.embedPng()
 *   inside a per-page helper caused the bytes to be duplicated in the PDF XObject
 *   table, which some renderers display as a large coloured blob on subsequent pages.
 * - Single Delegation → fits on 1 page.
 * - Double Delegation / Institutional → auto-flows to 2–3 pages.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { CURRENCY } from './domain';

// ─── Brand palette ────────────────────────────────────────────────────────────
const C_GOLD      = rgb(0.788, 0.639, 0.000); // #C9A300
const C_GOLD_LITE = rgb(1.000, 0.980, 0.920); // warm cream tint
const C_MAROON    = rgb(0.569, 0.149, 0.149); // #912626
const C_NAVY      = rgb(0.027, 0.055, 0.114); // #070e1d
const C_INK       = rgb(0.130, 0.150, 0.200);
const C_MUTED     = rgb(0.420, 0.420, 0.450);
const C_WHITE     = rgb(1, 1, 1);
const C_RULE      = rgb(0.880, 0.870, 0.850);
const C_BG        = rgb(0.995, 0.990, 0.982); // page background

// ─── Page geometry ────────────────────────────────────────────────────────────
const PW = 595.28; // A4 width
const PH = 841.89; // A4 height
const ML = 45;     // margin left
const MR = 45;     // margin right
const MT = 45;     // margin top (first page uses header; continuation uses less)
const MB = 55;     // margin bottom (reserved for footer)
const CW = PW - ML - MR; // content width = 505

// ─── Public interfaces ────────────────────────────────────────────────────────
export interface PdfDelegate {
  position:    number;
  name:        string;
  email:       string;
  phone:       string;
  grade:       number;
  nationality: string;
  experience:  string;
  institution: string | null;
}

export interface PdfRegistration {
  applicationId:  string;
  type:           'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType: 'SINGLE' | 'DOUBLE' | null;
  committee:      string | null;
  portfolio:      string | null;
  institutionName: string | null;
  teacherName:    string | null;
  teacherEmail:   string | null;
  teacherPhone:   string | null;
  headName:       string | null;
  headEmail:      string | null;
  headPhone:      string | null;
  amountPayable:  number;
  submittedAt:    Date;
  delegates:      PdfDelegate[];
}

// ─── Asset loader ─────────────────────────────────────────────────────────────
async function loadAsset(
  filename: string,
  siteUrl?: string,
): Promise<Uint8Array | null> {
  // Try local filesystem first (Netlify includes src/public via netlify.toml)
  const candidates = [
    path.join(process.cwd(), 'src', 'public', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), 'dist', filename),
    path.join(process.cwd(), filename),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return new Uint8Array(fs.readFileSync(p));
    } catch { /* skip */ }
  }
  // HTTP fallback
  if (siteUrl) {
    try {
      const res = await fetch(`${siteUrl.replace(/\/$/, '')}/${filename}`);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch { /* skip */ }
  }
  return null;
}

// ─── Text helpers ─────────────────────────────────────────────────────────────
/** Strip non-WinAnsi chars so StandardFonts don't throw. */
const safe = (s: string) =>
  s.replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '?');

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && font.widthOfTextAtSize(test, size) > maxW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : ['-'];
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function buildRegistrationPdf(
  reg: PdfRegistration,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Load fonts
  const fSerif     = await doc.embedFont(StandardFonts.TimesRoman);
  const fSerifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fSerifItal = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fSans      = await doc.embedFont(StandardFonts.Helvetica);
  const fSansBold  = await doc.embedFont(StandardFonts.HelveticaBold);

  // Embed images ONCE — critical; never call embedPng inside a per-page helper
  const base = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  let imgLogo: PDFImage | null = null;
  let imgDove: PDFImage | null = null;

  const logoBytes = await loadAsset('logo.png', base);
  if (logoBytes) {
    try { imgLogo = await doc.embedPng(logoBytes); } catch { /* skip */ }
  }
  const doveBytes = await loadAsset('dove_peace.png', base);
  if (doveBytes) {
    try { imgDove = await doc.embedPng(doveBytes); } catch { /* skip */ }
  }

  // Generate QR code PNG once
  let imgQr: PDFImage | null = null;
  try {
    const qrBuf = await QRCode.toBuffer(reg.applicationId, {
      type: 'png', width: 200, margin: 1,
      color: { dark: '#070e1d', light: '#ffffff' },
    });
    imgQr = await doc.embedPng(new Uint8Array(qrBuf));
  } catch { /* skip */ }

  // ─── Page state ─────────────────────────────────────────────────────────────
  let page!: PDFPage;
  let curY = 0;
  let pageNum = 0;

  function addPage() {
    pageNum++;
    page = doc.addPage([PW, PH]);

    // Cream background
    page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C_BG });

    // Outer border
    page.drawRectangle({
      x: 16, y: 16, width: PW - 32, height: PH - 32,
      borderColor: C_GOLD, borderWidth: 1.5,
    });
    // Inner border (thin)
    page.drawRectangle({
      x: 21, y: 21, width: PW - 42, height: PH - 42,
      borderColor: C_GOLD, borderWidth: 0.4,
    });

    // Watermark — reuse pre-embedded image
    if (imgDove) {
      const dw = 360;
      const dh = (imgDove.height / imgDove.width) * dw;
      page.drawImage(imgDove, {
        x: (PW - dw) / 2,
        y: (PH - dh) / 2 + 10,
        width: dw, height: dh,
        opacity: 0.045,
      });
    }

    // Footer bar
    page.drawRectangle({ x: 0, y: 0, width: PW, height: 28, color: C_NAVY });
    const footerLeft = safe('CoMUN 2026  •  Official Delegate Record');
    page.drawText(footerLeft, {
      x: ML, y: 9, size: 7.5, font: fSansBold, color: C_GOLD,
    });
    const pageLabel = `Page ${pageNum}`;
    page.drawText(pageLabel, {
      x: PW - MR - fSansBold.widthOfTextAtSize(pageLabel, 7.5),
      y: 9, size: 7.5, font: fSansBold, color: C_GOLD,
    });

    // Set cursor just inside top margin
    curY = PH - MT;
  }

  /** Ensure at least `needed` pts remain before MB; add page if not. */
  function ensureSpace(needed: number) {
    if (curY - needed < MB) {
      addPage();
    }
  }

  // ─── Reusable drawing helpers ────────────────────────────────────────────────
  const SECTION_H = 22;
  const ROW_H     = 26;
  const LABEL_W   = 150;
  const VALUE_X   = ML + LABEL_W;
  const VALUE_W   = CW - LABEL_W;

  function drawSectionHeading(title: string) {
    ensureSpace(SECTION_H + ROW_H);
    page.drawRectangle({
      x: ML, y: curY - SECTION_H,
      width: CW, height: SECTION_H,
      color: C_NAVY,
    });
    // Left gold accent stripe
    page.drawRectangle({
      x: ML, y: curY - SECTION_H,
      width: 4, height: SECTION_H,
      color: C_GOLD,
    });
    page.drawText(safe(title.toUpperCase()), {
      x: ML + 12, y: curY - 15,
      size: 8.5, font: fSansBold, color: C_WHITE,
    });
    curY -= SECTION_H + 6;
  }

  function drawRow(label: string, value: string) {
    const valSafe = safe(value || '—');
    const lines = wrap(valSafe, fSans, 9.5, VALUE_W - 10);
    const rowHeight = Math.max(ROW_H, lines.length * 13 + 10);

    ensureSpace(rowHeight);

    page.drawText(safe(label), {
      x: ML + 8, y: curY - 14,
      size: 9, font: fSansBold, color: C_MUTED,
    });
    lines.forEach((ln, i) => {
      page.drawText(ln, {
        x: VALUE_X, y: curY - 14 - i * 13,
        size: 9.5, font: fSans, color: C_INK,
      });
    });
    // Thin rule below row
    page.drawLine({
      start: { x: ML, y: curY - rowHeight + 2 },
      end:   { x: ML + CW, y: curY - rowHeight + 2 },
      thickness: 0.4, color: C_RULE,
    });
    curY -= rowHeight;
  }

  function drawBullet(text: string) {
    const lines = wrap(safe(text), fSans, 9, CW - 22);
    const h = Math.max(18, lines.length * 13 + 6);
    ensureSpace(h);
    page.drawCircle({ x: ML + 7, y: curY - 9, radius: 2, color: C_MAROON });
    lines.forEach((ln, i) => {
      page.drawText(ln, {
        x: ML + 16, y: curY - 13 - i * 13,
        size: 9, font: fSans, color: C_INK,
      });
    });
    curY -= h;
  }

  // ── PAGE 1: Header ───────────────────────────────────────────────────────────
  addPage();

  // Logo (top-left)
  const HEADER_H = 90;
  if (imgLogo) {
    const lw = 56;
    const lh = (imgLogo.height / imgLogo.width) * lw;
    page.drawImage(imgLogo, { x: ML, y: curY - lh, width: lw, height: lh });
  }

  // Brand name + tagline
  const textX = ML + 66;
  page.drawText('COTTONS MODEL UNITED NATIONS', {
    x: textX, y: curY - 20,
    size: 15, font: fSerifBold, color: C_NAVY,
  });
  page.drawText('CoMUN 2026  •  Official Entry Pass', {
    x: textX, y: curY - 36,
    size: 9.5, font: fSansBold, color: C_MAROON,
  });
  page.drawText('Dates: 30 July – 1 August 2026', {
    x: textX, y: curY - 52,
    size: 9, font: fSerif, color: C_MUTED,
  });
  page.drawText('Venue: Cottons Higher Secondary School, Bangalore', {
    x: textX, y: curY - 65,
    size: 9, font: fSerif, color: C_MUTED,
  });

  // QR code (top-right) — page 1 only
  const QR_SZ = 82;
  if (imgQr) {
    page.drawImage(imgQr, {
      x: PW - MR - QR_SZ,
      y: curY - QR_SZ,
      width: QR_SZ, height: QR_SZ,
    });
    const lbl = 'SCAN TO VERIFY';
    const lblW = fSansBold.widthOfTextAtSize(lbl, 6.5);
    page.drawText(lbl, {
      x: PW - MR - QR_SZ + (QR_SZ - lblW) / 2,
      y: curY - QR_SZ - 11,
      size: 6.5, font: fSansBold, color: C_MUTED,
    });
  }

  curY -= HEADER_H + 12;

  // Gold divider
  page.drawRectangle({ x: ML, y: curY, width: CW, height: 2, color: C_GOLD });
  curY -= 14;

  // ── Application ID + Amount cards (side by side) ─────────────────────────────
  const CARD_H = 58;
  const GAP    = 12;
  const CARD_W = (CW - GAP) / 2;

  // App ID card
  page.drawRectangle({
    x: ML, y: curY - CARD_H, width: CARD_W, height: CARD_H,
    color: C_GOLD_LITE, borderColor: C_GOLD, borderWidth: 1,
  });
  page.drawText('APPLICATION ID', {
    x: ML + 10, y: curY - 18,
    size: 7.5, font: fSansBold, color: C_GOLD,
  });
  page.drawText(reg.applicationId, {
    x: ML + 10, y: curY - 42,
    size: 17, font: fSansBold, color: C_MAROON,
  });

  // Amount card
  const amtX = ML + CARD_W + GAP;
  const amtStr = reg.amountPayable > 0
    ? `${CURRENCY} ${reg.amountPayable.toLocaleString()}`
    : 'At desk — per delegate';
  page.drawRectangle({
    x: amtX, y: curY - CARD_H, width: CARD_W, height: CARD_H,
    color: rgb(0.970, 0.975, 0.990), borderColor: C_NAVY, borderWidth: 1,
  });
  page.drawText('AMOUNT PAYABLE AT DESK', {
    x: amtX + 10, y: curY - 18,
    size: 7.5, font: fSansBold, color: C_NAVY,
  });
  page.drawText(amtStr, {
    x: amtX + 10, y: curY - 42,
    size: reg.amountPayable > 0 ? 17 : 10, font: fSansBold, color: C_MAROON,
  });

  curY -= CARD_H + 18;

  // ── Registration Details ─────────────────────────────────────────────────────
  const typeLabel = reg.type === 'INDIVIDUAL'
    ? `Individual — ${reg.delegationType === 'DOUBLE' ? 'Double' : 'Single'} Delegation`
    : 'Institutional';

  drawSectionHeading('Registration Details');
  drawRow('Registration Type', typeLabel);
  if (reg.committee) drawRow('Committee', reg.committee);
  if (reg.portfolio)  drawRow('Portfolio Preference', reg.portfolio);
  drawRow('Submission Date',
    reg.submittedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));

  curY -= 8;

  // ── Delegate / Institution details ───────────────────────────────────────────
  if (reg.type === 'INDIVIDUAL') {
    const sorted = [...reg.delegates].sort((a, b) => a.position - b.position);
    for (const d of sorted) {
      const heading = sorted.length > 1
        ? `Delegate ${d.position} — ${d.name.trim() || 'Information'}`
        : 'Delegate Information';
      drawSectionHeading(heading);
      drawRow('Full Name',       d.name);
      drawRow('Email Address',   d.email);
      drawRow('Phone Number',    d.phone);
      drawRow('Institution',     d.institution || 'Not specified');
      drawRow('Grade / Class',   `Grade ${d.grade}`);
      drawRow('Nationality',     d.nationality);
      drawRow('MUN Experience',  d.experience);
      curY -= 8;
    }
  } else {
    drawSectionHeading('Institution');
    drawRow('Institution Name', reg.institutionName || '—');

    curY -= 4;
    drawSectionHeading('Teacher In Charge');
    drawRow('Full Name',     reg.teacherName  || '—');
    drawRow('Email Address', reg.teacherEmail || '—');
    drawRow('Phone Number',  reg.teacherPhone || '—');

    curY -= 4;
    drawSectionHeading('Head Delegate');
    drawRow('Full Name',     reg.headName  || '—');
    drawRow('Email Address', reg.headEmail || '—');
    drawRow('Phone Number',  reg.headPhone || '—');

    curY -= 8;
  }

  // ── Entry Instructions ───────────────────────────────────────────────────────
  drawSectionHeading('Entry Instructions');
  drawBullet('Bring a printed copy of this pass to the Registration Desk on Day 1 of the conference.');
  drawBullet('Carry a valid student ID or government-issued photo ID matching the details above.');
  drawBullet('Portfolio allocations are subject to Secretariat confirmation; no changes after closing date.');
  drawBullet('Fees are payable in cash at the desk. This pass does not confirm payment.');
  drawBullet('Dress code: Business Formal, Western Formal, or Traditional Attire as per CoMUN guidelines.');

  curY -= 12;
  // Italicised sign-off
  const motto = 'Peace Over Power';
  const mottoW = fSerifItal.widthOfTextAtSize(motto, 13);
  ensureSpace(30);
  page.drawText(motto, {
    x: (PW - mottoW) / 2, y: curY - 14,
    size: 13, font: fSerifItal, color: C_MAROON,
  });

  return doc.save();
}
