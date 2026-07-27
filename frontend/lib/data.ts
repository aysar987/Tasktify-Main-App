import type { Chat, Provider, Task } from "@/types";

export const providers: Provider[] = [
  {
    id: 1,
    name: "Ari Staprans",
    role: "Teknisi Listrik Senior",
    experience: "3+ tahun pengalaman",
    location: "Makassar, Sulawesi Selatan",
    rating: 4.9,
    category: "Listrik",
    about:
      "Berpengalaman menangani instalasi, panel, korsleting, dan inspeksi keamanan listrik.",
  },
  {
    id: 2,
    name: "Keisha Mahira",
    role: "Electrical Engineer",
    experience: "5+ tahun pengalaman",
    location: "Jakarta Selatan",
    rating: 4.8,
    category: "Listrik",
    about:
      "Spesialis smart-home wiring dan diagnosis korsleting untuk rumah maupun kantor.",
  },
  {
    id: 3,
    name: "Faizah Khairunnisa",
    role: "Tenaga Medis Home Care",
    experience: "8+ tahun pengalaman",
    location: "Bandung",
    rating: 5,
    category: "Medis",
    about: "Konsultasi medis rumah dan koordinasi perawatan pascaoperasi.",
  },
  {
    id: 4,
    name: "Budi Santoso",
    role: "Spesialis Plumbing",
    experience: "6+ tahun pengalaman",
    location: "Jakarta Barat",
    rating: 4.7,
    category: "Plumbing",
    about: "Perbaikan kebocoran, instalasi pipa, dan perlengkapan kamar mandi.",
  },
  {
    id: 5,
    name: "Nadia Putri",
    role: "Teknisi AC",
    experience: "4+ tahun pengalaman",
    location: "Tangerang",
    rating: 4.6,
    category: "AC",
    about: "Servis, isi freon, dan instalasi AC residensial.",
  },
  {
    id: 6,
    name: "Rian Hidayat",
    role: "Furniture Carpenter",
    experience: "7+ tahun pengalaman",
    location: "Depok",
    rating: 4.9,
    category: "Pertukangan",
    about: "Pembuatan serta perbaikan furnitur custom di lokasi.",
  },
];

export const tasks: Task[] = [
  {
    id: 101,
    provider: "Ari Staprans",
    title: "Masalah Listrik Rumah",
    description: "Cari dan perbaiki titik korsleting",
    date: "14–19 Mei",
    status: "Berjalan",
  },
  {
    id: 102,
    provider: "Budi Santoso",
    title: "Pipa Dapur Bocor",
    description: "Perbaikan pipa di bawah wastafel",
    date: "2 Jun",
    status: "Terjadwal",
  },
  {
    id: 103,
    provider: "Nadia Putri",
    title: "Isi Freon AC",
    description: "Unit split ruang keluarga",
    date: "11 Mar",
    status: "Selesai",
  },
];

export const chats: Chat[] = [
  {
    id: 1,
    name: "Ari Staprans",
    role: "Teknisi Listrik",
    lastMessage: "Saya bisa tiba pukul 14.00 besok.",
    date: "Rabu",
    unread: true,
  },
  {
    id: 2,
    name: "Keisha Mahira",
    role: "Electrical Engineer",
    lastMessage: "Terima kasih atas respons cepatnya!",
    date: "15/02/2026",
  },
  {
    id: 3,
    name: "Faizah Khairunnisa",
    role: "Tenaga Medis",
    lastMessage: "Kabari saya jika perlu dijadwalkan ulang.",
    date: "Hari ini",
  },
];
