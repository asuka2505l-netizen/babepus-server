# BabePus Server

Backend API untuk aplikasi **BabePus** (Barang Bekas Kampus), yaitu platform marketplace khusus mahasiswa untuk jual beli barang bekas kampus secara aman, mudah, dan modern.

---

## Teknologi yang Digunakan

* Node.js
* Express.js
* MariaDB / MySQL (XAMPP)
* JWT Authentication
* bcryptjs
* Multer (Upload Gambar)
* dotenv
* CORS

---

## Fitur Utama

### Autentikasi Pengguna

* Register akun
* Login akun
* Logout
* JWT Token Authentication

### Produk / Marketplace

* Upload barang
* Edit barang
* Hapus barang
* Lihat semua barang
* Detail barang

### Transaksi

* Ajukan tawaran harga
* Terima / Tolak tawaran
* Konfirmasi transaksi
* Riwayat transaksi

### Review & Rating

* Beri ulasan
* Rating pengguna

### Admin

* Kelola user
* Tangani laporan
* Suspend akun
* Dashboard statistik

---

## Struktur Folder

```text
babepus-server/
│── config/
│── controllers/
│── middleware/
│── routes/
│── uploads/
│── .env
│── package.json
│── server.js
```

---

## Cara Menjalankan Project

### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/babepus-server.git
cd babepus-server
```

### 2. Install Dependency

```bash
npm install
```

### 3. Buat File `.env`

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=babepus
JWT_SECRET=your_secret_key
```

### 4. Jalankan Server

```bash
npm run dev
```

Jika berhasil:

```text
Server running on port 5000
Database connected
```

---

## API Endpoint (Contoh)

### Auth

| Method | Endpoint           | Keterangan    |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login user    |

### Product

| Method | Endpoint          | Keterangan         |
| ------ | ----------------- | ------------------ |
| GET    | /api/products     | Ambil semua barang |
| GET    | /api/products/:id | Detail barang      |
| POST   | /api/products     | Tambah barang      |
| PUT    | /api/products/:id | Edit barang        |
| DELETE | /api/products/:id | Hapus barang       |

---

## Database

Gunakan database **MariaDB / MySQL** dengan nama:

```text
babepus
```

Import file SQL yang telah dibuat sebelumnya ke phpMyAdmin.

---

## Frontend

Frontend React tersedia pada repository terpisah:

```text
babepus-client
```

---

## Status Project

Dalam tahap pengembangan.

---

## Developer

Dibuat untuk kebutuhan project dan portfolio fullstack web development.

---

## License

Free to use for learning and development.
