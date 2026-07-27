// js/pages/home.js
import { ICONS, initials } from '../icons.js';
import { nav } from '../state.js';
import { user, providers } from '../data.js';
import { bottomNav } from '../components/bottomnav.js';
import { providerCard } from '../components/providerCard.js';
import { quickButton } from '../components/quickButton.js';

export function screenHome() {
  return `<div class="screen">
    <div class="topbar">
      <div class="searchbar" style="flex:1;margin:0">${ICONS.search}<input placeholder="Search for a service..." onclick="nav('market')" readonly></div>
      <div class="avatar sm" onclick="nav('profile')">${initials(user.name)}</div>
    </div>
    <div class="content">
      <div class="banner">
        <div class="deco"></div><div class="deco2"></div>
        <h2>Keep it up, ${user.name.split(' ')[0]}!</h2>
        <p>2 tasks are currently in progress. Track them anytime from Activity.</p>
      </div>
      <div class="greetcard">
        <div class="avatars">${providers.slice(0, 3).map(p => `<div class="avatar sm">${initials(p.name)}</div>`).join('')}</div>
        <div style="font-size:12.5px;color:var(--ink-soft)"><b style="color:var(--ink)">128+ providers</b> ready to help near you</div>
      </div>
      <div class="quickgrid">
        ${quickButton(ICONS.plus, 'Create Task', 'Request a service', "nav('requestTask')")}
        ${quickButton(ICONS.store, 'Marketplace', 'Browse local offers', "nav('market')")}
        ${quickButton(ICONS.wrench, 'Create Marketplace', 'Offer your services', "nav('createMarketplace')")}
        ${quickButton(ICONS.task, 'Do Task', 'See jobs to complete', "nav('activity',{push:false,reset:true})")}
      </div>
      <div class="section-title">Popular near you <span class="link" onclick="nav('market')">See all</span></div>
      <div class="providergrid">
        ${providers.slice(0, 4).map(p => providerCard(p)).join('')}
      </div>
    </div>
    ${bottomNav('home')}
  </div>`;
}
