# Portal Inventaris LabMGM (prototipe frontend)

Frontend portal peminjaman untuk sistem inventaris LabMGM, ditulis dari
[PRD](https://claude.ai/artifact/FcySRnZfwzYLig23XKUVgc). Tahap ini hanya
tampilan dan alur, dengan data contoh di browser. Belum ada backend, Snipe-IT,
Keycloak, atau pengiriman email.

Untuk mencoba semua alurnya langkah demi langkah, ikuti [handson.md](handson.md).
Untuk yang akan memasang dan menyambungkannya, baca [HANDOVER.md](HANDOVER.md):
daftar bagian yang masih palsu, keputusan yang sudah dibuat, dan yang masih
menunggu jawaban.

## Menjalankan

```bash
npm install
npm run dev -- -p 3004
```

Buka http://localhost:3004. Halaman pertama adalah login: katalog dan keranjang
baru terbuka setelah masuk (Member, Guest dengan data diri, atau Admin contoh).
Bar di bawah layar (mode contoh) berganti peran
antara Guest, Member, dan Admin tanpa login sungguhan; "Atur ulang data"
mengembalikan data awal.

## Yang sudah ada

- Login lebih dulu (`/masuk`): member lewat akun MGM (contoh), guest mengisi
  nama, NIM atau NIP, dan email UB, Admin lewat tautan mode contoh. Pelacakan
  tiket dan halaman QR aset tetap bisa dibuka tanpa masuk.
- Katalog barang dengan pencarian, kategori, dan ketersediaan, dengan pilihan
  tampilan Ikon, Daftar, atau Rincian seperti di pengelola berkas.
- Keranjang dan form pengajuan memakai data diri dari login; peminjam hanya
  mengisi tujuan dan tanggal.
- Verifikasi email guest dengan kode contoh `123456`; sementara dimatikan (bendera `EMAIL_VERIFICATION` di `src/lib/store.ts`), jadi tiket guest langsung berstatus Diajukan.
- Tiket dengan nomor, status, riwayat, batal, cetak, dan unduh sebagai gambar
  PNG (2400 × 1080 px, selalu terang, berisi QR ke halaman tiket).
- Lacak tiket dengan nomor dan email.
- Admin: antrean, keputusan (setujui dengan jumlah dan lama yang diubah, atau
  tolak dengan catatan), siap diambil, serah terima, pengembalian.
- Halaman publik hasil pindai QR (`/aset/MGM-VRQ-004`): nama, status, dan
  tombol pinjam untuk siapa saja; nomor seri, kondisi, tempat, dan tiket
  terkait hanya untuk Admin.
- Manajemen aset untuk Admin: tambah barang sendiri (ketik nama barang, pilih atau
  tambah kategori baru) atau tambah unit untuk barang yang ada (satu atau banyak,
  kode QR otomatis),
  ubah nomor seri, kondisi, dan tempat, serta kurangi stok lewat Kirim ke
  perawatan, Tandai hilang, Pensiunkan, atau Aktifkan kembali. Setiap
  perubahan tercatat di riwayat aset. Unit yang sedang dipinjam atau dipesan
  tidak bisa diubah statusnya.
- Lembar label QR untuk dicetak (`/admin/label`) dalam tiga ukuran. Isi kode
  QR sudah diuji terbaca dan mengarah ke `/aset/<kode>`.
- Tampilan ala Snipe-IT dengan identitas LabMGM: menu samping, bilah atas
  (cari kode aset, lonceng permintaan, keranjang, tema, masuk), dasbor angka
  berwarna dengan aktivitas terbaru dan agenda, serta tabel data untuk katalog,
  permintaan, dan aset. Warna, font Hanken Grotesk dan Geist, logo, dan pola
  mengikuti website utama labmgm.org. Terang dan gelap tersedia.

## Yang belum ada

Impor CSV dan hapus permanen (tetap di Snipe-IT),
barcode 1D di label, pengadaan, infrastruktur, dan
permintaan lain (Rilis 2). Peminjaman ruangan tidak akan dibuat: MGM tidak
menyediakannya.

## Menyambungkan ke sistem nyata

Semua baca dan tulis data ada di `src/lib/store.ts`. Ganti isinya dengan
panggilan ke layanan portal (tiket) dan REST API Snipe-IT (aset). Daftar barang
dan jumlahnya di `src/lib/mock-data.ts` adalah klaim lab, bukan hasil audit.

Aturan yang masih sementara dan perlu diputuskan: batas lama pinjam (sekarang
1 sampai 30 hari), batas 10 barang per permintaan (dari Pinjam yang lama), dan
nomor tiket (`MGM-yymm-nnnn-XXXX`, dengan empat karakter acak di belakang).

## Catatan teknis

Next.js 16 dengan Cache Components aktif, React 19, Tailwind 4. Halaman dengan
`params` memakai pembungkus `Suspense` (lihat `src/app/tiket/[nomor]/page.tsx`).
