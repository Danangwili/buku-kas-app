# Buku Kas Pribadi

Aplikasi pencatatan keuangan pribadi (PWA): saldo Tunai & Non-Tunai (masing-masing 2 dompet, nama bisa diubah), pencatatan pengeluaran/pemasukan per kategori, perpindahan saldo antar dompet, dan grafik pengeluaran bulanan. Semua dalam Bahasa Indonesia dan Rupiah.

## Menjalankan di komputer (mode pengembangan)

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`).

## Build untuk produksi

```bash
npm run build
```

Hasilnya ada di folder `dist/` — inilah yang di-deploy ke Netlify.

Untuk mengecek hasil build secara lokal sebelum deploy:

```bash
npm run preview
```

## Deploy ke Netlify

**Cara cepat (tanpa Git):**
1. Jalankan `npm run build`.
2. Buka [app.netlify.com](https://app.netlify.com), masuk ke halaman "Deploys".
3. Seret folder `dist/` ke halaman tersebut.

**Cara dengan Git (disarankan untuk update berkelanjutan):**
1. Push proyek ini ke repository GitHub.
2. Di Netlify, pilih "Add new site" → "Import an existing project" → hubungkan ke repo tersebut.
3. Isi build command: `npm run build`, publish directory: `dist`.
4. Setiap kali kamu push perubahan, Netlify otomatis build & deploy ulang.

## Memasang di Android

1. Buka URL Netlify hasil deploy (mis. `namamu.netlify.app`) di Chrome Android.
2. Ketuk menu titik tiga → **"Tambahkan ke layar utama"** (atau tunggu banner otomatis muncul).
3. Ikon aplikasi akan muncul di home screen dan terbuka fullscreen seperti aplikasi native.

## Mengganti ikon aplikasi

Ikon sementara (`public/icon-192.png` dan `public/icon-512.png`) hanya placeholder bertuliskan "BK". Ganti dengan logo aslimu:
- Ukuran 192×192 dan 512×512 piksel, format PNG.
- Nama file dan lokasinya harus sama persis agar `vite.config.js` tetap mengenalinya.

## Catatan tentang data

Data transaksi dan nama dompet disimpan di `localStorage` browser/perangkat. Ini berarti:
- Data hanya tersimpan di perangkat itu (tidak sinkron antar HP/laptop).
- Jika pengguna menghapus data browser/aplikasi, data ikut hilang.
- Untuk kebutuhan lebih serius, pertimbangkan menambahkan fitur ekspor data (mis. ke file JSON atau CSV) sebagai cadangan.
