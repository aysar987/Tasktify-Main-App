import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan tentang pengumpulan, penggunaan, dan perlindungan data pribadi di Tasktify.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      summary="Dokumen ini menjelaskan data pribadi yang diproses ketika Anda menggunakan Tasktify, alasan pemrosesannya, dan pilihan yang tersedia bagi Anda."
      sections={[
        {
          title: "1. Tentang kebijakan ini",
          paragraphs: [
            "Kebijakan ini berlaku untuk situs web dan layanan Tasktify. Tasktify mengelola platform yang membantu klien menemukan dan mengelola layanan dari penyedia jasa lokal. Kami memproses data sesuai hukum perlindungan data yang berlaku di Indonesia.",
            "Dengan membuat akun atau menggunakan fitur yang memerlukan akun, Anda menyatakan telah membaca kebijakan ini. Jika Anda tidak setuju dengan pemrosesan yang diperlukan untuk menyediakan layanan, jangan membuat akun atau menggunakan fitur tersebut.",
          ],
        },
        {
          title: "2. Data yang kami proses",
          bullets: [
            "Data akun dan identitas: nama, nama pengguna, email, nomor telepon, foto profil, serta informasi profil yang Anda berikan. Jika Anda memilih Google, Supabase dan Google memproses autentikasi dan dapat memberikan informasi profil dasar seperti nama, email, dan foto profil.",
            "Data layanan: permintaan tugas, kategori, lokasi/alamat layanan, jadwal, anggaran, catatan, status tugas, penilaian, percakapan, dan pesan.",
            "Data penyedia: informasi profil dan layanan. Untuk proses verifikasi penyedia, Tasktify dapat memproses foto KTP yang Anda unggah; dokumen ini bersifat sensitif dan hanya digunakan untuk proses verifikasi serta ditampilkan kepada pihak berwenang yang menangani verifikasi.",
            "Data lokasi: koordinat dapat diproses ketika Anda menggunakan fitur lokasi langsung untuk tugas. Gunakan fitur tersebut hanya saat diperlukan dan hentikan berbagi lokasi setelah tidak lagi diperlukan.",
            "Data transaksi dan teknis: status pembayaran, identitas pesanan, log keamanan, jenis perangkat/peramban, alamat IP, serta data yang diperlukan untuk mencegah penyalahgunaan dan menjaga layanan.",
          ],
        },
        {
          title: "3. Tujuan penggunaan data",
          bullets: [
            "Membuat dan mengelola akun, mengautentikasi pengguna, serta menyediakan fitur Tasktify.",
            "Mempertemukan klien dan penyedia, mengelola tugas, komunikasi, pembayaran, penilaian, dan dukungan.",
            "Memverifikasi penyedia dan menjaga keamanan pengguna, termasuk menangani laporan, sengketa, penipuan, atau pelanggaran ketentuan.",
            "Mengirim pemberitahuan layanan, termasuk pemberitahuan transaksi dan push jika Anda mengaktifkannya.",
            "Memenuhi kewajiban hukum, menegakkan ketentuan, dan meningkatkan keandalan layanan.",
          ],
        },
        {
          title: "4. Dasar pemrosesan dan pilihan Anda",
          paragraphs: [
            "Kami memproses data sejauh diperlukan untuk menyediakan layanan yang Anda minta, berdasarkan persetujuan Anda untuk fitur tertentu, untuk kepentingan keamanan dan operasional yang wajar, atau untuk memenuhi kewajiban hukum. Anda dapat memperbarui sebagian data profil melalui akun. Izin lokasi dan notifikasi dapat dikelola melalui pengaturan perangkat atau peramban.",
            "Anda dapat meminta akses, koreksi, atau penghapusan data pribadi, menarik persetujuan yang dapat ditarik, atau menyampaikan keberatan sesuai hak berdasarkan hukum yang berlaku dengan menghubungi admin@tasktify.id. Kami mungkin perlu memverifikasi identitas Anda dan dapat menyimpan data tertentu selama diwajibkan hukum atau diperlukan untuk menyelesaikan transaksi, keamanan, dan sengketa.",
          ],
        },
        {
          title: "5. Pihak yang membantu pemrosesan",
          paragraphs: [
            "Untuk menjalankan layanan, data dapat diproses oleh penyedia infrastruktur yang kami gunakan, termasuk Supabase untuk autentikasi, Google jika Anda memilih masuk dengan Google, penyedia hosting/server Tasktify, serta Midtrans jika pembayaran melalui layanan tersebut digunakan. Pihak terkait memproses data sesuai fungsi dan kebijakan masing-masing. Kami tidak menjual data pribadi Anda.",
            "Data tertentu dibagikan kepada pengguna lain sebagaimana diperlukan untuk layanan—misalnya informasi profil penyedia kepada klien, dan detail tugas yang diperlukan kepada penyedia yang menerima tugas. Kami juga dapat mengungkapkan data jika diwajibkan hukum atau diperlukan untuk melindungi keamanan dan hak pengguna.",
          ],
        },
        {
          title: "6. Penyimpanan dan keamanan",
          paragraphs: [
            "Data disimpan selama akun dan layanan Anda aktif, lalu dapat dipertahankan selama diperlukan untuk tujuan yang dijelaskan di atas, termasuk kewajiban hukum, pencatatan transaksi, keamanan, dan penyelesaian sengketa. Masa simpan dapat berbeda menurut jenis data.",
            "Kami menerapkan langkah teknis dan operasional yang wajar untuk melindungi data. Tidak ada transmisi atau penyimpanan elektronik yang dapat dijamin sepenuhnya aman. Jangan membagikan kata sandi atau kode autentikasi Anda kepada siapa pun.",
          ],
        },
        {
          title: "7. Transfer data dan perubahan kebijakan",
          paragraphs: [
            "Penyedia layanan dapat memproses atau menyimpan data di lokasi yang berbeda dari lokasi Anda. Jika transfer lintas negara terjadi, perlindungan yang diwajibkan oleh hukum yang berlaku akan diterapkan.",
            "Kami dapat memperbarui kebijakan ini saat layanan atau kewajiban hukum berubah. Versi terbaru akan dipublikasikan di halaman ini beserta tanggal berlakunya. Perubahan material dapat diberitahukan melalui layanan atau email yang terhubung dengan akun.",
          ],
        },
        {
          title: "8. Hubungi kami",
          paragraphs: [
            "Untuk pertanyaan atau permintaan terkait data pribadi, hubungi admin@tasktify.id. Mohon jangan mengirim kata sandi, kode autentikasi, atau salinan KTP melalui email kecuali diminta melalui saluran aman yang disediakan Tasktify.",
          ],
        },
      ]}
    />
  );
}
