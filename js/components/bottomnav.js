// js/components/bottomnav.js
// Shared bottom tab bar: Home / Market / Activity / Chat.
// Tapping a tab resets the back-stack (push:false, reset:true) so the
// back button never leaves the main shell.
import { ICONS } from '../icons.js';

const TABS = [
  ['home', 'Home', ICONS.home],
  ['market', 'Market', ICONS.market],
  ['activity', 'Activity', ICONS.activity],
  ['chat', 'Chat', ICONS.chat],
];

export function bottomNav(active) {
  return `<div class="bottomnav">${TABS.map(([id, label, icon]) => `
    <button class="navitem ${active === id ? 'active' : ''}" onclick="nav('${id}',{push:false,reset:true})">
      ${icon}<span>${label}</span>
    </button>`).join('')}</div>`;
}
