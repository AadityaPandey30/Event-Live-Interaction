'use client';

import { AADITYA, DISCLAIMER } from './brand.js';
import { QUESTIONS } from './questions.js';

const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  ink: [18, 22, 29],
  body: [62, 72, 86],
  muted: [131, 144, 164],
  brand: [38, 101, 85],
  gold: [179, 145, 75],
  rule: [213, 217, 226],
};

function sanitize(value) {
  // jsPDF's built-in fonts are WinAnsi; drop anything outside it (emoji, etc.).
  return String(value ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u20B9]/g, '');
}

export async function downloadBusinessHealthReport({ profile, answers, results, assessedAt }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  let y = 0;

  const setColor = (name) => doc.setTextColor(...COLORS[name]);

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (text, { size = 10, style = 'normal', color = 'body', leading = 1.45, gap = 0, width = CONTENT_WIDTH } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    setColor(color);
    const lines = doc.splitTextToSize(sanitize(text), width);
    const lineHeight = size * leading;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    y += gap;
  };

  const rule = (gap = 12) => {
    ensureSpace(gap + 4);
    doc.setDrawColor(...COLORS.rule);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += gap;
  };

  // Cover band
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, PAGE_WIDTH, 132, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(201, 169, 97);
  doc.text('CATALYGN EDGE', MARGIN, 44);
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Business Health Report', MARGIN, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(206, 212, 222);
  doc.text(sanitize(`${profile.name}  |  ${profile.company}`), MARGIN, 100);
  doc.text(sanitize(new Date(assessedAt).toLocaleString('en-IN')), MARGIN, 116);

  y = 168;

  // Overall score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  setColor('brand');
  doc.text(`${results.overallScore}/100`, MARGIN, y);
  doc.setFontSize(13);
  setColor('ink');
  doc.text(sanitize(results.classification.label), MARGIN, y + 26);
  y += 48;
  write(results.classification.interpretation, { size: 10, gap: 4 });
  write(`${results.totalEarned} of ${results.totalMax} points. Scoring version ${results.scoringVersion}.`, {
    size: 8.5,
    color: 'muted',
    gap: 8,
  });

  rule(16);

  // Pillars
  write('Pillar scores', { size: 13, style: 'bold', color: 'ink', gap: 8 });
  for (const pillar of results.pillarScores) {
    ensureSpace(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor('ink');
    doc.text(pillar.label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pillar.score}/100  (${pillar.pointsEarned} of ${pillar.pointsMax} points)`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    const barY = y + 7;
    const barW = CONTENT_WIDTH;
    const filled = Math.max(0, Math.min(1, pillar.score / 100)) * barW;
    doc.setFillColor(236, 238, 242);
    doc.roundedRect(MARGIN, barY, barW, 7, 3.5, 3.5, 'F');
    if (filled > 0) {
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(MARGIN, barY, filled, 7, 3.5, 3.5, 'F');
    }
    y += 26;
  }

  rule(16);

  // Interpretation
  const pillarName = (key) => results.pillarScores.find((p) => p.key === key)?.label || key;
  write('Interpretation', { size: 13, style: 'bold', color: 'ink', gap: 8 });
  write(`Primary area to investigate: ${results.areaToInvestigate.map(pillarName).join(' and ')}`, { size: 10, color: 'body', gap: 4 });
  write(
    `Secondary area to investigate: ${
      results.secondaryArea.length ? results.secondaryArea.map(pillarName).join(' and ') : 'None - a clear strength stands out'
    }`,
    { size: 10, color: 'body', gap: 4 }
  );
  write(`Relative strength: ${results.relativeStrength.map(pillarName).join(' and ')}`, { size: 10, color: 'body', gap: 10 });

  // Recommendations
  write('Recommended next steps', { size: 13, style: 'bold', color: 'ink', gap: 8 });
  for (const rec of results.recommendations) {
    ensureSpace(38);
    write(rec.title, { size: 10, style: 'bold', color: 'ink', gap: 2 });
    write(rec.text, { size: 9.5, color: 'body', gap: 9 });
  }

  // Answer breakdown
  rule(16);
  write('Your answers', { size: 13, style: 'bold', color: 'ink', gap: 8 });
  for (const question of QUESTIONS) {
    const value = answers[question.number];
    ensureSpace(30);
    write(`${question.number}. ${question.prompt}`, { size: 9, color: 'ink', gap: 2, leading: 1.35 });
    write(`${value}/3 - ${question.options[value] || 'Not answered'}`, { size: 8.5, color: 'muted', gap: 7, leading: 1.35 });
  }

  // About Aaditya
  doc.addPage();
  y = MARGIN;
  write('About Aaditya Pandey', { size: 15, style: 'bold', color: 'ink', gap: 4 });
  write(AADITYA.role + ' - Catalygn Edge', { size: 10, style: 'bold', color: 'brand', gap: 10 });
  write(AADITYA.summary, { size: 9.5, color: 'body', gap: 12 });
  for (const item of AADITYA.achievements) {
    ensureSpace(46);
    write(`${item.stat}  ${item.label}`, { size: 12, style: 'bold', color: 'gold', gap: 2 });
    write(item.detail, { size: 9, color: 'body', gap: 10 });
  }
  write(AADITYA.disclaimer, { size: 8.5, color: 'muted', gap: 14 });

  rule(16);
  write('Preliminary self-assessment', { size: 11, style: 'bold', color: 'ink', gap: 6 });
  write(DISCLAIMER, { size: 9, color: 'body', gap: 14 });
  write(`Portfolio: ${AADITYA.portfolioUrl}`, { size: 9, color: 'brand', gap: 2 });
  write(`Contact: ${AADITYA.email}`, { size: 9, color: 'brand' });

  const pages = doc.getNumberOfPages();
  const fileBase = sanitize(`${profile.company}-business-health-report`).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'business-health-report';
  doc.setProperties({ title: `Business Health Report - ${sanitize(profile.company)}`, subject: 'Catalygn Edge Business Health Check', creator: 'Catalygn Edge' });
  doc.setPage(1);
  doc.save(`${fileBase}.pdf`);
  return { pages };
}
