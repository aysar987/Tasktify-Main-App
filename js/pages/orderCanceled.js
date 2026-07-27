// js/pages/orderCanceled.js
import { ICONS } from '../icons.js';
import { S, nav, toast } from '../state.js';
import { tasks } from '../data.js';
import { topbar } from '../components/topbar.js';

export function screenOrderCanceled() {
  const t = S.currentTask;
  return `<div class="screen">
    ${topbar('Order Canceled', { back: true })}
    <div class="content" style="text-align:center;padding-top:30px">
      <div class="qicon" style="width:68px;height:68px;border-radius:20px;margin:0 auto 18px;background:var(--red-100);color:var(--red)">${ICONS.x}</div>
      <h2 style="margin:0 0 6px">Task canceled</h2>
      <p style="color:var(--muted);font-size:13.5px;margin:0 0 22px">Your request "${t ? t.title : ''}" has been canceled. No fee has been charged.</p>
      <button class="btn btn-primary" onclick="confirmCancel()">Done</button>
    </div>
  </div>`;
}

function confirmCancel() {
  if (S.currentTask) tasks.ongoing = tasks.ongoing.filter(t => t.id !== S.currentTask.id);
  nav('activity', { push: false, reset: true });
  toast('Task removed from Ongoing');
}
window.confirmCancel = confirmCancel;
