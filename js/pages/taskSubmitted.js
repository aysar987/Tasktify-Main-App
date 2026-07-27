// js/pages/taskSubmitted.js
import { ICONS } from '../icons.js';
import { S, nav, toast } from '../state.js';
import { providers, tasks } from '../data.js';
import { topbar } from '../components/topbar.js';
import { infoRow } from '../components/infoRow.js';

export function screenTaskSubmitted() {
  const d = S.requestDraft;
  return `<div class="screen">
    ${topbar('Task Submitted', { back: true })}
    <div class="content" style="text-align:center;padding-top:26px">
      <div class="qicon" style="width:68px;height:68px;border-radius:20px;margin:0 auto 18px;background:var(--amber-100);color:var(--amber)">${ICONS.clock}</div>
      <h2 style="margin:0 0 6px">Waiting for a match</h2>
      <p style="color:var(--muted);font-size:13.5px;margin:0 0 22px">We're matching <b>${d.name || 'your task'}</b> with nearby providers. This usually takes a few minutes.</p>
      <div class="card" style="text-align:left;margin-bottom:20px">
        ${infoRow(ICONS.task, 'Task', d.name || '—')}
        ${infoRow(ICONS.mapIc, 'Location', d.location || '—')}
        ${infoRow(ICONS.store, 'Fee Range', `Rp${d.feeMin || '0'} – Rp${d.feeMax || '0'}`)}
      </div>
      <span class="badge waiting" style="margin-bottom:20px"><span class="statusdot" style="background:var(--amber)"></span> Waiting Status</span>
      <button class="btn btn-primary" onclick="simulateMatch()">Simulate provider match</button>
      <button class="btn btn-ghost" onclick="nav('activity',{push:false,reset:true})">Back to Activity</button>
    </div>
  </div>`;
}

// Demo-only: randomly assigns a provider and moves the task into Ongoing.
// Replace with a real "provider accepted" event/webhook in production.
function simulateMatch() {
  const d = S.requestDraft;
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const t = { id: Date.now(), provider, title: d.name || 'New Task', desc: d.note || 'No additional notes', date: 'Today', status: 'ongoing' };
  tasks.ongoing.unshift(t);
  S.currentTask = t;
  toast(`${provider.name} accepted your task!`);
  nav('taskAccepted', { reset: true });
}
window.simulateMatch = simulateMatch;
