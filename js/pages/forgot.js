// js/pages/forgot.js
import { ICONS } from '../icons.js';
import { S, nav, toast } from '../state.js';

export function screenForgot() {
  return `<div class="screen"><div class="auth-wrap">
    <button class="iconbtn" style="margin-bottom:16px" onclick="back()">${ICONS.back}</button>
    <div class="auth-title">Reset your password</div>
    <div class="auth-sub">Enter the email linked to your account and we'll send a reset link.</div>
    <div class="field"><label>Email</label><input id="fp-email" placeholder="you@email.com"></div>
    <button class="btn btn-primary" onclick="doSendReset()">Send email</button>
  </div></div>`;
}

function doSendReset() {
  const e = document.getElementById('fp-email').value.trim();
  if (!e) { toast('Enter your email'); return; }
  S.pendingEmail = e;
  nav('reset');
}
window.doSendReset = doSendReset;
