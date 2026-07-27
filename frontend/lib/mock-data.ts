import type { Provider, Task } from "@/types";

export const providers: Provider[] = [
  { id: "p1", name: "Ari Staprans", title: "Teknisi Listrik Senior", category: "Listrik", location: "Makassar", rating: 4.9, jobs: 128, verified: true, priceFrom: 150000, initials: "AS" },
  { id: "p2", name: "Keisha Mahira", title: "Electrical Engineer", category: "Listrik", location: "Jakarta Selatan", rating: 4.8, jobs: 96, verified: true, priceFrom: 200000, initials: "KM" },
  { id: "p3", name: "Budi Santoso", title: "Spesialis Plumbing", category: "Plumbing", location: "Jakarta Barat", rating: 4.7, jobs: 211, verified: true, priceFrom: 125000, initials: "BS" },
  { id: "p4", name: "Nadia Putri", title: "Teknisi AC & Cooling", category: "AC", location: "Tangerang", rating: 4.9, jobs: 154, verified: true, priceFrom: 175000, initials: "NP" },
  { id: "p5", name: "Rian Hidayat", title: "Furniture Carpenter", category: "Pertukangan", location: "Depok", rating: 4.8, jobs: 88, verified: true, priceFrom: 250000, initials: "RH" },
  { id: "p6", name: "Siti Rahma", title: "Home Cleaning Expert", category: "Kebersihan", location: "Bekasi", rating: 4.9, jobs: 302, verified: true, priceFrom: 100000, initials: "SR" },
];

export const tasks: Task[] = [
  { id: "TSK-1048", title: "Perbaiki korsleting dapur", category: "Listrik", location: "Kebayoran Baru, Jakarta", budget: 350000, date: "Hari ini, 14.00", status: "ongoing", provider: providers[0], note: "Listrik sering turun saat microwave dinyalakan." },
  { id: "TSK-1049", title: "Servis AC kamar utama", category: "AC", location: "Menteng, Jakarta", budget: 275000, date: "30 Jul, 09.00", status: "scheduled", provider: providers[3], note: "AC tidak dingin dan mengeluarkan suara." },
  { id: "TSK-1031", title: "Perbaikan pipa wastafel", category: "Plumbing", location: "Tebet, Jakarta", budget: 225000, date: "18 Jul, 11.00", status: "history", provider: providers[2], note: "Pipa bocor sudah selesai diperbaiki." },
  { id: "TSK-1050", title: "Rakit lemari dua pintu", category: "Pertukangan", location: "Setiabudi, Jakarta", budget: 300000, date: "Menunggu penyedia", status: "waiting", note: "Lemari flatpack baru, semua komponen tersedia." },
];

export const categories = ["Semua", "Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan"];

export const conversations = [
  { id: "c1", name: "Ari Staprans", initials: "AS", message: "Saya sudah dalam perjalanan ke lokasi.", time: "10:24", unread: 2 },
  { id: "c2", name: "Nadia Putri", initials: "NP", message: "Baik, jadwal hari Rabu sudah saya catat.", time: "Kemarin", unread: 0 },
  { id: "c3", name: "Budi Santoso", initials: "BS", message: "Terima kasih sudah menggunakan jasa saya.", time: "18 Jul", unread: 0 },
];
