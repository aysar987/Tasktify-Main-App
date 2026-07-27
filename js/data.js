// js/data.js
// In-memory seed data for the demo. Swap these for real API calls later —
// every page reads from these same objects, so this is the one place to
// change when you wire up a backend.

export const providers = [
  { id: 1, name: 'Ari Staprans', role: 'Senior Electrical Technician', years: '3 yrs+ in electrical field', loc: 'Makassar, Sulawesi Selatan', rating: 4.9, cat: 'Electrical', about: 'Reliable residential & commercial electrical work — wiring, panel upgrades, troubleshooting and safety inspections.' },
  { id: 2, name: 'Keisha Mahira', role: 'Electrical Engineer', years: '5 yrs+ in electrical field', loc: 'Jakarta Selatan', rating: 4.8, cat: 'Electrical', about: 'Certified electrical engineer specializing in smart-home wiring and short-circuit diagnostics.' },
  { id: 3, name: 'Faizah Khairunnisa', role: 'Neurosurgeon (Home Care)', years: '8 yrs+ experience', loc: 'Bandung', rating: 5.0, cat: 'Medical', about: 'Home-visit medical consultations and post-op care coordination.' },
  { id: 4, name: 'Budi Santoso', role: 'Plumbing Specialist', years: '6 yrs+ in plumbing', loc: 'Jakarta Barat', rating: 4.7, cat: 'Plumbing', about: 'Leak repair, pipe installation and bathroom fitting for homes and small offices.' },
  { id: 5, name: 'Nadia Putri', role: 'AC & Cooling Technician', years: '4 yrs+ experience', loc: 'Tangerang', rating: 4.6, cat: 'HVAC', about: 'AC servicing, gas refill and installation for residential units.' },
  { id: 6, name: 'Rian Hidayat', role: 'Furniture Carpenter', years: '7 yrs+ in woodwork', loc: 'Depok', rating: 4.9, cat: 'Carpentry', about: 'Custom furniture builds and repairs, on-site measurement and finishing.' },
];

export const chats = [
  {
    id: 1, name: 'Ari Staprans', role: 'Electrical Engineer', date: 'Wednesday', last: 'Sure, I can be there by 2 PM tomorrow.', unread: true,
    thread: [
      { me: false, t: 'Hi! I saw your task request about the short circuit.' },
      { me: true, t: 'Yes, it started yesterday evening near the kitchen.' },
      { me: false, t: 'Got it. Sure, I can be there by 2 PM tomorrow.' },
    ],
  },
  {
    id: 2, name: 'Keisha Mahira', role: 'Electrical Engineer', date: '15/02/2026', last: 'Thank you for the quick response!', unread: false,
    thread: [
      { me: true, t: 'Thanks for finishing the panel upgrade.' },
      { me: false, t: 'Thank you for the quick response!' },
    ],
  },
  {
    id: 3, name: 'Faizah Khairunnisa', role: 'Neurosurgeon', date: 'Today', last: 'Let me know if you need to reschedule.', unread: false,
    thread: [{ me: false, t: 'Let me know if you need to reschedule.' }],
  },
];

export const tasks = {
  ongoing: [
    { id: 101, provider: providers[0], title: 'House Electrical Issue', desc: 'Find and locate a short circuit', date: '14–19 May', status: 'ongoing' },
  ],
  scheduled: [
    { id: 102, provider: providers[3], title: 'Kitchen Sink Leak Repair', desc: 'Fix leaking pipe under sink', date: '2 Jun', status: 'scheduled' },
  ],
  history: [
    { id: 103, provider: providers[4], title: 'AC Gas Refill', desc: 'Living room split AC unit', date: '11 Mar', status: 'done', rated: true },
  ],
  draft: [],
};

export const user = {
  name: 'Matthew Alden',
  username: 'matthew.a',
  phone: '+62 812-3456-7890',
  address: 'Jl. Merdeka No. 12, Jakarta Pusat',
  email: 'matthew.alden@email.com',
  photo: null,
};

// Helper: find a task by id across all activity buckets
export function findTaskById(id) {
  const all = [...tasks.ongoing, ...tasks.scheduled, ...tasks.history];
  return all.find(t => t.id === id);
}

// Helper: find or create a chat thread for a given provider name
export function findOrCreateChat(name) {
  let c = chats.find(c => c.name === name);
  if (!c) {
    c = { id: Date.now(), name, role: 'Provider', date: 'Now', last: 'Say hello 👋', unread: false, thread: [] };
    chats.unshift(c);
  }
  return c;
}
