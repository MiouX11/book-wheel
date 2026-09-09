// SVG 图标映射
window.IconSvg = {
  chart: '<path d="M3 17l4-4 4 4 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 7h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  arrow: '<path d="M7 17l10-10M17 7H7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  brain: '<path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 014.44-2.84zM14.5 2a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-4.44-2.84z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M11 3L8 9l4 12M13 3l3 6-4 12M2 9h20" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  person: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21v-1a6 6 0 0112 0v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  temple: '<path d="M3 21h18M4 21V10M20 21V10M12 3L3 9h18l-9-6zM6 21v-8M10 21v-8M14 21v-8M18 21v-8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  mind: '<path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 014.44-2.84zM14.5 2a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-4.44-2.84z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>',
};

window.getIcon = function(name, size) {
  size = size || 16;
  const svg = window.IconSvg[name] || window.IconSvg.brain;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" style="vertical-align:middle;flex-shrink:0">' + svg + '</svg>';
};
