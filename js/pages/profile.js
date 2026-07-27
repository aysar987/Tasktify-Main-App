// js/pages/profile.js
import { ICONS, initials } from '../icons.js';
import { S, nav } from '../state.js';
import { user } from '../data.js';
import { topbar } from '../components/topbar.js';
import { infoRow } from '../components/infoRow.js';

export function screenProfile() {
  return `<div class="screen">
    ${topbar('Profile', { back: true })}
    <div class="profile-hero">
      <div class="avatar lg">${initials(user.name)}</div>
      <h2>${user.name}</h2>
      <span>@${user.username}</span>
    </div>
    <div class="content" style="padding-top:0">
      <div class="infolist">
        ${infoRow(ICONS.user, 'Username', user.username)}
        ${infoRow(ICONS.phoneIc, 'Phone Number', user.phone)}
        ${infoRow(ICONS.mapIc, 'Alamat', user.address)}
        ${infoRow(ICONS.mail, 'Email (Optional)', user.email)}
      </div>
      <div class="section-title" style="margin-top:20px">Manage</div>
      <div class="infolist">
        <div class="inforow" style="cursor:pointer" onclick="nav('requestTask')"><div class="ic">${ICONS.task}</div><div class="val">Request a task</div></div>
        <div class="inforow" style="cursor:pointer" onclick="nav('createMarketplace')"><div class="ic">${ICONS.store}</div><div class="val">Create Marketplace listing</div></div>
        <div class="inforow" style="cursor:pointer;border-bottom:none" onclick="logout()"><div class="ic" style="background:var(--red-100);color:var(--red)">${ICONS.x}</div><div class="val" style="color:var(--red)">Log out</div></div>
      </div>
    </div>
  </div>`;
}

function logout() {
  S.authed = false;
  nav('login', { reset: true });
}
window.logout = logout;
