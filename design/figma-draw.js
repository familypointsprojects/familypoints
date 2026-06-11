/* global figma */
/* eslint-disable no-unused-vars */

/**
 * EasyQuest — Figma Auto-Draw Script
 *
 * КАК ИСПОЛЬЗОВАТЬ:
 * 1. Открой файл Figma: https://www.figma.com/design/rb2UcYWVYLBdtkeOTF9Kpk/
 * 2. В браузере нажми F12 → Console (или в Figma Desktop: Plugins → Development → Open Console)
 * 3. Вставь весь этот код и нажми Enter
 *
 * АЛЬТЕРНАТИВА через Figma Plugin "Script Runner" или "Design Tokens":
 * - Установи плагин "Scripter" из Figma Community
 * - Вставь этот код и запусти
 */

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  brand:      { r: 0.486, g: 0.227, b: 0.929, a: 1 }, // #7C3AED
  brand2:     { r: 0.659, g: 0.333, b: 0.973, a: 1 }, // #A855F7
  gold:       { r: 0.961, g: 0.620, b: 0.043, a: 1 }, // #F59E0B
  green:      { r: 0.063, g: 0.725, b: 0.506, a: 1 }, // #10B981
  red:        { r: 0.937, g: 0.267, b: 0.267, a: 1 }, // #EF4444
  orange:     { r: 0.976, g: 0.451, b: 0.086, a: 1 }, // #F97316
  childBg:    { r: 0.051, g: 0.039, b: 0.122, a: 1 }, // #0D0A1F
  childCard:  { r: 0.102, g: 0.063, b: 0.208, a: 1 }, // #1A1035
  parentBg:   { r: 0.961, g: 0.953, b: 1.000, a: 1 }, // #F5F3FF
  white:      { r: 1, g: 1, b: 1, a: 1 },
  textDark:   { r: 0.102, g: 0.039, b: 0.235, a: 1 }, // #1A0A3C
  textMid:    { r: 0.420, g: 0.447, b: 0.502, a: 1 }, // #6B7280
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Extra Bold" });
}

function rect(x, y, w, h, fill, radius = 0) {
  const r = figma.createRectangle();
  r.x = x; r.y = y; r.resize(w, h);
  r.fills = [{ type: 'SOLID', color: fill }];
  if (radius) r.cornerRadius = radius;
  return r;
}

function text(content, x, y, size, weight, color, width = 200) {
  const t = figma.createText();
  t.x = x; t.y = y;
  t.characters = content;
  t.fontSize = size;
  t.fontName = { family: "Inter", style: weight };
  t.fills = [{ type: 'SOLID', color: color }];
  t.textAutoResize = 'HEIGHT';
  if (width) { t.resize(width, t.height); }
  return t;
}

function phone(x, y, label) {
  // Phone frame 300×634 inside bezel
  const bezel = rect(x, y, 320, 660, { r: 0.08, g: 0.063, b: 0.122, a: 1 }, 44);

  const labelT = figma.createText();
  labelT.x = x; labelT.y = y - 28;
  labelT.resize(320, 20);
  labelT.textAlignHorizontal = 'CENTER';
  labelT.characters = label;
  labelT.fontSize = 11;
  labelT.fontName = { family: "Inter", style: "Semi Bold" };
  labelT.fills = [{ type: 'SOLID', color: { r: 0.353, g: 0.306, b: 0.502, a: 1 } }];

  return { bezel, labelT, screenX: x + 10, screenY: y + 13, screenW: 300, screenH: 634 };
}

function screen(x, y, w, h, bgColor, radius = 36) {
  return rect(x, y, w, h, bgColor, radius);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  await loadFonts();

  const page = figma.currentPage;
  // Clear page
  [...page.children].forEach(n => n.remove());

  // ── SECTION TITLE ──
  const titleBg = rect(-80, -80, 3000, 2000, { r: 0.039, g: 0.031, b: 0.078, a: 1 });
  page.appendChild(titleBg);

  // ── CHILD SECTION LABEL ──
  const childLabel = text('👾  ДЕТСКИЙ ИНТЕРФЕЙС  ·  7–12 ЛЕТ', 0, 0, 13, 'Extra Bold',
    { r: 0.294, g: 0.243, b: 0.447, a: 1 }, 700);
  page.appendChild(childLabel);

  // ════════════════════════
  // CHILD DASHBOARD FRAME
  // ════════════════════════
  const cd = figma.createFrame();
  cd.name = '📱 Child · Dashboard';
  cd.x = 0; cd.y = 40;
  cd.resize(300, 634);
  cd.cornerRadius = 36;
  cd.fills = [{ type: 'SOLID', color: C.childBg }];
  cd.clipsContent = true;
  page.appendChild(cd);

  // hero gradient bg
  const heroBg = rect(0, 0, 300, 200, { r: 0.176, g: 0.059, b: 0.431, a: 1 }, 0);
  cd.appendChild(heroBg);

  // Status bar
  const statusT = text('9:41', 20, 14, 12, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 60);
  cd.appendChild(statusT);

  // Greeting
  const greet = text('Привет,', 20, 52, 12, 'Semi Bold', { r: 0.608, g: 0.537, b: 0.800, a: 1 }, 200);
  cd.appendChild(greet);
  const nameT = text('Саша! 👋', 20, 68, 20, 'Extra Bold', C.white, 200);
  cd.appendChild(nameT);

  // Streak badge
  const streakBg = rect(218, 52, 62, 28, { r: 0.976, g: 0.451, b: 0.086, a: 0.15 }, 14);
  cd.appendChild(streakBg);
  const streakT = text('🔥 7 дн', 224, 58, 11, 'Extra Bold', { r: 0.984, g: 0.573, b: 0.188, a: 1 }, 56);
  cd.appendChild(streakT);

  // Avatar
  const avatarBg = rect(20, 105, 68, 68, { r: 0.486, g: 0.227, b: 0.929, a: 1 }, 22);
  cd.appendChild(avatarBg);
  const avatarEmoji = text('🧙', 26, 112, 34, 'Regular', C.white, 56);
  cd.appendChild(avatarEmoji);

  // Level badge
  const lvlBg = rect(22, 164, 64, 20, C.gold, 10);
  cd.appendChild(lvlBg);
  const lvlT = text('LVL 5', 28, 167, 10, 'Extra Bold', { r: 0.478, g: 0.247, b: 0, a: 1 }, 52);
  cd.appendChild(lvlT);

  // XP label
  const xpRoleT = text('Маг Учёбы', 104, 104, 11, 'Semi Bold', { r: 0.608, g: 0.537, b: 0.800, a: 1 }, 120);
  cd.appendChild(xpRoleT);
  const xpNumT = text('620 / 1000 XP', 200, 104, 11, 'Semi Bold', { r: 0.608, g: 0.537, b: 0.800, a: 1 }, 90);
  cd.appendChild(xpNumT);

  // XP bar bg
  const xpBarBg = rect(104, 122, 176, 10, { r: 1, g: 1, b: 1, a: 0.1 }, 5);
  cd.appendChild(xpBarBg);
  // XP bar fill
  const xpFill = rect(104, 122, 110, 10, C.brand, 5);
  cd.appendChild(xpFill);

  // Coins
  const coinBg = rect(104, 140, 110, 28, { r: 0.961, g: 0.620, b: 0.043, a: 0.12 }, 14);
  cd.appendChild(coinBg);
  const coinT = text('🪙 340 монет', 110, 146, 12, 'Extra Bold', { r: 0.988, g: 0.827, b: 0.341, a: 1 }, 100);
  cd.appendChild(coinT);
  const pendBg = rect(220, 140, 64, 28, { r: 0.659, g: 0.333, b: 0.973, a: 0.12 }, 14);
  cd.appendChild(pendBg);
  const pendT = text('+50 ждёт', 224, 147, 10, 'Extra Bold', { r: 0.659, g: 0.333, b: 0.973, a: 1 }, 58);
  cd.appendChild(pendT);

  // Section title
  const secT = text('⚔️  АКТИВНЫЕ КВЕСТЫ', 16, 200, 10, 'Extra Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 270);
  cd.appendChild(secT);

  // Quest card 1
  const qc1 = rect(16, 216, 268, 62, C.childCard, 18);
  cd.appendChild(qc1);
  const qc1bar = rect(16, 216, 3, 62, C.brand, 2);
  cd.appendChild(qc1bar);
  const qc1icon = rect(30, 228, 40, 40, { r: 0.486, g: 0.227, b: 0.929, a: 0.15 }, 12);
  cd.appendChild(qc1icon);
  const qc1iconT = text('📚', 35, 232, 22, 'Regular', C.white, 30);
  cd.appendChild(qc1iconT);
  const qc1title = text('Прочитать 20 страниц', 80, 222, 13, 'Extra Bold', { r: 0.910, g: 0.878, b: 0.973, a: 1 }, 140);
  cd.appendChild(qc1title);
  const qc1meta = text('Ежедневный · до 21:00', 80, 241, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 140);
  cd.appendChild(qc1meta);
  const qc1pts = text('🪙 30', 224, 222, 13, 'Extra Bold', C.gold, 56);
  cd.appendChild(qc1pts);
  const qc1btn = rect(222, 244, 52, 24, C.brand, 10);
  cd.appendChild(qc1btn);
  const qc1btnT = text('Готово!', 226, 249, 10, 'Extra Bold', C.white, 44);
  cd.appendChild(qc1btnT);

  // Quest card 2
  const qc2 = rect(16, 286, 268, 62, C.childCard, 18);
  cd.appendChild(qc2);
  const qc2bar = rect(16, 286, 3, 62, C.gold, 2);
  cd.appendChild(qc2bar);
  const qc2iconBg = rect(30, 298, 40, 40, { r: 0.961, g: 0.620, b: 0.043, a: 0.12 }, 12);
  cd.appendChild(qc2iconBg);
  const qc2iconT = text('🧹', 35, 302, 22, 'Regular', C.white, 30);
  cd.appendChild(qc2iconT);
  const qc2title = text('Убраться в комнате', 80, 292, 13, 'Extra Bold', { r: 0.910, g: 0.878, b: 0.973, a: 1 }, 150);
  cd.appendChild(qc2title);
  const qc2meta = text('На проверке 🕐', 80, 311, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 140);
  cd.appendChild(qc2meta);
  const qc2pts = text('🪙 50', 224, 300, 13, 'Extra Bold', C.gold, 56);
  cd.appendChild(qc2pts);

  // Quest card 3
  const qc3 = rect(16, 356, 268, 62, C.childCard, 18);
  cd.appendChild(qc3);
  const qc3bar = rect(16, 356, 3, 62, C.green, 2);
  cd.appendChild(qc3bar);
  const qc3iconBg = rect(30, 368, 40, 40, { r: 0.063, g: 0.725, b: 0.506, a: 0.12 }, 12);
  cd.appendChild(qc3iconBg);
  const qc3iconT = text('🏃', 35, 372, 22, 'Regular', C.white, 30);
  cd.appendChild(qc3iconT);
  const qc3title = text('Прогулка 30 минут', 80, 362, 13, 'Extra Bold', { r: 0.910, g: 0.878, b: 0.973, a: 1 }, 140);
  cd.appendChild(qc3title);
  const qc3meta = text('Срок: 3 дня', 80, 381, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 140);
  cd.appendChild(qc3meta);
  const qc3pts = text('🪙 40', 224, 362, 13, 'Extra Bold', C.gold, 56);
  cd.appendChild(qc3pts);
  const qc3btn = rect(222, 384, 52, 24, C.brand, 10);
  cd.appendChild(qc3btn);
  const qc3btnT = text('Готово!', 226, 389, 10, 'Extra Bold', C.white, 44);
  cd.appendChild(qc3btnT);

  // Goal bar
  const goalBg = rect(16, 428, 268, 46, { r: 0.486, g: 0.227, b: 0.929, a: 0.06 }, 14);
  cd.appendChild(goalBg);
  const goalT1 = text('🎯', 28, 437, 16, 'Regular', C.white, 24);
  cd.appendChild(goalT1);
  const goalT2 = text('Ближайшая цель', 56, 432, 11, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 150);
  cd.appendChild(goalT2);
  const goalT3 = text('Lego Technic · 500 монет', 56, 447, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 160);
  cd.appendChild(goalT3);
  const goalT4 = text('-160', 250, 439, 11, 'Extra Bold', C.gold, 40);
  cd.appendChild(goalT4);

  // Bottom nav
  const navBg = rect(0, 590, 300, 44, C.childCard, 0);
  cd.appendChild(navBg);
  const navTop = rect(0, 590, 300, 1, { r: 0.486, g: 0.227, b: 0.929, a: 0.25 });
  cd.appendChild(navTop);
  const navItems = [
    { e: '🏠', l: 'Главная', active: true },
    { e: '⚔️', l: 'Квесты', active: false },
    { e: '🎁', l: 'Награды', active: false },
    { e: '🪙', l: 'Баланс', active: false },
  ];
  navItems.forEach((item, i) => {
    const nx = 18 + i * 67;
    const eT = text(item.e, nx, 596, 18, 'Regular', C.white, 30);
    cd.appendChild(eT);
    const lT = text(item.l, nx - 4, 618, 9, 'Extra Bold', item.active ? C.brand2 : { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 50);
    cd.appendChild(lT);
  });

  // ════════════════════════
  // PARENT DASHBOARD FRAME
  // ════════════════════════
  const pd = figma.createFrame();
  pd.name = '📱 Parent · Dashboard';
  pd.x = 680; pd.y = 40;
  pd.resize(300, 634);
  pd.cornerRadius = 36;
  pd.fills = [{ type: 'SOLID', color: C.parentBg }];
  pd.clipsContent = true;
  page.appendChild(pd);

  // Parent section label
  const parentLabel = text('👨‍👩‍👧  ПАНЕЛЬ РОДИТЕЛЯ', 680, 0, 13, 'Extra Bold',
    { r: 0.294, g: 0.243, b: 0.447, a: 1 }, 400);
  page.appendChild(parentLabel);

  // Status bar
  const psb = text('9:41', 20, 14, 12, 'Extra Bold', C.textDark, 60);
  pd.appendChild(psb);

  // Header bg
  const phBg = rect(0, 36, 300, 110, C.white, 0);
  pd.appendChild(phBg);

  // Greeting
  const pg1 = text('Добро пожаловать,', 18, 42, 11, 'Semi Bold', C.textMid, 200);
  pd.appendChild(pg1);
  const pg2 = text('Мария 👋', 18, 58, 20, 'Extra Bold', C.textDark, 200);
  pd.appendChild(pg2);

  // Notif button
  const notifBg = rect(252, 44, 36, 36, C.white, 12);
  pd.appendChild(notifBg);
  const notifT = text('🔔', 259, 50, 18, 'Regular', C.textDark, 26);
  pd.appendChild(notifT);
  const notifDot = rect(277, 46, 8, 8, C.red, 4);
  pd.appendChild(notifDot);

  // Children chips
  const chip1Bg = rect(18, 90, 90, 32, C.brand, 16);
  pd.appendChild(chip1Bg);
  const chip1T = text('🧙 Саша', 26, 97, 12, 'Extra Bold', C.white, 76);
  pd.appendChild(chip1T);

  const chip2Bg = rect(116, 90, 80, 32, { r: 0.486, g: 0.227, b: 0.929, a: 0.08 }, 16);
  pd.appendChild(chip2Bg);
  const chip2T = text('🦊 Маша', 124, 97, 12, 'Extra Bold', C.brand, 68);
  pd.appendChild(chip2T);

  // Stats row
  const statCards = [
    { n: '3', l: 'На проверке', c: C.red, x: 16 },
    { n: '340', l: 'Монет', c: C.green, x: 112 },
    { n: '5', l: 'Квестов', c: C.orange, x: 208 },
  ];
  statCards.forEach(s => {
    const sb = rect(s.x, 138, 82, 68, C.white, 14);
    pd.appendChild(sb);
    const sn = text(s.n, s.x + 10, 146, 22, 'Extra Bold', C.textDark, 62);
    pd.appendChild(sn);
    const sl = text(s.l, s.x + 10, 174, 10, 'Semi Bold', C.textMid, 64);
    pd.appendChild(sl);
    const sd = rect(s.x + 10, 190, 8, 8, s.c, 4);
    pd.appendChild(sd);
  });

  // Balance card
  const balBg = rect(16, 218, 268, 64, C.brand, 18);
  pd.appendChild(balBg);
  const balE = text('🪙', 26, 230, 28, 'Regular', C.white, 40);
  pd.appendChild(balE);
  const balL = text('Баланс Саши', 76, 224, 11, 'Semi Bold', { r: 1, g: 1, b: 1, a: 0.6 }, 130);
  pd.appendChild(balL);
  const balV = text('340 монет', 76, 240, 20, 'Extra Bold', C.white, 130);
  pd.appendChild(balV);
  const addBg = rect(206, 232, 68, 28, { r: 1, g: 1, b: 1, a: 0.15 }, 10);
  pd.appendChild(addBg);
  const addT = text('+ Начислить', 210, 238, 10, 'Extra Bold', C.white, 60);
  pd.appendChild(addT);

  // Section title
  const attT = text('ТРЕБУЮТ ВНИМАНИЯ', 16, 296, 10, 'Extra Bold', C.textMid, 200);
  pd.appendChild(attT);

  // Pending cards
  const pendingItems = [
    { icon: '📬', bg: { r: 0.486, g: 0.227, b: 0.929, a: 0.1 }, title: 'Проверка заданий', sub: '3 задания ждут одобрения', badge: '3', y: 312 },
    { icon: '🎁', bg: { r: 0.976, g: 0.451, b: 0.086, a: 0.1 }, title: 'Запросы наград', sub: 'Саша хочет PlayStation', badge: null, y: 380 },
    { icon: '✨', bg: { r: 0.961, g: 0.620, b: 0.043, a: 0.1 }, title: 'Новое желание', sub: 'Lego Technic · ~500 монет', badge: null, y: 448 },
  ];
  pendingItems.forEach(item => {
    const pcBg = rect(16, item.y, 268, 58, C.white, 16);
    pd.appendChild(pcBg);
    const pcIconBg = rect(26, item.y + 10, 38, 38, item.bg, 12);
    pd.appendChild(pcIconBg);
    const pcIcon = text(item.icon, 31, item.y + 15, 20, 'Regular', C.white, 28);
    pd.appendChild(pcIcon);
    const pcTitle = text(item.title, 76, item.y + 12, 13, 'Extra Bold', C.textDark, 140);
    pd.appendChild(pcTitle);
    const pcSub = text(item.sub, 76, item.y + 30, 11, 'Semi Bold', C.textMid, 150);
    pd.appendChild(pcSub);
    if (item.badge) {
      const bdBg = rect(218, item.y + 18, 20, 20, C.red, 10);
      pd.appendChild(bdBg);
      const bdT = text(item.badge, 224, item.y + 22, 10, 'Extra Bold', C.white, 14);
      pd.appendChild(bdT);
    }
    const rvBtn = rect(item.badge ? 244 : 214, item.y + 16, 30, 24, C.brand, 8);
    pd.appendChild(rvBtn);
    const rvT = text('→', item.badge ? 252 : 222, item.y + 21, 11, 'Extra Bold', C.white, 22);
    pd.appendChild(rvT);
  });

  // Parent bottom nav
  const pNavBg = rect(0, 590, 300, 44, C.white, 0);
  pd.appendChild(pNavBg);
  const pNavTop = rect(0, 590, 300, 1, { r: 0.486, g: 0.227, b: 0.929, a: 0.08 });
  pd.appendChild(pNavTop);
  const pNavItems = ['🏠 Главная', '⚔️ Задания', '🎁 Награды', '⚙️ Настройки'];
  pNavItems.forEach((item, i) => {
    const parts = item.split(' ');
    const nx = 12 + i * 70;
    const eT = text(parts[0], nx + 6, 596, 18, 'Regular', C.textDark, 30);
    pd.appendChild(eT);
    const lT = text(parts[1], nx, 618, 9, 'Extra Bold', i === 0 ? C.brand : C.textMid, 56);
    pd.appendChild(lT);
  });

  // ════════════════════════
  // CONCEPT FRAME
  // ════════════════════════
  const cf = figma.createFrame();
  cf.name = '🚀 Concept · Levels + Skills';
  cf.x = 1360; cf.y = 0;
  cf.resize(640, 680);
  cf.cornerRadius = 24;
  cf.fills = [{ type: 'SOLID', color: { r: 0.051, g: 0.039, b: 0.122, a: 1 } }];
  cf.clipsContent = true;
  page.appendChild(cf);

  // Concept label
  const cl = text('🚀  КОНЦЕПЦИЯ · УРОВНИ, АЧИВКИ И СКИЛЛЫ', 1360, -36, 13, 'Extra Bold',
    { r: 0.294, g: 0.243, b: 0.447, a: 1 }, 700);
  page.appendChild(cl);

  // Concept title
  const ctitle = text('Прокачка персонажа ⚡', 28, 28, 22, 'Extra Bold', C.white, 580);
  cf.appendChild(ctitle);
  const csub = text('Выполнил квест → +XP → Поднял уровень → Новый скилл → Больше монет',
    28, 58, 12, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 580);
  cf.appendChild(csub);

  // Level title
  const ltTitle = text('ДЕРЕВО УРОВНЕЙ', 28, 94, 10, 'Extra Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 300);
  cf.appendChild(ltTitle);

  // Level cards
  const levels = [
    { num: '1–3', name: '🌱 Новичок', xp: '0 – 300 XP', status: '✓ Пройдено', statusC: C.green, skills: ['+Базовые квесты'], done: true, current: false },
    { num: '4–7', name: '⚡ Искатель', xp: '300 – 1200 XP', status: '▶ Сейчас', statusC: C.brand2, skills: ['+10% монет', 'Дневной бонус'], done: false, current: true },
    { num: '8–12', name: '🔥 Герой', xp: '1200 – 3000 XP', status: '🔒 Закрыто', statusC: C.textMid, skills: ['Особые квесты', '+25% монет'], done: false, current: false },
  ];
  levels.forEach((lv, i) => {
    const lx = 28 + i * 200;
    const lBg = rect(lx, 110, 186, 130, { r: 0.102, g: 0.063, b: 0.208, a: 1 }, 16);
    if (lv.current) {
      // Can't easily set stroke in basic mode, use slightly different bg
      lBg.fills = [{ type: 'SOLID', color: { r: 0.176, g: 0.090, b: 0.357, a: 1 } }];
    }
    if (!lv.done && !lv.current) lBg.opacity = 0.45;
    cf.appendChild(lBg);

    const lNum = text(lv.num, lx + 12, 120, 26, 'Extra Bold', C.white, 80);
    cf.appendChild(lNum);

    const lStatBg = rect(lx + 96, 118, 80, 22, { r: lv.statusC.r, g: lv.statusC.g, b: lv.statusC.b, a: 0.15 }, 8);
    cf.appendChild(lStatBg);
    const lStat = text(lv.status, lx + 100, 123, 10, 'Extra Bold', lv.statusC, 72);
    cf.appendChild(lStat);

    const lName = text(lv.name, lx + 12, 152, 14, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 160);
    cf.appendChild(lName);
    const lXP = text(lv.xp, lx + 12, 172, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 160);
    cf.appendChild(lXP);

    lv.skills.forEach((sk, si) => {
      const skBg = rect(lx + 12, 192 + si * 26, 120, 20, { r: 0.486, g: 0.227, b: 0.929, a: 0.12 }, 8);
      cf.appendChild(skBg);
      const skT = text(sk, lx + 18, 196 + si * 26, 10, 'Extra Bold', C.brand2, 108);
      cf.appendChild(skT);
    });
  });

  // Achievements section
  const achTitle = text('🏆  АЧИВКИ', 28, 258, 12, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 300);
  cf.appendChild(achTitle);

  const achievs = ['⚡', '🔥', '📚', '🧹', '🏆', '💎', '🚀', '👑'];
  const earnedCount = 4;
  achievs.forEach((e, i) => {
    const ax = 28 + (i % 4) * 74;
    const ay = 282 + Math.floor(i / 4) * 76;
    const aBg = rect(ax, ay, 56, 56, i < earnedCount
      ? { r: 0.486, g: 0.227, b: 0.929, a: 0.2 }
      : { r: 1, g: 1, b: 1, a: 0.03 }, 16);
    cf.appendChild(aBg);
    const aT = text(e, ax + 10, ay + 10, 28, 'Regular', C.white, 36);
    cf.appendChild(aT);
    if (i >= earnedCount) aT.opacity = 0.3;
  });

  // Skills section
  const skTitle = text('✨  СКИЛЛЫ', 340, 258, 12, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 280);
  cf.appendChild(skTitle);

  const skills = [
    { icon: '🪙', name: 'Монетный магнит', effect: '+10% ко всем наградам', active: true },
    { icon: '⚡', name: 'Дневной бонус', effect: '+5 монет каждый день', active: true },
    { icon: '🎯', name: 'Мастер квестов', effect: '+25% за сложные задания', active: false },
    { icon: '💎', name: 'Инвестор', effect: '+5% к Growth Missions', active: false },
  ];
  skills.forEach((sk, i) => {
    const sy = 282 + i * 56;
    const skBg = rect(340, sy, 272, 48, { r: 0.102, g: 0.063, b: 0.208, a: 1 }, 12);
    if (!sk.active) skBg.opacity = 0.45;
    cf.appendChild(skBg);
    const skIBg = rect(350, sy + 8, 32, 32, { r: 0.486, g: 0.227, b: 0.929, a: 0.15 }, 10);
    cf.appendChild(skIBg);
    const skI = text(sk.icon, 356, sy + 12, 18, 'Regular', C.white, 22);
    cf.appendChild(skI);
    const skN = text(sk.name, 392, sy + 10, 12, 'Extra Bold', { r: 0.769, g: 0.710, b: 0.910, a: 1 }, 140);
    cf.appendChild(skN);
    const skE = text(sk.effect, 392, sy + 28, 10, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 150);
    cf.appendChild(skE);
    const skStatBg = rect(550, sy + 14, 52, 20, sk.active
      ? { r: 0.063, g: 0.725, b: 0.506, a: 0.12 }
      : { r: 1, g: 1, b: 1, a: 0.04 }, 8);
    cf.appendChild(skStatBg);
    const skStat = text(sk.active ? 'Активен' : 'LVL 8+', 556, sy + 18, 9, 'Extra Bold',
      sk.active ? C.green : { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 44);
    cf.appendChild(skStat);
  });

  // Flow note
  const flowBg = rect(28, 516, 584, 58, { r: 0.486, g: 0.227, b: 0.929, a: 0.06 }, 14);
  cf.appendChild(flowBg);
  const flowT1 = text('💡 Механика прокачки', 44, 524, 12, 'Extra Bold', { r: 0.608, g: 0.537, b: 0.800, a: 1 }, 560);
  cf.appendChild(flowT1);
  const flowT2 = text('Квест → +XP → Уровень вверх → Скилл разблокирован → Больше монет → Мотивация делать больше квестов',
    44, 542, 11, 'Semi Bold', { r: 0.353, g: 0.306, b: 0.502, a: 1 }, 560);
  cf.appendChild(flowT2);

  // Zoom to fit all content
  figma.viewport.scrollAndZoomIntoView([cd, pd, cf]);
  figma.notify('✅ EasyQuest дизайн готов! Проверь страницу.');
}

main().catch(err => {
  console.error(err);
  figma.notify('❌ Ошибка: ' + err.message, { error: true });
});
