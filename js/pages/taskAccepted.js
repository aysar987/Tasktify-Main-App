// js/pages/taskAccepted.js
import { ICONS, initials } from '../icons.js';
import { S, nav, toast } from '../state.js';
import { tasks } from '../data.js';
import { topbar } from '../components/topbar.js';
// Note: the "Message provider" button below calls startChatWith(...),
// which is defined in pages/freelancer.js and exposed on window there.

export function screenTaskAccepted() {
  const t = S.currentTask || tasks.ongoing[0];
  if (!t) return `<div class="screen">${topbar('Task Accepted', { back: true })}<div class="empty">${ICONS.task}<b>No task selected</b></div></div>`;
  const p = t.provider;
  return `<div class="screen">
    ${topbar('Task Accepted', { back: true })}
    <div class="content">
      <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div class="avatar">${initials(p.name)}</div>
        <div style="flex:1">
          <b style="display:block;font-size:14px">${p.name}</b>
          <span style="font-size:12px;color:var(--muted)">${p.role}</span>
        </div>
        <div class="stars" style="font-size:13px">★ ${p.rating.toFixed(1)}</div>
      </div>
      <div class="section-title">Live Map</div>
      <div class="map-placeholder"><div class="map-pin">${ICONS.pin}</div></div>
      <div class="section-title">Task</div>
      <div class="card" style="margin-bottom:18px">
        <b style="font-size:14px;display:block;margin-bottom:4px">${t.title}</b>
        <p style="font-size:13px;color:var(--muted);margin:0 0 10px">${t.desc}</p>
        ${t.status === 'done' ? `<span class="badge done">Completed</span>` : `<span class="badge ongoing">${t.date}</span>`}
      </div>
      ${t.status !== 'done' ? `
        <button class="btn btn-outline" onclick="startChatWith('${p.name.replace(/'/g, '')}')">Message ${p.name.split(' ')[0]}</button>
        <button class="btn btn-danger" style="margin-top:10px" onclick="cancelOrder()">Cancel Task</button>
      ` : `
        ${t.rated ? `<div class="hint" style="text-align:center">You already rated this task.</div>` : `
        <div class="section-title">Rate this task</div>
        <div class="card" style="text-align:center">
          <div style="font-size:26px;color:var(--amber);letter-spacing:4px;margin-bottom:14px">★★★★★</div>
          <button class="btn btn-primary" onclick="rateTask()">Submit Rating</button>
        </div>`}
      `}
    </div>
  </div>`;
}

function cancelOrder() {
  nav('orderCanceled');
}
window.cancelOrder = cancelOrder;

function rateTask() {
  if (S.currentTask) S.currentTask.rated = true;
  toast('Thanks for rating!');
  nav('activity', { push: false, reset: true });
}
window.rateTask = rateTask;
