// js/pages/verify.js
// Corresponds to the "Verifikator" node in the UML: confirms a new
// registration before dropping the user into the main app shell.
import { ICONS } from '../icons.js';
import { S, nav, toast } from '../state.js';
import { user } from '../data.js';

export function screenVerify() {
  return `<div class="screen"><div class="auth-wrap" style="align-items:center;text-align:center;justify-content:center">
    <div class="qicon" style="width:64px;height:64px;border-radius:18px;margin-bottom:20px">${ICONS.check}</div>
    <div class="auth-title">Verify your account</div>
    <div class="auth-sub">We're confirming your details, ${user.username}. This only takes a moment (Verifikator).</div>
    <button class="btn btn-primary" onclick="doVerify()">Verify & continue</button>
  </div></div>`;
}

function doVerify() {
  S.authed = true;
  toast('Account verified');
  nav('home', { reset: true });
}
window.doVerify = doVerify;
