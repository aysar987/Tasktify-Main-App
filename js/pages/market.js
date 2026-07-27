// js/pages/market.js
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { providers } from '../data.js';
import { topbar } from '../components/topbar.js';
import { bottomNav } from '../components/bottomnav.js';
import { providerCard } from '../components/providerCard.js';

function filteredProviders() {
  const q = S.marketQuery.toLowerCase();
  return providers.filter(p => (p.name + p.role + p.cat).toLowerCase().includes(q));
}

function emptyState() {
  return `<div class="empty" style="grid-column:1/-1">${ICONS.search}<b>No providers found</b>Try a different search term.</div>`;
}

export function screenMarket() {
  const list = filteredProviders();
  return `<div class="screen">
    ${topbar('Market')}
    <div class="content">
      <div class="searchbar">${ICONS.search}<input placeholder="Search for service providers..." value="${S.marketQuery}" oninput="onMarketSearch(this.value)"></div>
      <div class="filterrow">
        <div class="chip">Fee ▾</div><div class="chip">Terkait ▾</div><div class="chip">${ICONS.filter} Filter</div>
      </div>
      <div class="section-title" style="margin-bottom:8px">Category</div>
      <div class="filterrow" style="flex-wrap:wrap">
        ${['All', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Medical'].map(c => `<div class="chip">${c}</div>`).join('')}
      </div>
      <div id="marketList" class="providergrid" style="margin-top:14px">
        ${list.map(p => providerCard(p)).join('') || emptyState()}
      </div>
    </div>
    ${bottomNav('market')}
  </div>`;
}

// Filters in place without a full re-render, so the search input keeps focus.
function onMarketSearch(value) {
  S.marketQuery = value;
  const list = filteredProviders();
  const el = document.getElementById('marketList');
  if (el) el.innerHTML = list.map(p => providerCard(p)).join('') || emptyState();
}
window.onMarketSearch = onMarketSearch;
