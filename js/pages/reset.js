// js/pages/reset.js
import { ICONS } from '../icons.js';
import { S, nav, toast } from '../state.js';

export function screenReset() {
  return `<div class="screen"><div class="auth-wrap">
    <button class="iconbtn" style="margin-bottom:16px" onclick="back()">${ICONS.back}</button>
    <div class="auth-title">Set a new password</div>
    <div class="auth-sub">A reset code was sent to <b>${S.pendingEmail || 'your email'}</b>. Enter a new password below.</div>
    <div class="field"><label>New password</label><input type="password" placeholder="New password"></div>
    <div class="field"><label>Confirm password</label><input type="password" placeholder="Confirm password"></div>
    <button class="btn btn-primary" onclick="doResetDone()">Reset password</button>
  </div></div>`;
}

function doResetDone() {
  toast('Password updated — please log in');
  nav('login', { reset: true });
}
window.doResetDone = doResetDone;
