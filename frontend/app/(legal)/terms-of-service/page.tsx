import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: "Syarat penggunaan platform Tasktify untuk klien dan penyedia jasa.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Syarat Layanan"
      summary="Syarat ini mengatur pembuatan akun dan penggunaan Tasktify. Baca dengan saksama sebelum mendaftar atau menggunakan layanan."
      sections={[
        {
          title: "1. Persetujuan dan kelayakan",
          paragraphs: [
            "Dengan membuat akun, memilih kotak persetujuan, atau menggunakan fitur yang memerlukan akun, Anda menyatakan telah membaca dan menyetujui Syarat Layanan ini serta Kebijakan Privasi. Jika Anda tidak setuju, jangan membuat akun atau menggunakan fitur tersebut.",
            "Anda harus memiliki kapasitas hukum untuk menyetujui syarat ini dan memberikan informasi yang benar. Jika Anda menggunakan Tasktify atas nama pihak lain atau organisasi, Anda menyatakan berwenang untuk melakukannya.",
          ],
        },
        {
          title: "2. Layanan Tasktify",
          paragraphs: [
            "Tasktify menyediakan platform untuk membantu klien menemukan penyedia jasa lokal, membuat dan mengelola permintaan tugas, berkomunikasi, serta mengelola pembayaran dan ulasan. Kecuali dinyatakan secara jelas, Tasktify bukan penyedia jasa yang melakukan pekerjaan fisik; perjanjian mengenai pekerjaan dilakukan antara klien dan penyedia.",
            "Status verifikasi pada platform menunjukkan proses verifikasi yang dilakukan Tasktify, bukan jaminan atas kualitas, keselamatan, hasil, atau ketersediaan setiap penyedia. Klien dan penyedia bertanggung jawab menilai kecocokan dan menyepakati rincian pekerjaan sebelum pekerjaan dimulai.",
          ],
        },
        {
          title: "3. Akun dan keamanan",
          bullets: [
            "Berikan informasi akun yang akurat dan perbarui jika berubah.",
            "Jaga kerahasiaan kata sandi dan akses Google Anda; Anda bertanggung jawab atas aktivitas yang terjadi melalui akun Anda, kecuali jika penggunaan tanpa izin segera dilaporkan kepada kami.",
            "Jangan membuat akun palsu, menyamar sebagai pihak lain, atau menggunakan akun orang lain tanpa izin.",
          ],
        },
        {
          title: "4. Aturan penggunaan",
          paragraphs: ["Anda setuju untuk tidak:"],
          bullets: [
            "Menggunakan layanan untuk tujuan yang melanggar hukum, menipu, melecehkan, mengancam, atau membahayakan orang lain.",
            "Mengunggah informasi atau materi yang melanggar hak pihak lain, berisi malware, atau tidak relevan dengan layanan.",
            "Mengganggu keamanan, mencoba mengakses sistem atau akun tanpa izin, melakukan scraping yang tidak diizinkan, atau mengganggu ketersediaan layanan.",
            "Menggunakan fitur lokasi untuk melacak orang tanpa persetujuan atau di luar pelaksanaan tugas terkait.",
            "Menyalahgunakan pembayaran, promosi, ulasan, proses verifikasi, atau mekanisme penyelesaian sengketa.",
          ],
        },
        {
          title: "5. Permintaan tugas, pembayaran, dan pembatalan",
          paragraphs: [
            "Klien bertanggung jawab memastikan rincian tugas, lokasi, jadwal, anggaran, dan instruksi yang dikirim sudah benar. Penyedia bertanggung jawab menyampaikan kemampuan, ketersediaan, harga, dan ruang lingkup layanan secara akurat. Para pihak harus menyepakati perubahan sebelum melanjutkan pekerjaan.",
            "Pilihan pembayaran yang tersedia ditampilkan pada saat transaksi. Pembayaran elektronik dapat diproses oleh Midtrans berdasarkan ketentuan dan kebijakan Midtrans; metode tunai, jika tersedia, diselesaikan langsung antara klien dan penyedia sesuai informasi di aplikasi. Biaya, status pembayaran, pembatalan, dan pengembalian dana mengikuti informasi transaksi serta ketentuan penyedia pembayaran yang berlaku.",
            "Pembatalan dan perubahan status tugas mengikuti fitur dan aturan yang ditampilkan dalam aplikasi. Hubungi dukungan jika terjadi masalah atau perselisihan. Tasktify dapat membantu memfasilitasi komunikasi, tetapi tidak menjamin hasil penyelesaian sengketa antara pengguna.",
          ],
        },
        {
          title: "6. Konten pengguna dan verifikasi penyedia",
          paragraphs: [
            "Anda tetap memiliki hak atas konten yang Anda kirim. Anda memberi Tasktify izin terbatas untuk menyimpan, menampilkan, dan memproses konten tersebut sejauh diperlukan untuk menjalankan, mengamankan, dan meningkatkan layanan.",
            "Penyedia yang mengajukan verifikasi wajib memberikan dokumen yang diminta dan memastikan dokumen tersebut miliknya atau digunakan dengan kewenangan yang sah. Dokumen identitas hanya digunakan untuk proses verifikasi dan ditangani sesuai Kebijakan Privasi. Jangan mengunggah dokumen identitas melalui kolom atau saluran yang tidak dimaksudkan untuk itu.",
          ],
        },
        {
          title: "7. Penangguhan dan penghentian akun",
          paragraphs: [
            "Anda dapat berhenti menggunakan layanan dan meminta bantuan terkait penutupan akun melalui admin@tasktify.id. Tasktify dapat membatasi, menangguhkan, atau menghentikan akses jika ada dugaan pelanggaran syarat, risiko keamanan, kewajiban hukum, atau tindakan yang dapat merugikan pengguna maupun layanan. Jika memungkinkan, kami akan memberi pemberitahuan dan kesempatan untuk menanggapi.",
            "Penghentian akun tidak menghapus kewajiban yang timbul sebelum penghentian atau catatan yang wajib disimpan berdasarkan hukum dan alasan sah lainnya.",
          ],
        },
        {
          title: "8. Ketersediaan, tanggung jawab, dan perubahan",
          paragraphs: [
            "Kami berupaya menjaga layanan tetap tersedia dan aman, tetapi tidak menjamin layanan selalu tanpa gangguan atau bebas kesalahan. Fitur dapat berubah, dihentikan sementara, atau diperbarui untuk pemeliharaan, keamanan, atau kebutuhan operasional.",
            "Sejauh diizinkan hukum, Tasktify tidak bertanggung jawab atas tindakan atau kelalaian pengguna lain, mutu pekerjaan penyedia, atau kerugian tidak langsung yang timbul dari penggunaan layanan. Tidak ada bagian syarat ini yang menghapus tanggung jawab yang tidak dapat dikecualikan menurut hukum yang berlaku. Pengguna bertanggung jawab atas kesepakatan dan pelaksanaan layanan langsung antara mereka.",
            "Tasktify dapat memperbarui syarat ini dengan menerbitkan versi terbaru di halaman ini dan memperbarui tanggal berlakunya. Untuk perubahan material, kami akan berupaya memberi pemberitahuan yang wajar. Penggunaan berlanjut setelah tanggal efektif perubahan berarti Anda menyetujui syarat yang diperbarui; jika tidak setuju, hentikan penggunaan layanan.",
          ],
        },
        {
          title: "9. Hukum dan kontak",
          paragraphs: [
            "Syarat ini ditafsirkan berdasarkan hukum Republik Indonesia, tanpa mengurangi hak konsumen yang tidak dapat dikesampingkan oleh hukum. Sengketa akan diupayakan terlebih dahulu untuk diselesaikan secara musyawarah. Ketentuan ini tidak membatasi hak Anda untuk menggunakan mekanisme penyelesaian sengketa yang tersedia menurut hukum.",
            "Untuk pertanyaan atau keluhan, hubungi admin@tasktify.id.",
          ],
        },
      ]}
    />
  );
}
