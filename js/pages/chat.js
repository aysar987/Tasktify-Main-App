// js/pages/chat.js
import { ICONS } from '../icons.js';
import { S, nav } from '../state.js';
import { chats } from '../data.js';
import { topbar } from '../components/topbar.js';
import { bottomNav } from '../components/bottomnav.js';
import { chatRow } from '../components/chatRow.js';

export function screenChat() {
  return `<div class="screen">
    ${topbar('Chat')}
    <div class="content">
      <div class="searchbar">${ICONS.search}<input placeholder="Search conversations..."></div>
      ${chats.map(c => chatRow(c)).join('')}
    </div>
    ${bottomNav('chat')}
  </div>`;
}

function openChat(id) {
  S.currentChat = chats.find(c => c.id === id);
  S.currentChat.unread = false;
  nav('chatThread');
}
window.openChat = openChat;
