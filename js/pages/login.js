// js/pages/login.js
import { ICONS, svgWhite } from '../icons.js';
import { S, nav, toast } from '../state.js';
import { user } from '../data.js';

export function screenLogin() {
  return `<div class="screen"><div class="auth-wrap">
    <div class="brand"><div class="brand-mark">${svgWhite(ICONS.wrench)}</div><div class="brand-name">Tugasin</div></div>
    <div class="auth-title">Welcome back</div>
    <div class="auth-sub">Log in to request tasks, chat with providers and track your bookings.</div>
    <div class="field"><label>Username</label><input id="li-user" placeholder="Enter your username"></div>
    <div class="field"><label>Password</label><input id="li-pass" type="password" placeholder="Enter your password"></div>
    <div style="text-align:right;margin:-8px 0 20px;"><span class="link" style="font-size:13px" onclick="nav('forgot')">Forgot password?</span></div>
    <button class="btn btn-primary" onclick="doLogin()">Log in</button>
    <div style="text-align:center;margin-top:18px;font-size:13.5px;color:var(--muted)">Don't have an account? <span class="link" onclick="nav('register')">Sign up</span></div>
  </div></div>`;
}

function doLogin() {
  const u = document.getElementById('li-user').value.trim();
  if (!u) { toast('Enter a username to continue'); return; }
  user.username = u;
  S.authed = true;
  nav('home', { reset: true });
  toast(`Welcome back, ${user.name.split(' ')[0]}!`);
}
window.doLogin = doLogin;
