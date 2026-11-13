# Serah terima: portal inventaris LabMGM

Untuk divisi IT LabMGM, terutama devops dan backend. Dokumen ini menjelaskan apa
yang sudah ada, apa yang masih palsu, apa yang harus dibangun, dan bagaimana
memasangnya di Mac Mini. Kalau Anda hanya punya waktu sepuluh menit, baca bagian
1 sampai 4, 15, dan 16.

**Tanda yang dipakai.** Hal yang saya periksa sendiri ditulis apa adanya. Hal
yang berasal dari ingatan atau usulan diberi tanda **(belum diuji)** atau
**(usulan)**. Jangan memperlakukan keduanya sebagai fakta sebelum Anda
memeriksanya.

## Daftar isi

1. Ringkasan dan tautan
2. Status dan cakupan
3. Arsitektur sasaran dan pembagian tugas
4. Keputusan yang sudah dibuat
5. Menjalankan, menguji, dan demo publik
6. Peta kode
7. Model data
8. Alur dan aturan bisnis
9. Kontrak API usulan
10. Menyambungkan ke Snipe-IT
11. Login dan keamanan
12. Email
13. Data pribadi dan masa simpan
14. Kode QR dan label
15. Yang masih palsu dan harus diganti
16. Pemasangan di Mac Mini
17. Backup dan pemulihan
18. Pilot dua minggu
19. Daftar periksa sebelum dibuka untuk semua anggota
20. Risiko
21. Pertanyaan yang masih terbuka
22. Catatan teknis Next.js 16
23. Istilah

## 1. Ringkasan dan tautan

LabMGM butuh sistem inventaris dan peminjaman barang. Rencananya: **Snipe-IT**
mencatat aset (sumber kebenaran), dan sebuah **portal** buatan sendiri menjadi
wajah yang dipakai peminjam dan Admin. Snipe-IT tidak dimodifikasi; portal
memanggil REST API-nya. Prototipe di repo ini adalah **frontend portal** dengan
data contoh di browser.

| Apa | Di mana |
| --- | --- |
| Kode | https://github.com/Zxaviers/mgm-inventaris-portal (cabang `main`, publik) |
| Demo | https://mgm-inventaris-portal.vercel.app (Vercel, diperbarui otomatis tiap push ke `main`) |
| PRD | https://claude.ai/artifact/FcySRnZfwzYLig23XKUVgc (dokumen Claude; spesifikasi lengkap, 11 bagian, 2 diagram) |
| Paket serah terima | `labmgm-portal-serah-terima.zip` (kode tanpa `node_modules`) |
| Panduan mencoba | [handson.md](handson.md): 13 bagian, langkah demi langkah |
| Ringkasan fitur | [README.md](README.md) |

Pemilik sistem: **divisi IT LabMGM** (3 orang). Mereka juga Admin yang menyetujui
peminjaman dan yang memeliharanya.

## 2. Status dan cakupan

Prototipe frontend yang berjalan penuh dengan **data contoh di browser**. Belum
ada backend, Snipe-IT, Keycloak, atau email.

**Sudah bisa dicoba (Rilis 1):**
- Login lebih dulu (`/masuk`), dengan jalur Member, Guest, dan Admin contoh.
- Katalog dengan pencarian, kategori, filter tersedia, dan tampilan Ikon, Daftar,
  atau Rincian seperti pengelola berkas.
- Keranjang dan form pengajuan (tujuan, tanggal ambil, lama pinjam).
- Tiket: nomor, status, riwayat, batal, cetak, dan unduh PNG.
- Lacak tiket dengan nomor dan email.
- Admin: dasbor, antrean permintaan, keputusan (setuju dengan jumlah dan lama
  yang diubah, atau tolak dengan catatan), siap diambil, serah terima, pengembalian.
- Manajemen aset: tambah barang dan kategori yang diketik sendiri, tambah unit
  (satu atau banyak), ubah, kurangi stok (perawatan, hilang, pensiun, aktifkan
  kembali), dan riwayat per unit.
- Halaman publik hasil pindai QR (`/aset/<kode>`) dan lembar label cetak.
- Terang dan gelap, dengan desain mengikuti website utama labmgm.org.

**Sengaja tidak ada:** peminjaman ruangan (MGM tidak menyediakannya), barcode 1D,
pengadaan, infrastruktur, dan permintaan lisensi (Rilis 2), serta impor CSV dan
hapus permanen (tetap di Snipe-IT).

**Peringatan.** Jumlah dan nama barang di data contoh adalah klaim lab di
labmgm.org, bukan audit stok. Semua angka batas (1 sampai 30 hari, 10 barang per
permintaan) hanya sementara.

## 3. Arsitektur sasaran dan pembagian tugas

```
Peminjam (browser/ponsel) ──► Portal (Next.js, di Mac Mini)
Admin (browser)           ──►   │  ├─ database SQLite (tiket, guest, log)
Member (nanti, Keycloak)  ──►   │  └─ token API Snipe-IT (hanya di server)
                                ▼
                         Snipe-IT (Docker, di Mac Mini)
                           ├─ aplikasi + MariaDB/MySQL
                           └─ aset, model, kategori, status, check-out/in
```

**Yang disimpan di Snipe-IT:** model, kategori, unit aset beserta kode dan
nomor serinya, status unit (perawatan, hilang, pensiun), check-out dan check-in,
dan log aktivitasnya.

**Yang disimpan di portal sendiri (database SQLite):** tiket dan riwayatnya,
data diri peminjam di tiket (nama, NIM atau NIP, email), keputusan Admin,
sesi login, dan log akses. Snipe-IT tidak punya konsep tiket tamu, kode
pelacakan, atau persetujuan berjenjang, dan tidak boleh dimodifikasi menurut
PRD, jadi bagian ini harus ada di portal.

**Mengapa portal punya server sendiri.** Token API Snipe-IT tidak boleh sampai
ke browser, dan pemeriksaan akses (siapa boleh melihat tiket apa) harus terjadi
di server. Itu sebabnya prototipe yang murni di browser tidak bisa dipakai
langsung.

**Usulan tumpukan teknis (usulan, bukan keputusan):** satu proyek Next.js yang
sama dengan frontend ini, dengan route handler untuk API dan SQLite untuk
database. Alasannya: paling sedikit bagian yang bergerak, satu hal yang dipasang
di Mac Mini, dan pengurus lab berganti tiap periode. Teman devops boleh
mengusulkan penggantinya; kontrak di bagian 9 tidak bergantung pada pilihan itu.

### Siapa mengerjakan apa

| Pemilik | Tugas |
| --- | --- |
| **Pemegang proyek** | Cari pemegang akses admin Keycloak (`iam.labmgm.org`, realm `mgm`) dan minta satu klien OIDC; cek apakah NIM ada di akun MGM. Minta teman devops menyetujui tumpukan teknis. Jawab pertanyaan terbuka di bagian 21 yang menyangkut aturan lab. |
| **Devops** | Mac Mini (Docker, jaringan, nyala sendiri), subdomain dan DNS, HTTPS atau terowongan, Snipe-IT terpasang dan dikonfigurasi, backup dan uji pemulihan, email pengirim. |
| **Backend** | Server portal: database, API di bagian 9, sambungan ke Snipe-IT, login Admin, batas percobaan, akhiran acak nomor tiket, anonimisasi data. |
| **Seluruh divisi IT** | Pilot dua minggu, mengisi data aset asli, menjadi Admin dengan akun sendiri. |

## 4. Keputusan yang sudah dibuat

| Keputusan | Isi |
| --- | --- |
| Pemilik | Divisi IT LabMGM memiliki, memelihara, dan menyetujui peminjaman. |
| Backend lama | Portal dibuat dari awal. Backend Go lama (`mgm-hearth-backend`) tidak dipakai ulang; repo-nya juga tidak ada di GitHub publik. |
| Snipe-IT | Tidak dimodifikasi (lisensi AGPL-3.0, diperiksa 10 November 2026). Fitur kustom hidup di portal. |
| Cakupan | Hanya inventaris LabMGM sendiri; tidak termasuk peralatan Game Corner atau FILKOM. |
| Peminjam | Semua peminjam mengisi perizinan dan Admin yang menyetujui. Jumlah dan lama pinjam dinilai per permintaan. |
| Guest | Tanpa akun: nama, NIM atau NIP, email UB. Datanya hanya kontak di tiket. |
| Verifikasi email guest | **Ditunda** sampai email pengirim (Gmail IT MGM) siap. Bendera `EMAIL_VERIFICATION` di `store.ts` bernilai `false`; tiket guest langsung berstatus Diajukan. Admin tetap menyetujui tiap permintaan. |
| Member | Login dengan akun MGM lewat Keycloak (OIDC). Butuh satu klien yang belum ada. **Sampai klien itu ada, member memakai jalur guest.** |
| Admin dan Maintainer | Akun lokal ber-2FA, tanpa SAML. Admin adalah seluruh divisi IT (3 orang), masing-masing satu akun. |
| Peluncuran | Hanya jalur guest dulu; member menyusul. |
| Nomor tiket | `MGM-yymm-nnnn-XXXX`, dengan empat karakter acak di belakang supaya tiket orang lain tidak bisa ditebak (email tidak diverifikasi). |
| Data peminjam | Disimpan 2 tahun setelah peminjaman terakhir sebagai log; sesudahnya nama dan NIM dianonimkan dan catatan barangnya tetap. Lihat bagian 13. |
| Label | QR buatan sendiri. Tidak ada aturan label FILKOM atau UB yang harus diikuti. Barcode 1D belum ada. |
| Perangkat dan situs | Peramban ponsel cukup untuk memindai QR; tidak perlu aplikasi khusus. |
| Mode gelap | Ada sejak Rilis 1. |
| Anggaran | Nol. Perangkat lunak gratis atau sumber terbuka, server Mac Mini yang sudah ada, subdomain `labmgm.org`. |
| Server | Mac Mini, **bukan Railway**. Website utama memang berjalan di Railway (pernah dibayar; masa depannya belum diputuskan), tetapi Railway berbayar setelah uji coba 30 hari. |
| Data aset | Diisi manual oleh Admin setelah sistem jadi. Data contoh dan banner "Data contoh" dihapus saat itu. |
| Pilot | Dua minggu hanya di antara divisi IT. Lihat bagian 18. |
| Backup | Salinan harian ke tempat kedua. Tempatnya ditentukan devops. |
| Subdomain dan DNS | Diurus devops. Nama belum dipilih. |

## 5. Menjalankan, menguji, dan demo publik

Butuh Node 20.9 atau lebih baru (diuji di Node 24).

```bash
npm install
npm run dev -- -p 3004   # pengembangan, buka http://localhost:3004
npm run build && npm start   # produksi
```

- `npm run lint` dan `npx tsc --noEmit` harus bersih sebelum menggabungkan
  perubahan. `npm audit --omit=dev` melaporkan 0 kerentanan; tujuh peringatan
  `npm audit` biasa berasal dari rantai linter (dev saja).
- **Jangan menjalankan `npm run build` saat `npm run dev` hidup** di folder yang
  sama; keduanya memakai `.next` dan server pengembangan jadi error. Hentikan
  server dulu, atau hapus `.next` lalu mulai ulang.
- **Mencoba semua alur:** ikuti [handson.md](handson.md). Bar "Mode contoh" di
  bawah layar berganti peran Guest, Member, dan Admin tanpa login; ikon panah di
  bar itu mengembalikan data awal.
- **Demo publik.** Repo ini tersambung ke proyek Vercel (akun Hobby, gratis).
  Tiap push ke `main` membangun ulang dan memperbarui demo. Data demo tersimpan
  di browser masing-masing, jadi perubahan satu orang tidak terlihat orang lain.
  Vercel dipakai hanya untuk demo; sistem nyata berjalan di Mac Mini.
- **QR dari demo** menunjuk ke domain Vercel. Jangan ditempel di barang sungguhan.
- Data tersimpan di localStorage dengan kunci `labmgm-portal-contoh-v3`.
  Mengubah bentuk datanya berarti menaikkan versi kunci itu.

## 6. Peta kode

| Berkas | Isi |
| --- | --- |
| `src/lib/store.ts` | **Satu-satunya tempat data dibaca dan ditulis.** Penyimpanan di localStorage, semua aksi, dan turunan status. Ganti isinya, jangan sebar akses data ke berkas lain. |
| `src/lib/mock-data.ts` | Kategori, model, unit aset, dan tiket contoh (data awal saja) |
| `src/lib/types.ts` | Bentuk data: tiket, item, unit, model, kategori, sesi |
| `src/lib/format.ts` | Label status, kalimat status, tanggal WIB, validasi email UB (`UB_EMAIL`) |
| `src/lib/ticket-png.ts` | Menggambar tiket PNG di kanvas (2400 × 1080 px, selalu terang) |
| `src/components/` | Kerangka aplikasi (`app-shell.tsx`), potongan halaman (`page-layout.tsx`, `ui.tsx`), bar mode contoh (`demo-bar.tsx`), formulir aset (`unit-form.tsx`), kartu tiket, tampilan tabel, kode QR |
| `src/app/` | Halaman, lihat tabel di bawah |

| Alamat | Halaman | Siapa |
| --- | --- | --- |
| `/masuk` | Login, halaman pertama | Semua |
| `/` | Katalog | Sudah masuk |
| `/keranjang` | Keranjang dan form pengajuan | Sudah masuk |
| `/lacak` | Lacak tiket dengan nomor dan email | Semua |
| `/tiket/[nomor]` | Tiket | Pemilik tiket atau Admin |
| `/aset/[tag]` | Halaman hasil pindai QR | Semua (rinci khusus Admin) |
| `/admin` | Dasbor | Admin |
| `/admin/permintaan` | Antrean permintaan | Admin |
| `/admin/tiket/[nomor]` | Keputusan dan serah terima | Admin |
| `/admin/aset` | Daftar aset | Admin |
| `/admin/aset/baru` | Tambah barang atau unit | Admin |
| `/admin/aset/[tag]/ubah` | Ubah unit dan keadaannya | Admin |
| `/admin/label` | Lembar label QR | Admin |

Desain: tata letak ala Snipe-IT (menu samping, dasbor, tabel) dengan token warna
di `src/app/globals.css`, font Hanken Grotesk, Geist, dan Geist Mono, terang dan
gelap, serta pola di `public/patterns`, sesuai website utama labmgm.org.

## 7. Model data

Bentuk di `src/lib/types.ts`. Usulan tabel SQLite mengikutinya.

**Kategori** `{ id, name, tone }`. `tone` salah satu dari blue, yellow, red,
green, hanya untuk warna di tampilan.

**Model (barang)** `{ id, name, categoryId, description, prefix, total }`.
`prefix` adalah awalan kode aset, misalnya `VRQ` untuk `MGM-VRQ-001`. `total`
hanya angka contoh; jumlah sebenarnya dihitung dari unit.

**Unit aset** `{ tag, modelId, serial, condition, place, lifecycle? }`.
- `tag` unik, berbentuk `MGM-<prefix>-<nnn>`; ini yang ada di QR.
- `lifecycle` kosong berarti aktif; selain itu `perawatan`, `hilang`, atau
  `pensiun`.
- `place` (ruangan dan rak) dan `serial` hanya tampil ke Admin.

**Tiket** `{ number, createdAt, status, requester, purpose, pickupDate,
durationDays, approvedDurationDays?, items[], decisionNote?, history[] }`.
- `requester`: `{ kind: guest|member, name, nimNip?, email }`.
- `items[]`: `{ modelId, qty, approvedQty? }`. Tiket meminta **model**, bukan unit
  tertentu.
- `history[]`: `{ at, status, by, note? }`; tiap perubahan status menambah satu
  baris.
- `pickupDate` berformat `YYYY-MM-DD`; waktu lain disimpan ISO dan ditampilkan
  dalam WIB (`Asia/Jakarta`).

**Log aset** `{ at, tag, action, by, note? }`: Ditambahkan, Data diubah, Dikirim
ke perawatan, Ditandai hilang, Dipensiunkan, Diaktifkan kembali.

**Sesi** `{ role: guest|member|admin, name?, nimNip?, email? }`. Guest anonim
adalah `role == guest` tanpa `name`.

## 8. Alur dan aturan bisnis

### Status tiket

```
menunggu_verifikasi ─(kode benar)─► diajukan ─(Admin)─► disetujui ─► siap_diambil ─► dipinjam ─► dikembalikan
        │                              │                                              │
        └────────(peminjam)────────────┴──► dibatalkan                                └─(lewat tenggat)─► terlambat
                                       └─(Admin)─► ditolak
```

- `menunggu_verifikasi` hanya muncul bila `EMAIL_VERIFICATION` bernilai `true`.
- Peminjam hanya bisa membatalkan saat `diajukan` atau `menunggu_verifikasi`.
- `terlambat` **diturunkan**, bukan disimpan: tiket `dipinjam` yang lewat tanggal
  kembali ditampilkan sebagai terlambat (`effectiveStatus`). Di server,
  hitung saat dibaca atau lewat pekerjaan terjadwal.
- Tanggal kembali = `pickupDate` + (`approvedDurationDays` atau
  `durationDays`) hari.

### Aturan pengajuan

- Paling banyak 10 barang per permintaan (jumlah total, sementara).
- Lama pinjam 1 sampai 30 hari (sementara). Tanggal ambil tidak boleh sebelum hari ini.
- Jumlah per barang tidak boleh melebihi yang tersedia saat diajukan.
- Email guest harus berakhiran `ub.ac.id` (`UB_EMAIL`), termasuk subdomain seperti
  `student.ub.ac.id`.
- Telepon dan organisasi tidak diminta.

### Keputusan Admin

- Admin bisa **menyetujui** dengan mengubah jumlah per barang (tidak melebihi yang
  tersedia) dan lama pinjam, atau **menolak** dengan catatan.
- Setelah disetujui, Admin menggeser tiket: siap diambil, dipinjam (serah
  terima), dikembalikan.

### Ketersediaan

- `tersedia(model) = jumlah unit aktif − jumlah yang tertahan oleh tiket`.
- Unit aktif = unit tanpa `lifecycle`.
- Tiket yang menahan stok: `disetujui`, `siap_diambil`, `dipinjam`, `terlambat`.
  Tiket `diajukan` **belum** menahan stok ("Barang belum dipesan sampai Admin
  menyetujui").
- Status per unit (`tersedia`, `dipesan`, `dipinjam`, `perawatan`, `hilang`,
  `pensiun`) di prototipe **dikarang**: unit diurutkan menurut kode lalu diberi
  status dipinjam, dipesan, sisanya tersedia. **Di sistem nyata ini harus diganti**
  dengan pencatatan unit mana yang dipegang tiket (lihat bagian 10).

### Keadaan unit

- Admin bisa Kirim ke perawatan, Tandai hilang, Pensiunkan, atau Aktifkan
  kembali. Tandai hilang dan Pensiunkan wajib beralasan.
- Unit yang sedang **dipinjam atau dipesan** tidak boleh diubah keadaannya;
  selesaikan tiketnya dulu (`lifecycleBlocker`).
- Mengubah keadaan mengurangi atau menambah stok tersedia di katalog.
- Nomor seri harus unik antar unit. Nomor seri hanya bisa diisi saat menambah satu
  unit; untuk banyak unit, isi lewat Ubah.

### Menambah barang dan unit

- Barang baru diketik sendiri (nama) dengan kategori yang dipilih atau ditambah
  baru. Nama barang yang sudah ada ditolak; pilih dari daftar untuk menambah unit.
- Awalan kode dibuat otomatis dari nama (`suggestPrefix`) dan diberi angka bila
  bentrok. Contoh: "Proyektor" menjadi `PRO`, unit `MGM-PRO-001`.
- 1 sampai 20 unit sekaligus; kode berlanjut dari nomor terakhir.

### Siapa boleh melihat apa

- **Tiket:** Admin; pembuatnya di browser yang sama; member yang emailnya sama
  dengan email di tiket; atau siapa pun yang berhasil melacak dengan nomor dan email
  yang cocok (disimpan di `sessionStorage` per tab). Fungsinya `canViewTicket`.
- **Halaman aset publik:** nama, status, dan tombol pinjam untuk semua orang;
  nomor seri, kondisi, tempat, dan tiket terkait hanya untuk Admin.
- **Pelacakan** mengembalikan ringkasan; jangan mengembalikan lebih dari yang
  perlu.

## 9. Kontrak API usulan

Setiap fungsi di `store.ts` yang menulis data menjadi satu panggilan ke server.
Nama endpoint hanya usulan. Semua panggilan Admin butuh sesi Admin; semua tulisan
perlu perlindungan CSRF.

| Fungsi di `store.ts` | Endpoint (usulan) | Pemeriksaan di server |
| --- | --- | --- |
| `signInGuest` | `POST /api/sesi/guest` | Nama, NIM atau NIP, email `ub.ac.id`; batas laju per IP |
| (member) | `GET /api/sesi/keycloak/masuk` dan `/callback` | OIDC authorization code; simpan sesi di cookie HttpOnly |
| `signOut` | `DELETE /api/sesi` | Hapus sesi |
| `submitRequest` | `POST /api/tiket` | Validasi semua aturan pengajuan; hitung stok di server; buat nomor tiket dengan akhiran acak; batas laju dan batas tiket terbuka per email atau NIM |
| `verifyEmail` | `POST /api/tiket/:nomor/verifikasi` | Hanya bila verifikasi diaktifkan; kode kedaluwarsa dan batas percobaan |
| (pelacakan di `/lacak`) | `POST /api/tiket/lacak` | Cocokkan nomor dan email tanpa membedakan huruf besar; batas percobaan per IP dan per nomor; jangan bocorkan apakah nomor ada |
| (baca tiket) | `GET /api/tiket/:nomor` | `canViewTicket` di server |
| `cancelTicket` | `POST /api/tiket/:nomor/batal` | Hanya status `diajukan` atau `menunggu_verifikasi`; hanya pemilik |
| `decideTicket` | `POST /api/admin/tiket/:nomor/keputusan` | Admin; jumlah tidak melebihi stok saat itu; hanya dari `diajukan` |
| `advanceTicket` | `POST /api/admin/tiket/:nomor/langkah` | Admin; urutan siap_diambil → dipinjam → dikembalikan; saat `dipinjam` dan `dikembalikan` panggil Snipe-IT |
| `addModel` | `POST /api/admin/model` | Admin; nama unik; awalan unik |
| `addUnits` | `POST /api/admin/unit` | Admin; 1 sampai 20; kode berurutan tanpa celah balapan (transaksi) |
| `updateUnit` | `PATCH /api/admin/unit/:tag` | Admin; nomor seri unik |
| `setLifecycle` | `POST /api/admin/unit/:tag/keadaan` | Admin; tolak bila unit dipinjam atau dipesan; catatan wajib untuk hilang dan pensiun |
| `availableQty`, `unitStatuses`, katalog | `GET /api/katalog`, `GET /api/aset/:tag` | Baca dari Snipe-IT (dengan cache singkat); sembunyikan serial, kondisi, tempat dari non-Admin |

**Nomor tiket.** Urutan `nnnn` per bulan harus dari penghitung database dalam
transaksi supaya dua permintaan serentak tidak mendapat nomor sama. Akhiran
empat karakter dari pembangkit acak yang aman (di prototipe:
`crypto.getRandomValues` dengan huruf dan angka tanpa I, O, 0, 1; kira-kira satu
juta kemungkinan per nomor).

## 10. Menyambungkan ke Snipe-IT

Pemetaan di bawah **dibuat dari ingatan akan REST API Snipe-IT dan belum
diuji**. Periksa tiap endpoint di dokumentasi API resmi Snipe-IT dan coba di
instance percobaan sebelum dipakai. PRD juga mencatat bahwa sebagian endpoint
belum terverifikasi, misalnya membuat pemeliharaan.

| Kebutuhan portal | Snipe-IT (belum diuji) |
| --- | --- |
| Daftar model dan kategori | `GET /api/v1/models`, `GET /api/v1/categories` |
| Barang baru | `POST /api/v1/models` (butuh kategori); kategori baru `POST /api/v1/categories` bertipe aset |
| Unit baru | `POST /api/v1/hardware` dengan `model_id`, `status_id`, `asset_tag`, serial |
| Cari unit dari kode QR | `GET /api/v1/hardware/bytag/{tag}` |
| Ubah unit | `PATCH` pada `hardware/{id}` |
| Perawatan, hilang, pensiun | Ganti `status_id` ke label status yang Anda buat (misalnya Undeployable, Lost/Stolen, Archived) |
| Serah terima | `POST hardware/{id}/checkout` |
| Pengembalian | `POST hardware/{id}/checkin` |
| Riwayat unit | Log aktivitas Snipe-IT |

Autentikasi: token API pribadi dari akun Admin Snipe-IT, dikirim sebagai
`Authorization: Bearer`. Simpan hanya di variabel lingkungan server. **Periksa
masa berlaku token itu** dan catat tanggal kedaluwarsanya; token yang diam-diam
habis akan mematikan portal.

### Tiga hal yang harus diputuskan sebelum membangun sambungan

1. **Check-out butuh penerima.** Di Snipe-IT, check-out ditujukan ke pengguna,
   lokasi, atau aset lain. Guest bukan pengguna Snipe-IT (keputusan PRD). Usulan:
   buat satu pengguna bersama, misalnya "Peminjam portal", dan tulis nomor tiket
   di catatan check-out. Nama peminjam asli tetap di portal. **(belum diuji)**
2. **Unit mana yang dipegang tiket.** Tiket meminta model; saat serah terima Admin
   harus memilih unit fisik, paling mudah dengan **memindai QR unit** di ponsel.
   Portal lalu menyimpan daftar kode unit di tiket dan baru memanggil check-out.
   Prototipe tidak punya langkah ini (statusnya dikarang), jadi ini pekerjaan baru.
3. **Siapa sumber kebenaran stok.** Usulan: Snipe-IT untuk keberadaan dan keadaan
   unit, portal untuk tiket. Hitung ketersediaan di portal dari dua sumber itu
   dan simpan sementara (cache) sekitar satu menit supaya Snipe-IT tidak dibanjiri
   pembacaan.

### Kalau Admin cukup memakai Snipe-IT langsung

PRD semula menyatakan aset dikelola di Snipe-IT. Halaman manajemen aset di
portal (tambah, ubah, keadaan) adalah jalan pintas untuk pekerjaan harian. Bila
divisi IT memutuskan Admin cukup memakai Snipe-IT, hapus tiga halaman itu
(`/admin/aset/baru`, `/admin/aset/[tag]/ubah`, dan aksinya di `store.ts`) dan
simpan hanya tampilan baca.

Impor massal CSV dan hapus permanen tetap di Snipe-IT.

## 11. Login dan keamanan

### Jalur login

| Jalur | Cara | Status |
| --- | --- | --- |
| Guest | Nama, NIM atau NIP, email UB; tanpa akun | Diluncurkan lebih dulu |
| Member | Akun MGM lewat Keycloak OIDC | Menunggu klien OIDC; **sementara memakai jalur guest** |
| Admin dan Maintainer | Akun lokal ber-2FA | Harus dibangun; tombol "Admin" mode contoh dihapus |

**Keycloak.** Sudah ada di `iam.labmgm.org`. Portal butuh satu klien OIDC di realm
`mgm`. Pengaturan yang diminta: nama `portal-inventaris`, OpenID Connect, akses
rahasia (confidential), alur authorization code; direct access grant dan implicit
dimatikan; scope `openid profile email`; alamat balik dan web origin memakai
subdomain portal. Rahasia klien diserahkan langsung ke devops, bukan di grup.
Tanyakan juga atribut apa yang tersedia (nama, email, NIM atau NIP, status aktif).
Snipe-IT **tidak** memakai Keycloak: SAML 2.0 didukung dan bisa dipasang nanti,
tetapi Keycloak tidak disebut namanya di dokumentasi, jadi belum teruji; OIDC bukan
fitur bawaan Snipe-IT.

**Login Admin portal (usulan).** Karena Snipe-IT tidak memakai Keycloak, buat akun
Admin lokal di portal (3 orang) dengan kata sandi dan TOTP. Ini keputusan terbuka
yang perlu dikonfirmasi backend.

### Daftar periksa keamanan

- Token Snipe-IT dan rahasia klien Keycloak hanya di variabel lingkungan server,
  tidak di repo, tidak di browser.
- Semua lewat HTTPS. Cookie sesi `HttpOnly`, `Secure`, `SameSite=Lax` atau lebih
  ketat. Perlindungan CSRF pada semua tulisan.
- **Pengalihan ke halaman masuk di `app-shell.tsx` hanya di sisi klien.** Ulangi
  di server (middleware atau pemeriksaan sesi di tiap route), karena siapa pun
  bisa memanggil API langsung.
- Semua pemeriksaan hak (`canViewTicket`, hanya Admin boleh melihat serial) harus
  diulang di server. Browser tidak bisa dipercaya.
- Batas percobaan pada pelacakan tiket, pengajuan guest, dan login Admin.
- **Spam tiket.** Karena email guest tidak diverifikasi, siapa pun bisa membanjiri
  antrean dengan data palsu. Pengaman yang disarankan: batas laju per IP, batas
  jumlah tiket terbuka per email atau NIM, kolom jebakan (honeypot) di form, dan
  Admin bisa menolak massal. Aktifkan kembali verifikasi email bila spam terjadi.
- Snipe-IT: aktifkan 2FA, panjang kata sandi minimal, dan larangan kata sandi
  umum (Snipe-IT mendukung ketiganya menurut PRD).
- Beri tiap Admin akun sendiri; jangan berbagi kata sandi.
- Perbarui Snipe-IT dan dependensi secara berkala (lihat bagian 16).

## 12. Email

- **Sekarang:** tidak ada email sama sekali. Kode verifikasi di prototipe tetap
  `123456` (`VERIFY_CODE_DEMO`) hanya untuk demo.
- **Rencana:** SMTP dari Gmail IT MGM, ditambahkan nanti. Email dibutuhkan untuk
  notifikasi tiket (diajukan, diputuskan, siap diambil, jatuh tempo), notifikasi
  Snipe-IT, dan kode verifikasi bila diaktifkan.
- Catatan Gmail **(belum diuji)**: akun biasanya butuh 2FA dan "sandi aplikasi"
  untuk SMTP, dan ada batas pengiriman harian akun gratis. Periksa angkanya sebelum
  mengandalkan.
- Jangan mengirim langsung dari Mac Mini; email dari alamat rumahan cenderung
  masuk spam.
- Periksa juga apakah **port email keluar tidak diblokir** jaringan kampus.
- Saat verifikasi diaktifkan: kode kedaluwarsa (misalnya 15 menit), batas
  percobaan (misalnya 5), dan batas kirim ulang.

## 13. Data pribadi dan masa simpan

Data yang disimpan: nama, NIM atau NIP, email UB, barang yang dipinjam, dan riwayat
tiket. Tujuannya melacak barang hilang.

- **Keputusan:** simpan 2 tahun setelah peminjaman terakhir, lalu **anonimkan nama
  dan NIM** dan biarkan catatan barangnya. Log ikut backup.
- **Pekerjaan terjadwal** (harian atau mingguan) menjalankan anonimisasi itu di
  database portal, dan di salinan backup yang lebih lama dari masa simpan.
- **Perlu diputuskan:** apakah **email** juga dianonimkan. Email adalah data pribadi
  juga, jadi usulan saya ya, kecuali ada alasan menyimpannya.
- Kebijakan privasi di labmgm.org **belum terbit**; tautkan saat sudah ada.
- UU Pelindungan Data Pribadi (UU 27/2022) menuntut masa simpan dan penghapusan
  yang jelas; PRD mencatatnya sebagai kebutuhan non-fungsional. Saya bukan ahli
  hukum; tanyakan ke pihak yang berwenang bila ragu.
- Tampilkan satu kalimat pemberitahuan di form guest tentang apa yang disimpan dan
  berapa lama.

## 14. Kode QR dan label

- Isi QR: `<alamat portal>/aset/<kode>` untuk label aset, dan
  `<alamat portal>/tiket/<nomor>` untuk tiket PNG. Pemindai membuka halaman di
  peramban ponsel.
- **QR yang sudah menempel tidak bisa diubah.** Cetak label **hanya setelah**
  portal ada di domain tetapnya dan teman devops sudah membuktikan bahwa alamat itu
  terbuka dari luar. Kode QR di prototipe memakai alamat halaman saat dibuat, jadi
  QR dari demo menunjuk ke domain Vercel.
- Tiga ukuran lembar label (`/admin/label`): Kecil 40 × 20 mm, Sedang 60 × 30 mm,
  Besar 80 × 40 mm. Setiap label memuat QR, kode, nama, logo, dan strip warna
  kategori. Isi kode QR sudah diuji terbaca.
- Barcode 1D belum ada (belum diputuskan perlu atau tidak).
- Uji pindai label tercetak dengan beberapa ponsel dan bahan stiker sebelum
  mencetak banyak.
- Tiket PNG berukuran 2400 × 1080 px dan selalu berlatar terang walau halaman
  sedang gelap.

## 15. Yang masih palsu dan harus diganti

1. **Bar "Mode contoh" (`src/components/demo-bar.tsx`) dan `setRole`.** Siapa pun
   bisa menjadi Admin dengan satu klik. Hapus sebelum ada pengguna sungguhan, dan
   ganti dengan login Admin yang diperiksa di server. Saran: sembunyikan lewat
   variabel lingkungan (misalnya `NEXT_PUBLIC_DEMO=1`) supaya demo di Vercel tetap
   jalan dan build produksi tidak memuatnya.
2. **Penyimpanan localStorage.** Ganti fungsi di `store.ts` dengan panggilan API
   (bagian 9): tiket ke layanan portal, data aset dan serah terima ke REST API
   Snipe-IT. `availableQty` dan `unitStatuses` dibaca dari Snipe-IT dan tiket.
   Token API Snipe-IT hanya boleh ada di server.
3. **Verifikasi email guest.** Dimatikan lewat bendera `EMAIL_VERIFICATION`.
   Saat diaktifkan, kode masih tetap `123456`; kirim kode sungguhan dengan masa
   kedaluwarsa dan batas percobaan.
4. **Pelacakan tiket.** Pencocokan nomor dan email terjadi di browser. Pindahkan ke
   server dan batasi percobaan. Karena email guest belum diverifikasi, nomor tiket
   memakai akhiran acak; di server buat akhiran dari pembangkit acak yang aman,
   bukan dari urutan.
5. **Login.** `/masuk` adalah halaman pertama; `/` dan `/keranjang` dialihkan ke
   sana bila belum masuk (di `app-shell.tsx`). Tombol "Masuk dengan akun MGM" hanya
   menyetel anggota contoh, form guest langsung menyimpan data diri di sesi
   (`signInGuest`), dan tautan Admin hanya untuk mode contoh. Pengalihan hanya di
   sisi klien dan harus diulang di server. Untuk member, ganti dengan Keycloak.
6. **Data contoh.** Jumlah dan nama barang adalah klaim lab di labmgm.org, bukan
   audit. Hapus banner "Data contoh" di katalog setelah impor data asli, dan
   kosongkan `mock-data.ts`.
7. **Status per unit.** Dikarang dari urutan kode (bagian 8). Ganti dengan unit
   yang dipilih saat serah terima.
8. **Alamat di kode QR.** Label dan tiket PNG memakai alamat halaman saat dibuat
   (`window.location.origin`). Ambil dari satu pengaturan alamat tetap di server.
9. **Penghitung nomor tiket.** Di prototipe diambil dari daftar tiket di memori;
   di server pakai penghitung dalam transaksi.
10. **Batas sementara.** 1 sampai 30 hari dan 10 barang per permintaan (konstanta
    `MAX_ITEMS_PER_REQUEST` dan validasi di `keranjang/page.tsx`) menunggu
    keputusan lab.

## 16. Pemasangan di Mac Mini

Semua langkah di bagian ini **belum diuji**; ini daftar kerja, bukan resep yang
terbukti.

### Periksa dulu (belum diketahui sampai sekarang)

- [ ] Chip, RAM, dan sisa disk Mac Mini; macOS yang terpasang.
- [ ] Apakah Docker bisa dijalankan di sana (Colima sumber terbuka, atau Docker
      Desktop; periksa syarat lisensi Docker Desktop untuk lab kampus).
- [ ] Apakah port email keluar tidak diblokir jaringan.
- [ ] Apakah Mac Mini punya alamat publik atau harus lewat terowongan.
- [ ] Siapa yang punya akses fisik dan SSH ke mesin itu.
- [ ] Nama subdomain dan siapa yang mengatur DNS `labmgm.org`.

### Komponen

| Komponen | Cara jalan | Catatan |
| --- | --- | --- |
| Snipe-IT | Docker (image `snipe/snipe-it`, tersedia untuk arm64; dicek di Docker Hub 10 November 2026) bersama MariaDB atau MySQL | Kunci versi image, jangan `latest` |
| Portal | `npm run build && npm start` di bawah pengelola proses (misalnya launchd) | Berjalan sebagai pengguna biasa, bukan root |
| Akses dari luar | Proksi balik atau terowongan gratis ke subdomain | Mac Mini di kampus biasanya tanpa alamat publik; pilih terowongan yang tidak membuka port masuk |
| HTTPS | Dari proksi atau terowongan | Wajib |

Memasang Snipe-IT langsung di macOS tanpa Docker: saya tidak memeriksa apakah
didukung secara resmi. Docker adalah jalur yang direncanakan.

### Pengaturan Snipe-IT yang perlu dilakukan **(belum diuji)**

- Zona waktu `Asia/Jakarta` dan bahasa.
- Email keluar (SMTP) setelah Gmail IT MGM siap.
- Kategori, label status (perawatan, hilang, pensiun), dan lokasi (rak, lemari).
- Akun Admin untuk tiga orang, masing-masing dengan 2FA, panjang kata sandi
  minimal, dan larangan kata sandi umum.
- Satu pengguna bersama untuk penerima check-out (lihat bagian 10).
- Token API untuk portal; catat masa berlakunya.
- Branding (logo, warna) sejauh pengaturannya mengizinkan. Dokumentasi yang dibaca
  **tidak** menyebut pengaturan logo, warna, atau CSS; jangan menjanjikannya. Karena
  pengguna umum memakai portal, tampilan standar Snipe-IT untuk Admin dapat diterima.

### Agar mesin tahan gangguan

- [ ] Mac Mini diatur menyala sendiri setelah listrik padam, dan tidak tidur.
- [ ] Docker dan portal hidup otomatis setelah mesin menyala tanpa orang login
      (periksa caranya di macOS; sebagian Docker di macOS baru jalan setelah login).
- [ ] Kontainer memakai kebijakan mulai ulang otomatis.
- [ ] Ada pemantauan sederhana: pengecekan berkala bahwa portal dan Snipe-IT
      menjawab, dan peringatan bila disk hampir penuh.
- [ ] Langkah pasang dan pemulihan dicatat di dokumen serah terima (bagian ini dan
      17 boleh dipindahkan ke tempat yang disepakati).
- [ ] Satu orang selain devops tahu cara masuk ke mesin dan menyalakan ulang.

### Memperbarui

- Snipe-IT diperbarui dengan mengganti versi image setelah membaca catatan rilisnya
  dan **setelah backup**. Uji di salinan lebih dulu bila perubahan besar.
- Portal diperbarui dengan menarik kode dan membangun ulang; jalankan
  `npm run lint`, `npx tsc --noEmit`, dan `npm run build` sebelumnya.
- `npm audit --omit=dev` secara berkala.

## 17. Backup dan pemulihan

Target dari PRD: pulih dalam 4 jam (target usulan, bukan hasil pengukuran).

| Yang dicadangkan | Cara (usulan) |
| --- | --- |
| Database SQLite portal | Salinan konsisten dengan perintah backup SQLite, bukan menyalin berkas yang sedang ditulis |
| Database Snipe-IT (MariaDB atau MySQL) | Dump berkala |
| Berkas unggahan Snipe-IT | Salin volume penyimpanan |
| Konfigurasi dan rahasia | Berkas `.env` dan `APP_KEY` Snipe-IT; **tanpa `APP_KEY` yang sama, data terenkripsi tidak terbaca** (belum diuji) |

- Salin harian ke **tempat kedua** yang berbeda dari mesinnya (hard disk eksternal
  atau drive gratis yang sudah dipakai lab). Disk Railway atau disk mesin yang sama
  bukan cadangan.
- Simpan beberapa generasi (misalnya harian 14 hari dan mingguan beberapa bulan).
- Pastikan salinan lama ikut kebijakan masa simpan di bagian 13.
- **Uji pemulihan satu kali sebelum pilot**, dan ulangi tiap beberapa bulan.
  Cadangan yang belum pernah dipulihkan belum bisa dianggap ada.
- Catat langkah pemulihan langkah demi langkah dan siapa yang tahu.

## 18. Pilot dua minggu

**Siapa:** hanya divisi IT (3 orang). **Tujuan:** menemukan masalah sebelum banyak
orang terkena. Biayanya hampir nol, dan lab belum punya audit stok, server pasti,
atau pengalaman Snipe-IT.

**Lolos bila** beberapa peminjaman selesai dari ajukan sampai kembali **tanpa
pencatatan di luar sistem** (catatan kertas, grup chat, dan sebagainya).

Skenario yang harus dicoba:
- [ ] Ajukan sebagai guest, setujui, siap diambil, serah terima, kembalikan.
- [ ] Tolak permintaan; batalkan permintaan; ubah jumlah dan lama saat menyetujui.
- [ ] Keterlambatan (ubah tenggat) dan tampilan terlambat.
- [ ] Unit hilang, perawatan, dan pensiun; coba menandai unit yang sedang dipinjam
      (harus ditolak).
- [ ] Pindai QR label tercetak dengan beberapa ponsel.
- [ ] Lacak tiket dengan nomor dan email yang salah dan yang benar; coba menebak
      nomor lain (harus gagal).
- [ ] Dua Admin memproses tiket serentak (tidak boleh ada stok ganda atau nomor
      kembar).
- [ ] Matikan Mac Mini lalu hidupkan; semua kembali sendiri.
- [ ] Pulihkan dari backup ke mesin percobaan.
- [ ] Catat semua yang bingung atau salah; perbaiki sebelum dibuka untuk umum.

Dari PRD, hal yang diuji di pilot: kecepatan katalog dan halaman tiket (target
2 detik untuk sampai 5.000 aset, usulan), batas kustomisasi tampilan Snipe-IT,
endpoint API yang belum terverifikasi, dan keamanan login.

## 19. Daftar periksa sebelum dibuka untuk semua anggota

- [ ] Bar mode contoh dan `setRole` dihapus atau dimatikan di build produksi.
- [ ] Login Admin sungguhan dengan 2FA; tiga Admin punya akun sendiri.
- [ ] Semua pemeriksaan hak diulang di server (bukan hanya di browser).
- [ ] Batas percobaan dan batas laju aktif (pelacakan, pengajuan, login).
- [ ] Data contoh dihapus; data asli diimpor dan dicocokkan dengan hitungan fisik.
- [ ] Banner "Data contoh" dihapus.
- [ ] Domain tetap jadi, HTTPS aktif, QR label diuji dari luar jaringan kampus.
- [ ] Label dicetak setelah alamat tetap.
- [ ] Backup harian berjalan dan pemulihan sudah diuji.
- [ ] Mac Mini menyala sendiri setelah listrik padam.
- [ ] Anonimisasi data terjadwal; kebijakan privasi tertaut; pemberitahuan di form.
- [ ] Token Snipe-IT punya tanggal kedaluwarsa yang dicatat.
- [ ] Dokumen serah terima (termasuk file ini) tersimpan di tempat yang disepakati.
- [ ] Aturan lab dijawab: batas lama pinjam, batas barang, hak dosen dan mahasiswa,
      isi formulir perizinan.

## 20. Risiko

| Risiko | Dampak | Cara menurunkan |
| --- | --- | --- |
| Klien Keycloak tidak pernah dibuat | Member tidak punya jalur login sendiri | Member memakai jalur guest; tentukan ulang setelah jawaban atasan |
| Spam tiket (email tidak diverifikasi) | Antrean Admin penuh data palsu | Batas laju, batas tiket terbuka, honeypot; aktifkan verifikasi bila perlu |
| Mac Mini mati atau rusak | Layanan berhenti, data bisa hilang | Backup ke tempat kedua, uji pemulihan, orang kedua yang bisa menyalakan |
| Token Snipe-IT kedaluwarsa | Portal tidak bisa membaca atau menulis aset | Catat tanggal, ingatkan di kalender, pemantauan |
| Sambungan API Snipe-IT ternyata berbeda dari dugaan | Pekerjaan sambungan lebih lama | Coba endpoint di instance percobaan dulu (bagian 10) |
| Pengurus berganti | Pengetahuan hilang | Dokumen ini, repo, dan dua orang yang paham; pilihan teknis yang sederhana |
| Penggantian label setelah alamat berubah | Semua label tercetak harus diganti | Cetak hanya setelah domain tetap |
| Data diri bocor | Pelanggaran privasi | Pemeriksaan hak di server, masa simpan, anonimisasi, HTTPS |
| Biaya hosting muncul | Melanggar anggaran nol | Tetap di Mac Mini; Railway hanya bila ada akun lab yang sudah dibayar pihak lain |
| Kustomisasi tampilan Snipe-IT terbatas | Admin melihat tampilan standar | Diterima; pengguna umum memakai portal |

## 21. Pertanyaan yang masih terbuka

**Untuk pemegang proyek (atasan atau pengurus lab):**
- Siapa pemegang akses admin Keycloak, dan adakah NIM di akun MGM?
- Hak dosen dan mahasiswa: apakah berbeda (batas lama, jumlah barang)?
- Isi formulir perizinan peminjaman (kolom apa saja)?
- Batas lama pinjam dan jumlah barang per permintaan yang sebenarnya.
- Tempat dokumen serah terima disimpan (repo atau drive).
- Kebijakan privasi di labmgm.org: kapan terbit dan siapa yang menulis.
- Apakah email juga dianonimkan setelah 2 tahun (usulan: ya).

**Untuk devops dan backend:**
- Spesifikasi Mac Mini, kemampuan Docker, dan jaringannya (bagian 16).
- Nama subdomain dan DNS.
- Tempat salinan backup kedua.
- Persetujuan atas tumpukan teknis (Next.js, route handler, SQLite).
- Cara login Admin portal (usulan: akun lokal dengan TOTP).
- Cara check-out untuk guest di Snipe-IT (usulan: satu pengguna bersama).
- Hasil uji endpoint Snipe-IT yang belum terverifikasi.

**Keputusan yang ditunda dengan sengaja:** jumlah aset dan model asli (diisi manual
nanti), batas nilai pengadaan yang memerlukan Admin (Rilis 2), dan barcode 1D.

## 22. Catatan teknis Next.js 16

- Cache Components aktif. Halaman dengan parameter dibungkus `Suspense` (lihat
  `src/app/tiket/[nomor]/page.tsx`); jangan memakai `new Date()` saat render
  sebelum hidrasi, dan jangan membaca `usePathname` di luar `Suspense`.
- Baca panduan di `node_modules/next/dist/docs/` sebelum mengubah perilaku Next,
  karena versi ini berbeda dari yang umum dikenal (`AGENTS.md` di repo juga
  mengingatkannya).
- Penyimpanan data di klien memakai `useSyncExternalStore`; render di server selalu
  memakai keadaan awal kosong, jadi tiket tidak ikut dirender di server.
- Mengubah ke server nyata berarti memindahkan sumber data dari `useAppState()` ke
  pengambilan data (server component atau pustaka seperti SWR) dengan tetap
  menyatukan akses di satu lapisan.
- Hanya untuk pengujian otomatis di panel peramban tersembunyi: `requestAnimationFrame`
  tidak jalan di sana, sehingga halaman dinamis yang dimuat langsung tertahan di
  "Memuat…". Ini bukan galat aplikasi; di peramban biasa tidak terjadi.

## 23. Istilah

| Istilah | Arti |
| --- | --- |
| Guest | Peminjam tanpa akun; mengisi nama, NIM atau NIP, dan email UB |
| Member | Anggota lab dengan akun MGM (Keycloak) |
| Admin | Anggota divisi IT yang menyetujui peminjaman dan mengelola aset |
| Maintainer | Pemelihara sistem (dalam rencana ini juga divisi IT) |
| Model (barang) | Jenis barang, misalnya "Meta Quest 3"; punya banyak unit |
| Unit | Satu benda fisik dengan kode QR, misalnya `MGM-VRQ-004` |
| Kode aset (tag) | Pengenal unik unit; ada di QR |
| Tiket | Satu permintaan peminjaman dengan nomor dan riwayat |
| Check-out, check-in | Serah terima dan pengembalian di Snipe-IT |
| Keycloak | Sistem akun MGM di `iam.labmgm.org` |
| OIDC | Protokol login yang dipakai portal dengan Keycloak |
| Snipe-IT | Aplikasi sumber terbuka pencatat aset (AGPL-3.0) |
| Pilot | Masa uji coba terbatas sebelum dipakai penuh |
| Mode contoh | Bar di prototipe untuk berganti peran tanpa login; harus dihapus |
