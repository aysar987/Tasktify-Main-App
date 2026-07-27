// js/components/quickButton.js
// One tile in the Home "dashboard" quick-action grid
// (Create Task / Marketplace / Create Marketplace / Do Task).
export function quickButton(icon, title, subtitle, onClickJs) {
  return `<button class="qbtn" onclick="${onClickJs}">
    <div class="qicon">${icon}</div>
    <b>${title}</b><span>${subtitle}</span>
  </button>`;
}
