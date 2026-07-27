// js/pages/createMarketplace.js
// Covers the "Create Marketplace" / "Add Banner" flow from the UML's
// Home dashboard node.
import { ICONS } from '../icons.js';
import { nav, toast } from '../state.js';
import { topbar } from '../components/topbar.js';

export function screenCreateMarketplace() {
  return `<div class="screen">
    ${topbar('Create Marketplace', { back: true })}
    <div class="content">
      <div class="field"><label>Service Image</label>
        <div class="card" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--muted);padding:26px;border:1.5px dashed var(--line)">${ICONS.image}<span style="font-size:12.5px">Tap to upload an image</span></div>
      </div>
      <div class="field"><label>Service Name</label><input placeholder="e.g. Home Electrical Repair"></div>
      <div class="field"><label>Category</label><input placeholder="e.g. Electrical"></div>
      <div class="field"><label>Description</label><textarea placeholder="Describe what you offer..."></textarea></div>
      <button class="btn btn-primary" onclick="publishListing()">Publish Listing</button>
    </div>
  </div>`;
}

function publishListing() {
  toast('Listing published to Marketplace');
  nav('market', { push: false, reset: true });
}
window.publishListing = publishListing;
