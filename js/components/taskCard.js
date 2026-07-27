// js/components/taskCard.js
// Card for one task inside the Activity tabs (Ongoing/Scheduled/History).
// Owns its own tap behavior: opens Task Accepted with that task selected.
import { initials } from '../icons.js';
import { S, nav } from '../state.js';
import { findTaskById } from '../data.js';

export function taskCard(t) {
  return `
    <div class="taskcard" onclick="openTask(${t.id})">
      <div class="taskcard-top">
        <div class="avatar sm">${initials(t.provider.name)}</div>
        <div class="who"><b>${t.provider.name}</b><span>${t.provider.role}</span></div>
        <div class="date">${t.date}</div>
      </div>
      <h4>${t.title}</h4>
      <p>${t.desc}</p>
      <div style="margin-top:10px">
        ${t.status === 'ongoing' ? `<span class="badge ongoing">In progress</span>` : ''}
        ${t.status === 'scheduled' ? `<span class="badge waiting">Scheduled</span>` : ''}
        ${t.status === 'done' ? `<span class="badge done">${t.rated ? 'Completed · Rated' : 'Completed'}</span>` : ''}
      </div>
    </div>`;
}

function openTask(id) {
  S.currentTask = findTaskById(id);
  nav('taskAccepted');
}
window.openTask = openTask;
