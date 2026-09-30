# JadwalKu Health Bridge

Aplikasi iPhone ini menjadi penghubung Apple Health dan backend JadwalKu. Apple Watch menyinkronkan data ke Apple Health di iPhone, lalu aplikasi ini mengirim ringkasan tujuh hari terakhir ke API JadwalKu.

## Menjalankan di iPhone

1. Instal Xcode dari App Store pada Mac.
2. Di Xcode, buat proyek baru `App` dengan interface `SwiftUI` dan nama `JadwalKuHealthBridge`.
3. Salin seluruh file Swift dan file konfigurasi pada folder ini ke target proyek tersebut.
4. Buka `Signing & Capabilities`, pilih akun Apple Anda, lalu tambahkan capability `HealthKit`.
5. Jalankan pada iPhone fisik yang memakai Apple Health. Simulator tidak memiliki data Apple Watch.
6. Pastikan iPhone dan Mac memakai Wi-Fi yang sama. Isi alamat backend dengan IP Mac, misalnya `http://192.168.1.10:5001`. Jangan gunakan `localhost` karena di iPhone alamat itu menunjuk ke iPhone sendiri.
7. Masuk memakai akun JadwalKu, izinkan data Apple Health, lalu tekan `Sinkronkan 7 hari terakhir`.

Untuk deployment, gunakan HTTPS dan ganti penyimpanan token sementara dalam memori dengan Keychain sebelum mendistribusikan aplikasi.
