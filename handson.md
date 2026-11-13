# Hands-on: mencoba portal inventaris LabMGM

Panduan langkah demi langkah untuk mencoba prototipe, dari menyalakan sampai
semua alur Rilis 1. Waktu yang dibutuhkan sekitar 20 menit. Semua data adalah
contoh di browser Anda; tidak ada yang terkirim ke mana pun.

## 0. Persiapan

```bash
npm install
npm run dev -- -p 3004
```

Buka http://localhost:3004. Anda dialihkan ke halaman **Masuk**: katalog dan
keranjang baru terbuka setelah masuk. Di bawah layar ada bar **Mode contoh** dengan tiga
peran (Guest, Member, Admin) dan tombol **Atur ulang data**. Pakai bar ini untuk
berpindah peran (Guest di bar ini langsung masuk dengan identitas contoh, tanpa
mengisi form). Bila hasilnya tidak seperti di panduan, tekan Atur ulang data.

Data awal punya lima tiket contoh dan satu unit yang sedang diservis. Tanggalnya
dihitung dari hari Anda pertama membuka portal.

| Tiket | Peminjam | Status awal | Isi |
| --- | --- | --- | --- |
| MGM-2611-0001-P2VY | Mahasiswa Contoh B | Ditolak | 2 Mac Mini M4 |
| MGM-2611-0002-H5ZC | Anggota Contoh (member) | Terlambat | Mac Mini M4 dan Meta Quest 3 |
| MGM-2611-0003-R8WN | Dosen Contoh | Siap diambil | 2 Meta Quest 3 |
| MGM-2611-0004-M3TD | Anggota Contoh (member) | Diajukan | 3 ponsel dan 1 tablet Android |
| MGM-2611-0005-K7QX | Mahasiswa Contoh A | Diajukan | Eye tracker dan Webcam |

Awalan nomor mengikuti bulan berjalan, jadi bulan lain bisa `MGM-2612-` dan
seterusnya. Webcam sengaja berjumlah 0 untuk menguji barang habis.

## 1. Mengajukan peminjaman sebagai guest

Peran: **Guest**. Mulai dari keadaan belum masuk: tekan **Keluar** bila perlu,
atau Atur ulang data lalu muat ulang.

1. Di halaman **Masuk**, tekan **Lanjut sebagai guest** dengan form kosong.
   Setiap kolom wajib menampilkan pesan yang menjelaskan cara memperbaikinya,
   dan fokus pindah ke kolom pertama. Isi nama, NIM `000000000099`, dan email
   `uji@gmail.com`; pesan harus meminta email UB. Ganti dengan
   `uji@student.ub.ac.id` dan lanjut.
2. Di **Katalog**, tekan **Tambah** pada Meta Quest 3. Tombolnya berubah menjadi
   pengatur jumlah, dan bilah "1 barang di keranjang" muncul.
3. Coba cari "quest", pilih kategori **UX dan HCI**, centang **Hanya yang
   tersedia**. Webcam tidak muncul karena habis.
4. Tekan **Lanjut mengajukan**. Nama dan email Anda sudah terisi dari login;
   hanya tujuan dan tanggal ambil yang perlu diisi. Kirim kosong dulu untuk
   melihat pesan galatnya.
5. Isi tujuan dan tanggal ambil, lalu ajukan.
6. Tiket baru langsung berstatus **Diajukan** (verifikasi email ditunda sampai
   email pengirim siap). Nomornya berakhiran empat huruf atau angka acak,
   misalnya `MGM-2611-0006-X4NB`, supaya tidak bisa ditebak. Untuk mencoba
   langkah verifikasinya, ubah `EMAIL_VERIFICATION` menjadi `true` di
   `src/lib/store.ts`: tiket guest lalu berstatus **Menunggu verifikasi email**;
   kode `000000` ditolak dan `123456` mengubahnya menjadi **Diajukan**.
7. Tombol **Batalkan permintaan** meminta konfirmasi dulu.

Yang perlu dinilai: apakah pesan galat jelas, dan apakah guest tahu langkah
berikutnya tanpa membaca panduan.

## 2. Melacak tiket

Peran: **Guest**. Buka **Lacak tiket** di menu samping.

1. Masukkan nomor `MGM-2611-0003-R8WN` dengan email `salah@ub.ac.id`. Pesan harus
   menyebut nomor dan email tidak cocok, tanpa membuka tiket.
2. Ganti email menjadi `dosen.contoh@ub.ac.id`. Tiket terbuka, berstatus
   Siap diambil.
3. Buka langsung `/tiket/MGM-2611-0004-M3TD` di bilah alamat. Karena Anda belum
   memasukkan emailnya, portal meminta email dulu.

## 3. Keputusan Admin

Peran: **Admin**. Buka **Permintaan** di menu samping (angka di sebelahnya adalah jumlah yang menunggu keputusan).

1. Tab **Perlu diputuskan** berisi tiket 0004, 0005, dan tiket baru Anda.
2. Buka tiket `0005`. Eye tracker tersedia, Webcam tersedia 0, jadi jumlah
   webcam yang bisa disetujui terkunci di 0.
3. Ubah lama pinjam, lalu tekan **Setujui**. Kartu tiket menampilkan
   "0 unit (diminta 1)" untuk webcam.
4. Ikuti rantainya: **Tandai siap diambil**, **Catat serah terima**, **Terima
   pengembalian**. Setiap langkah masuk ke riwayat.
5. Buka tiket baru Anda dari langkah 1 dan tekan **Tolak** tanpa catatan. Harus
   gagal dengan pesan bahwa alasan wajib diisi. Isi catatan, lalu tolak.
6. Kembali ke **Guest** dan buka tiket yang baru Anda tolak. Tiket yang dibuat di
   browser ini langsung terbuka; catatan Admin tampil di bawah status.

Perhatikan juga tiket `0002`: statusnya otomatis **Terlambat** karena tenggatnya
sudah lewat, dan jumlahnya muncul di kalimat atas halaman Admin.

## 4. Stok ikut berubah

1. Sebagai Admin, buka tiket 0004 sebelum diputuskan dan setujui. Catat jumlah
   ponsel Android yang tersedia sebelum dan sesudah.
2. Buka **Katalog**. Jumlah "tersedia" berkurang sesuai yang disetujui, dan
   kembali naik setelah tiketnya dikembalikan.

## 5. Masuk sebagai member

1. Tekan **Keluar** di kanan atas. Anda kembali ke halaman **Masuk** dan
   keranjang dikosongkan.
2. Pilih **Masuk dengan akun MGM**. Ini hanya masuk sebagai anggota contoh;
   akun sungguhan menyusul setelah Keycloak siap.
3. Tambahkan barang dan buka keranjang. Form hanya meminta tujuan dan tanggal,
   dan tiket langsung berstatus Diajukan tanpa verifikasi email.

## 6. Halaman aset hasil pindai QR

1. Sebagai **Guest**, buka `/aset/MGM-VRQ-004`. Statusnya Tersedia dan ada tombol
   **Pinjam Meta Quest 3** yang langsung membawa barang ke keranjang.
2. Buka `/aset/MGM-VRQ-001` (sedang dipinjam) dan `/aset/MGM-VRQ-006` (dalam
   perawatan). Keduanya tidak menawarkan tombol pinjam. Status ini berlaku pada
   data awal; setelah Anda mengubah tiket, unit yang dipinjam bisa berbeda.
3. Buka `/aset/SALAH-001`. Muncul pesan label tidak dikenali.
4. Ganti ke **Admin** dan buka ulang `/aset/MGM-VRQ-001`. Muncul bagian
   **Khusus Admin**: nomor seri, kondisi, tempat di lab, dan tiket yang memegang
   model itu. Guest tidak pernah melihat bagian ini.

## 7. Label QR

Peran: **Admin**. Buka **Label QR** di menu samping, atau pilih beberapa baris di **Aset** lalu tekan **Cetak label**.

1. Ganti ukuran label dan saringan barang; jumlah label di tombol cetak ikut
   berubah.
2. Tekan **Cetak** dan lihat pratinjau cetak browser. Hanya label yang tercetak,
   tanpa menu. Pilih skala 100% dan matikan header dan footer agar ukurannya
   sesuai milimeter.
3. Uji pindai di ponsel. QR memuat alamat halaman yang sedang dibuka, jadi buka
   portal dari ponsel lewat alamat jaringan yang ditampilkan `npm run dev`
   (bukan `localhost`), lalu buat label dari alamat itu. Ponsel dan komputer
   harus satu jaringan, dan firewall harus mengizinkan port 3004.

## 8. Tiket PNG dan cetak

1. Buka tiket mana pun dan tekan **Unduh PNG**. Gambarnya bernama
   `tiket-<nomor>.png`, berukuran 2400 × 1080 px, dan selalu bertema terang
   walau halaman sedang gelap.
2. Pindai QR di gambar itu. Hasilnya membuka halaman tiket, yang tetap meminta
   email bagi non-Admin.
3. Tekan **Cetak tiket** dan periksa pratinjau cetak.

## 9. Tampilan seperti Snipe-IT

Tata letaknya mengikuti Snipe-IT (menu samping, dasbor angka, tabel data) dengan
warna dan font LabMGM.

1. Sebagai **Admin**, buka **Dasbor**. Ada enam angka berwarna (perlu diputuskan,
   siap diambil, sedang dipinjam, terlambat, aset, dalam perawatan), tabel
   **Aktivitas terbaru**, daftar **Hari ini dan berikutnya**, dan status aset
   per kategori. Tiap angka membawa ke daftar yang sesuai.
2. Ketik `MGM-VRQ-004` di kotak **Cari kode aset** di bilah atas, lalu Enter.
   Halaman aset terbuka. Lonceng di sebelahnya menampilkan jumlah permintaan
   yang menunggu.
3. Buka **Aset**: cari, saring kategori dan status, centang beberapa baris,
   lalu **Cetak label** untuk hanya label yang dipilih.
4. Buka **Permintaan**: tabel dengan tab status, pencarian, dan tombol
   **Putuskan** atau **Buka** di tiap baris.
5. Sebagai **Guest** atau **Member**, menu samping hanya berisi Katalog,
   Keranjang, dan Lacak tiket. Katalog berupa tabel seperti "Requestable Items"
   di Snipe-IT.

## 10. Tampilan katalog

Peran: Member atau Guest. Di atas daftar barang ada pilihan **Ikon**, **Daftar**,
dan **Rincian**, seperti pilihan tampilan di pengelola berkas.

1. **Ikon**: kartu besar dengan jumlah tersedia dan tombol Tambah, cocok untuk
   memilih sambil menelusuri.
2. **Daftar**: satu baris ringkas per barang, muat paling banyak barang di layar.
3. **Rincian**: tabel lengkap dengan kategori dan deskripsi.
4. Pilihan ikut tersimpan saat Anda pindah halaman dan muat ulang. Pencarian,
   saringan, dan keranjang berfungsi sama di ketiganya.

## 11. Manajemen aset

Peran: **Admin**. Buka **Aset** di menu samping.

1. Tekan **Tambah aset**. Kirim kosong dulu untuk melihat pesan galat. Biarkan
   pilihan **Barang baru**, ketik nama barang (misalnya Proyektor), pilih
   **Kategori baru…** dan ketik nama kategorinya, jumlah 2, isi tempat, lalu
   tambah. Dua kode baru muncul (MGM-PRO-001 dan 002) dan tombol **Cetak label**
   membuka lembar label untuk keduanya. Barang dan kategorinya langsung ada di
   katalog dan filter kategori. Mengetik nama barang yang sudah ada ditolak;
   pilih barangnya dari daftar untuk menambah unit. Memilih barang yang ada
   (misalnya Meta Quest 3) melanjutkan nomor terakhir. Nomor seri hanya bisa diisi saat menambah satu unit; untuk
   beberapa unit, isi lewat Ubah.
2. Buka salah satu kode baru, lalu **Ubah aset**. Ubah kondisi dan simpan.
   Nomor seri yang sama dengan unit lain ditolak.
3. Di halaman Ubah, kolom **Keadaan unit** punya aksi **Kirim ke perawatan**,
   **Tandai hilang**, **Pensiunkan**, dan **Aktifkan kembali**. Tandai hilang dan
   Pensiunkan wajib beralasan. Status di daftar aset dan jumlah tersedia di
   katalog ikut berubah.
4. Buka ulang halaman unit tersebut. **Riwayat aset** memuat semua langkah tadi
   dengan waktu dan pelakunya.
5. Coba ubah keadaan unit yang sedang dipinjam (misalnya `MGM-VRQ-001` pada data
   awal). Aksi diganti pesan bahwa unit sedang dipinjam atau dipesan, dengan
   tautan ke tiketnya.

Hapus permanen dan impor CSV sengaja tidak ada di sini; itu tetap
dikerjakan di Snipe-IT.

## 12. Terang, gelap, dan layar kecil

1. Tekan ikon bulan atau matahari di kanan atas. Periksa katalog, tiket, dan
   halaman Admin di kedua tema. Teks, lencana status, dan batas kartu harus
   tetap terbaca.
2. Kecilkan jendela browser ke lebar ponsel (sekitar 375 px). Menu dan bar mode
   contoh harus tetap muat, dan tidak ada halaman yang bergeser ke samping.
3. Coba seluruh form hanya dengan keyboard (Tab, Enter, Spasi). Fokus harus
   selalu terlihat.

## 13. Catatan untuk penilaian

Hal yang sebaiknya Anda catat selama mencoba:

- Kata yang membingungkan (misalnya "guest", "member", "perizinan").
- Langkah yang terasa terlalu panjang bagi peminjam.
- Informasi yang menurut Admin kurang di antrean atau detail tiket.
- Aturan yang perlu diputuskan: batas lama pinjam (sekarang 1 sampai 30 hari),
  batas barang per permintaan (sekarang 10), format nomor tiket, dan isi
  formulir perizinan.

## Yang tidak bisa dicoba di prototipe

Login Keycloak, email sungguhan, data Snipe-IT, dan keamanan sungguhan. Peran
Admin bisa dipilih siapa saja lewat bar mode contoh, dan itu sengaja hanya untuk
tahap ini. Daftar lengkap bagian yang harus diganti ada di `HANDOVER.md`.
