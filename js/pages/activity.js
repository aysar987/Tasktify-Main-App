// js/pages/activity.js
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { tasks } from '../data.js';
import { topbar } from '../components/topbar.js';
import { bottomNav } from '../components/bottomnav.js';
import { taskCard } from '../components/taskCard.js';

const TABS = [['ongoing', 'Ongoing'], ['scheduled', 'Scheduled'], ['history', 'History'], ['draft', 'Draft']];

function renderList(list) {
  if (!list.length) return `<div class="empty">${ICONS.task}<b>Nothing here yet</b>Tasks you request will show up in this tab.</div>`;
  return list.map(t => taskCard(t)).join('');
}

export function screenActivity() {
  const list = tasks[S.activityTab] || [];
  return `<div class="screen">
    ${topbar('Activity')}
    <div class="content">
      <div class="tabrow">${TABS.map(([id, label]) => `<button class="tabbtn ${S.activityTab === id ? 'active' : ''}" onclick="setActivityTab('${id}')">${label}</button>`).join('')}</div>
      <div id="activityList">${renderList(list)}</div>
    </div>
    ${bottomNav('activity')}
  </div>`;
}

function setActivityTab(id) {
  S.activityTab = id;
  document.getElementById('activityList').innerHTML = renderList(tasks[id] || []);
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}
window.setActivityTab = setActivityTab;
