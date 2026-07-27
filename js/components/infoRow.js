// js/components/infoRow.js
// One labeled row with an icon (e.g. "Username: matthew.a"). Used on the
// Profile page and the Task Submitted summary card.
export function infoRow(icon, label, value) {
  return `<div class="inforow"><div class="ic">${icon}</div><div><div class="lbl">${label}</div><div class="val">${value}</div></div></div>`;
}
