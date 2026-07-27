// js/app.js
// Entry point loaded by index.html as a <script type="module">.
// Its only jobs are: import every page, build the route table, and boot.
// To add a new page: create js/pages/yourPage.js exporting screenYourPage,
// import it below, and add it to ROUTES with the page-id you'll nav() to.

import { registerRoutes, render } from './state.js';

import { screenLogin } from './pages/login.js';
import { screenRegister } from './pages/register.js';
import { screenVerify } from './pages/verify.js';
import { screenForgot } from './pages/forgot.js';
import { screenReset } from './pages/reset.js';
import { screenHome } from './pages/home.js';
import { screenMarket } from './pages/market.js';
import { screenFreelancer } from './pages/freelancer.js';
import { screenActivity } from './pages/activity.js';
import { screenRequestTask } from './pages/requestTask.js';
import { screenTaskSubmitted } from './pages/taskSubmitted.js';
import { screenTaskAccepted } from './pages/taskAccepted.js';
import { screenOrderCanceled } from './pages/orderCanceled.js';
import { screenChat } from './pages/chat.js';
import { screenChatThread } from './pages/chatThread.js';
import { screenProfile } from './pages/profile.js';
import { screenCreateMarketplace } from './pages/createMarketplace.js';

const ROUTES = {
  login: screenLogin,
  register: screenRegister,
  verify: screenVerify,
  forgot: screenForgot,
  reset: screenReset,
  home: screenHome,
  market: screenMarket,
  freelancer: screenFreelancer,
  activity: screenActivity,
  requestTask: screenRequestTask,
  taskSubmitted: screenTaskSubmitted,
  taskAccepted: screenTaskAccepted,
  orderCanceled: screenOrderCanceled,
  chat: screenChat,
  chatThread: screenChatThread,
  profile: screenProfile,
  createMarketplace: screenCreateMarketplace,
};

registerRoutes(ROUTES);
render();

// PWA: register the service worker for offline support / installability.
// Requires being served over http(s) — file:// and sandboxed previews
// will skip this silently.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* preview sandboxes / file:// origins may block this — safe to ignore */
    });
  });
}
