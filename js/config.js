// =====================================================================
//  KONFIGURASI RUMAH CV
// =====================================================================
//  1) Biarkan FIREBASE_CONFIG = null  -> website jalan di "Mode Demo":
//     data disimpan di browser (localStorage) saja. Cocok untuk coba-coba.
//
//  2) Untuk online sungguhan (data tersimpan di cloud & bisa diedit admin
//     dari mana saja), isi FIREBASE_CONFIG dengan config project Firebase
//     kamu (Project settings > General > Your apps > Web app > Config).
//     Lihat README.md untuk langkah lengkap.
// =====================================================================

export const FIREBASE_CONFIG = null;
/* Contoh:
export const FIREBASE_CONFIG = {
  apiKey: "AIza....",
  authDomain: "risky-xxxx.firebaseapp.com",
  databaseURL: "https://risky-xxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "risky-xxxx",
  storageBucket: "risky-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/

// Path di Realtime Database tempat data CV disimpan
export const DB_PATH = "rumahcv/data";

// Password admin untuk MODE DEMO saja (tidak dipakai kalau Firebase aktif).
// Saat Firebase aktif, login admin memakai akun Email/Password Firebase Auth.
export const DEMO_ADMIN_PASSWORD = "admin123";
