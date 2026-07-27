// js/components/providerCard.js
// Small grid card for a service provider (Home "Popular near you" and
// Market results). Owns its own tap behavior: opens the Freelancer Profile.
import { ICONS, initials } from '../icons.js';
import { S, nav } from '../state.js';
import { providers } from '../data.js';

export function providerCard(p) {
  return `<div class="provcard" onclick="openProvider(${p.id})">
    <div class="thumb">${ICONS.wrench}</div>
    <b>${p.name}</b><span>${p.role}</span>
    <div class="rate">${ICONS.star} ${p.rating.toFixed(1)}</div>
  </div>`;
}

// Sets the selected provider and navigates to the Freelancer Profile page.
function openProvider(id) {
  S.currentProvider = providers.find(p => p.id === id);
  nav('freelancer');
}
window.openProvider = openProvider;
