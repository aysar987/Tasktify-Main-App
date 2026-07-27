// js/pages/freelancer.js
import { ICONS, initials } from '../icons.js';
import { S, nav } from '../state.js';
import { providers, findOrCreateChat } from '../data.js';
import { topbar } from '../components/topbar.js';

export function screenFreelancer() {
  const p = S.currentProvider || providers[0];
  return `<div class="screen">
    ${topbar('Freelancer Profile', { back: true })}
    <div class="content">
      <div class="fp-hero">
        <div class="avatar lg">${initials(p.name)}</div>
        <div>
          <h2>${p.name}</h2>
          <span>${p.role}</span>
          <span>${p.years}</span>
          <span>${p.loc}</span>
          <div class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))} <b style="color:var(--ink)">${p.rating.toFixed(1)}</b></div>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:18px">
        <button class="btn btn-primary" style="flex:2" onclick="nav('requestTask')">Request Task</button>
        <button class="btn btn-outline" style="flex:1" onclick="startChatWith('${p.name.replace(/'/g, '')}')">Chat</button>
      </div>
      <div class="section-title">About</div>
      <p style="font-size:13.5px;color:var(--ink-soft);line-height:1.6">${p.about}</p>
      <div class="section-title" style="margin-top:18px">Portfolio</div>
      <div class="portfoliogrid"><div></div><div></div><div></div><div></div><div></div><div></div></div>
    </div>
  </div>`;
}

// Shared by the Freelancer Profile "Chat" button and Task Accepted's
// "Message provider" button — opens (or creates) that provider's thread.
export function startChatWith(name) {
  S.currentChat = findOrCreateChat(name);
  nav('chatThread');
}
window.startChatWith = startChatWith;
