# Serah terima: portal inventaris LabMGM

Untuk divisi IT dan devops. Dokumen ini menjelaskan apa yang sudah ada, apa yang
masih palsu, dan apa yang harus dikerjakan sebelum portal dipakai sungguhan.
Spesifikasi lengkapnya ada di PRD (lihat tautan di `README.md`).

## Status

Prototipe frontend yang berjalan penuh dengan **data contoh di browser**. Belum
ada backend, Snipe-IT, Keycloak, atau email. Semua alur Rilis 1 sudah bisa
dicoba: login lebih dulu, katalog (tampilan ikon, daftar, rincian), manajemen
aset (tambah, ubah, kurangi, riwayat), keranjang, pengajuan guest dan member, verifikasi email, tiket
(cetak dan PNG), pelacakan, antrean Admin, halaman QR aset, dan lembar label.

## Menjalankan

Butuh Node 20.9 atau lebih baru (diuji di Node 24).

```bash
npm install
npm run dev -- -p 3004   # pengembangan
npm run build && npm start   # produksi
```

`npm run lint` dan `npx tsc --noEmit` harus bersih sebelum menggabungkan
perubahan. `npm audit --omit=dev` melaporkan 0 kerentanan; tujuh peringatan
`npm audit` biasa berasal dari rantai linter (dev saja).

## Peta kode

| Berkas | Isi |
| --- | --- |
| `src/lib/store.ts` | **Satu-satunya tempat data dibaca dan ditulis.** Penyimpanan di localStorage, semua aksi, dan turunan status |
| `src/lib/mock-data.ts` | Kategori, model, unit aset, dan tiket contoh |
| `src/lib/types.ts` | Bentuk data: tiket, item, unit, sesi |
| `src/lib/format.ts` | Label status, tanggal WIB, validasi email UB |
| `src/lib/ticket-png.ts` | Menggambar tiket PNG di kanvas |
| `src/components/` | Kerangka aplikasi, potongan halaman, bar mode contoh, komponen UI, kartu tiket, tampilan tabel, kode QR |
| `src/app/` | Halaman: `/masuk` (halaman pertama), `/` katalog, `/keranjang`, `/masuk`, `/lacak`, `/tiket/[nomor]`, `/aset/[tag]`, `/admin` (dasbor), `/admin/permintaan`, `/admin/aset` (+ `baru`, `[tag]/ubah`), `/admin/tiket/[nomor]`, `/admin/label` |

Desain: tata letak ala Snipe-IT (menu samping, dasbor, tabel) dengan token warna
di `src/app/globals.css`, font Hanken Grotesk, Geist, dan Geist Mono, terang dan
gelap, serta pola di `public/patterns`, sesuai website utama labmgm.org.
Kerangka ada di `app-shell.tsx`; potongan halaman bersama di `page-layout.tsx`
(`PageHeader`, `Box`, `StatTile`) dan `ui.tsx`.

## Yang masih palsu dan harus diganti

1. **Bar "Mode contoh" (`src/components/demo-bar.tsx`) dan `setRole`.** Siapa pun
   bisa menjadi Admin dengan satu klik. Hapus sebelum ada pengguna sungguhan,
   dan ganti dengan login Admin dan Maintainer yang diperiksa di server (akun
   lokal ber-2FA menurut PRD).
2. **Penyimpanan localStorage.** Ganti fungsi di `store.ts` dengan panggilan API:
   tiket ke layanan portal baru (database sendiri), data aset dan serah terima
   ke REST API Snipe-IT. Contoh pemetaan: `submitRequest`, `verifyEmail`,
   `decideTicket` ke layanan portal; `advanceTicket` ke tahap dipinjam dan
   dikembalikan memanggil check-out dan check-in Snipe-IT; `availableQty` dan
   `unitStatuses` dibaca dari Snipe-IT. Token API Snipe-IT hanya boleh ada di
   server.
3. **Verifikasi email guest.** Ditunda sampai email pengirim (Gmail IT MGM) siap:
   bendera `EMAIL_VERIFICATION` di `store.ts` bernilai `false`, jadi tiket guest
   langsung berstatus Diajukan dan Admin yang menyetujui. Saat diaktifkan, kode
   masih tetap `123456` (`VERIFY_CODE_DEMO`); kirim kode sungguhan dengan masa
   kedaluwarsa dan batas percobaan.
4. **Pelacakan tiket.** Pencocokan nomor dan email terjadi di browser. Pindahkan
   ke server dan batasi percobaan. Karena email guest belum diverifikasi, nomor
   tiket memakai akhiran acak (`MGM-yymm-nnnn-XXXX`); di server buat akhiran dari
   pembangkit acak yang aman, bukan dari urutan. Begitu pula izin melihat tiket
   (`canViewTicket`).
5. **Login.** `/masuk` adalah halaman pertama; `/` dan `/keranjang` dialihkan ke
   sana bila belum masuk (di `app-shell.tsx`). Tombol "Masuk dengan akun MGM"
   hanya menyetel anggota contoh, form guest langsung menyimpan data diri di
   sesi (`signInGuest`), dan tautan Admin hanya untuk mode contoh. Pengalihan ini
   hanya di sisi klien dan harus diulang di server (middleware atau pemeriksaan
   sesi). Untuk member, ganti dengan Keycloak (OIDC); butuh satu klien di realm
   `mgm` yang belum ada.
6. **Data contoh.** Jumlah dan nama barang adalah klaim lab di labmgm.org, bukan
   audit. Hapus banner "Data contoh" di katalog setelah impor data asli.
7. **Alamat di kode QR.** Label dan tiket PNG memakai alamat halaman saat
   dibuat. Cetak label hanya setelah portal ada di domain tetapnya, karena QR
   yang sudah menempel tidak bisa diubah.

## Manajemen aset: titik temu dengan Snipe-IT

Prototipe punya halaman Admin untuk tambah barang dan unit (`/admin/aset/baru`:
ketik nama barang dan pilih atau tambah kategori sendiri, tanpa daftar bawaan; awalan
kode label dibuat otomatis dari nama, misalnya `MGM-PRO-001`), ubah
unit dan ubah keadaannya (`/admin/aset/[tag]/ubah`), serta riwayat di
`/aset/[tag]`. Aksinya ada di `store.ts` (`addModel`, `addUnits`, `updateUnit`,
`setLifecycle`, `lifecycleBlocker`). Menurut PRD, aset dikelola di Snipe-IT;
halaman ini hanya jalan pintas untuk pekerjaan harian. Pemetaan yang disarankan
(**belum diuji, periksa saat pilot**): tambah dan ubah unit ke pembuatan dan
pembaruan aset lewat REST API (barang baru ke pembuatan model dan kategori); perawatan, hilang, dan pensiun ke label status
Snipe-IT (misalnya Undeployable, Lost/Stolen, Archived); riwayat dibaca dari log
aktivitas Snipe-IT. Impor CSV dan hapus permanen tetap hanya di Snipe-IT. Daftar
barang dan kategori contoh di `mock-data.ts` hanya data awal; hapus saat Admin
mulai mengisi data asli. Bila divisi IT memutuskan Admin cukup memakai Snipe-IT, hapus tiga
halaman itu dan simpan hanya tampilan baca.

## Keputusan yang sudah dibuat

- Login dua jalur: guest (nama, NIM atau NIP, email UB) dan member (akun MGM).
  Admin dan Maintainer memakai akun lokal Snipe-IT dan portal, tanpa SAML.
- Semua peminjam mengisi perizinan dan Admin yang menyetujui. Jumlah dan lama
  pinjam dinilai per permintaan; angka 1 sampai 30 hari dan 10 barang per
  permintaan di prototipe hanya sementara.
- MGM tidak menyediakan peminjaman ruangan, jadi tidak ada fitur ruangan.
- Label dibuat sendiri berupa QR. Barcode 1D belum ada.
- Data peminjam (nama, NIM atau NIP, email UB, barang) disimpan 2 tahun setelah
  peminjaman terakhir sebagai log; sesudahnya nama dan NIM dianonimkan dan catatan
  barangnya tetap.
- Anggaran nol: server Mac Mini yang sudah ada (bukan Railway, yang berbayar
  setelah uji coba 30 hari), perangkat lunak gratis atau sumber terbuka,
  subdomain labmgm.org.
- Arsitektur: Snipe-IT adalah backend aset dan tidak dimodifikasi. Portal punya
  server kecil sendiri dengan database SQLite untuk tiket, data guest, dan token
  API Snipe-IT; Snipe-IT dihubungi saat serah terima, pengembalian, dan membaca
  atau mengubah data aset. Tumpukan teknis (Next.js, route handler, SQLite)
  adalah usulan; teman devops boleh menyarankan gantinya.
- Peluncuran pertama hanya jalur guest. Member memakai jalur guest sampai klien
  OIDC di Keycloak ada.
- Email sementara tanpa verifikasi kode. Gmail IT MGM ditambahkan nanti sebagai
  pengirim notifikasi.
- Admin: seluruh divisi IT (3 orang), masing-masing satu akun.
- Data aset diisi manual oleh Admin setelah sistem jadi.
- Pilot dua minggu hanya di antara divisi IT. Lolos bila beberapa peminjaman
  selesai dari ajukan sampai kembali tanpa pencatatan di luar sistem.

## Masih menunggu jawaban

Pembagian tugas yang masih terbuka:

- **Pemegang proyek:** mencari pemegang akses admin Keycloak dan memintakan satu
  klien OIDC (cek juga apakah NIM ada di akun MGM); meminta teman devops
  menyetujui tumpukan teknis.
- **Devops:** nama subdomain dan DNS, spesifikasi Mac Mini, tempat salinan
  cadangan kedua, dan uji pemulihan sebelum pilot.
- **Belum ada jawabannya:** hak dosen dan mahasiswa, isi formulir perizinan,
  tempat dokumen serah terima, dan kebijakan privasi di labmgm.org yang belum
  terbit.

## Catatan teknis Next.js 16

- Cache Components aktif. Halaman dengan parameter dibungkus `Suspense`
  (lihat `src/app/tiket/[nomor]/page.tsx`); jangan memakai `new Date()` saat
  render sebelum hidrasi, dan jangan membaca `usePathname` di luar `Suspense`.
- Baca panduan di `node_modules/next/dist/docs/` sebelum mengubah perilaku
  Next, karena versi ini berbeda dari yang umum dikenal.

## Saran pemasangan di Mac Mini (belum diuji)

Jalankan `npm run build && npm start` di belakang pengelola proses (misalnya
launchd) dan proksi balik atau terowongan gratis ke subdomain. Image Docker
Snipe-IT sudah tersedia untuk arm64. Pastikan Mac Mini menyala sendiri setelah
listrik padam dan backup harian berjalan, sesuai PRD bagian 8.
