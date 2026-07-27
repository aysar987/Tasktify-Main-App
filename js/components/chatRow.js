// js/components/chatRow.js
// One row in the Chat list. Purely presentational — the tap handler
// (openChat) lives in pages/chat.js since it also owns "unread" state.
import { initials } from '../icons.js';

export function chatRow(c) {
  return `
    <div class="chatrow" onclick="openChat(${c.id})">
      <div class="avatar">${initials(c.name)}</div>
      <div class="who"><b>${c.name}</b><span>${c.role}</span><div class="last">${c.last}</div></div>
      <div class="meta">${c.date}${c.unread ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--blue-600);margin:5px 0 0 auto"></div>` : ''}</div>
    </div>`;
}
