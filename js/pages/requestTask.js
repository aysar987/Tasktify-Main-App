// js/pages/requestTask.js
import { S, nav, toast } from '../state.js';
import { topbar } from '../components/topbar.js';

export function screenRequestTask() {
  const d = S.requestDraft;
  return `<div class="screen">
    ${topbar('Request Task', { back: true })}
    <div class="content">
      <div class="field"><label>Task Name</label><input id="rt-name" value="${d.name}" placeholder="e.g. Fix short circuit"></div>
      <div class="field"><label>Location</label><input id="rt-loc" value="${d.location}" placeholder="e.g. Jl. Merdeka No. 12, Jakarta"></div>
      <div class="field"><label>Fee Range</label>
        <div style="display:flex;gap:10px">
          <input id="rt-feemin" value="${d.feeMin}" placeholder="Min (Rp)">
          <input id="rt-feemax" value="${d.feeMax}" placeholder="Max (Rp)">
        </div>
      </div>
      <div class="field"><label>Note</label><textarea id="rt-note" placeholder="Describe the issue in detail...">${d.note}</textarea></div>
      <button class="btn btn-primary" onclick="submitTask()">Submit Request</button>
    </div>
  </div>`;
}

function submitTask() {
  const name = document.getElementById('rt-name').value.trim();
  const loc = document.getElementById('rt-loc').value.trim();
  if (!name || !loc) { toast('Add a task name and location'); return; }
  S.requestDraft = {
    name, location: loc,
    feeMin: document.getElementById('rt-feemin').value,
    feeMax: document.getElementById('rt-feemax').value,
    note: document.getElementById('rt-note').value,
  };
  nav('taskSubmitted');
}
window.submitTask = submitTask;
