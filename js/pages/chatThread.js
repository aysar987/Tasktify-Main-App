// js/pages/chatThread.js
import { ICONS, initials } from '../icons.js';
import { S, render } from '../state.js';
import { chats } from '../data.js';
import { topbar } from '../components/topbar.js';

export function screenChatThread() {
  const c = S.currentChat || chats[0];
  return `<div class="screen">
    ${topbar(c.name, { back: true, right: `<div class="avatar sm">${initials(c.name)}</div>` })}
    <div class="thread" id="threadBody" style="padding-top:6px;padding-bottom:16px">
      ${c.thread.map(m => `<div class="bubble ${m.me ? 'me' : 'them'}">${m.t}</div>`).join('')}
    </div>
    <div class="composer">
      <input id="chatInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter') sendMsg()">
      <button class="iconbtn" style="background:var(--blue-600);color:#fff" onclick="sendMsg()">${ICONS.plus}</button>
    </div>
  </div>`;
}

function sendMsg() {
  const input = document.getElementById('chatInput');
  const val = input.value.trim();
  if (!val) return;
  S.currentChat.thread.push({ me: true, t: val });
  S.currentChat.last = val;
  input.value = '';
  render();
  const body = document.getElementById('threadBody');
  if (body) body.scrollTop = body.scrollHeight;
}
window.sendMsg = sendMsg;
