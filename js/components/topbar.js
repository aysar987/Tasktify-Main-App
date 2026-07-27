// js/components/topbar.js
// Shared page header: optional back button, title, optional right-side slot.
import { ICONS } from '../icons.js';

export function topbar(title, { back: showBack = false, right = '' } = {}) {
  return `<div class="topbar">
    ${showBack ? `<button class="iconbtn" onclick="back()">${ICONS.back}</button>` : ''}
    <h1>${title}</h1>
    ${right}
  </div>`;
}
