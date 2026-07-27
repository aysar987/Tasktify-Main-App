// js/pages/register.js
import { ICONS } from '../icons.js';
import { nav, toast } from '../state.js';
import { user } from '../data.js';

export function screenRegister() {
  return `<div class="screen"><div class="auth-wrap">
    <button class="iconbtn" style="margin-bottom:16px" onclick="back()">${ICONS.back}</button>
    <div class="auth-title">Create your account</div>
    <div class="auth-sub">Join Tugasin to request tasks or offer your services.</div>
    <div class="field"><label>Username</label><input id="rg-user" placeholder="Add username"></div>
    <div class="field"><label>Phone Number</label><input id="rg-phone" placeholder="+62 ..."></div>
    <div class="field"><label>Password</label><input id="rg-pass" type="password" placeholder="Add password"></div>
    <button class="btn btn-primary" onclick="doRegister()">Sign up</button>
    <div style="text-align:center;margin-top:18px;font-size:13.5px;color:var(--muted)">Already have an account? <span class="link" onclick="nav('login')">Log in</span></div>
  </div></div>`;
}

function doRegister() {
  const u = document.getElementById('rg-user').value.trim();
  const p = document.getElementById('rg-phone').value.trim();
  if (!u || !p) { toast('Fill in all fields to continue'); return; }
  user.username = u;
  user.phone = p || user.phone;
  nav('verify');
}
window.doRegister = doRegister;
