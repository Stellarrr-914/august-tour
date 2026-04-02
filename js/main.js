/**
 * MAIN.JS - Jantung Kontrol Aplikasi Lomba RT
 */

// 1. PENJAGA GAWANG (Cek Login Sebelum Halaman Tampil)
(function() {
    const loginStatus = localStorage.getItem("sudahLogin");
    // Jika tidak login, pastikan user tidak bisa liat menu utama
    if (loginStatus !== "true") {
        console.log("Status: Belum Login. Menuju halaman login...");
    }
})();

window.onload = function() {
    console.log("Aplikasi Siap...");

    // 2. CEK STATUS LOGIN & ATUR UI
    const loginStatus = localStorage.getItem("sudahLogin");
    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if (loginStatus === "true") {
        // User Sudah Login
        if (loginPage) loginPage.classList.add("hidden");
        if (mainMenu) mainMenu.classList.remove("hidden");

        // 3. LOAD DATA (Hanya jika sudah login biar hemat kuota API)
        if (typeof loadDataFromSheet === "function") {
            console.log("Memuat data peserta...");
            loadDataFromSheet(); 
        }
        if (typeof loadLombaFromSheet === "function") {
            console.log("Memuat data lomba...");
            loadLombaFromSheet();
        }
    } else {
        // User Belum Login
        if (loginPage) loginPage.classList.remove("hidden");
        if (mainMenu) mainMenu.classList.add("hidden");
    }
};

// 4. FUNGSI LOGOUT (Global Scope)
window.logout = function() {
    console.log("Proses Logout...");

    // Hapus status login
    localStorage.setItem("sudahLogin", "false");
    
    // Clear data sementara jika perlu
    // localStorage.clear(); 

    // Redirect ke index.html (Paling AMAN)
    // Ini otomatis mereset semua state kodingan
    window.location.href = "index.html"; 
};

// 5. EVENT LISTENER (Backup jika onclick di HTML macet)
document.addEventListener('click', function(e) {
    // Sesuaikan ID dengan yang ada di button HTML lu (id="logoutBtn")
    if(e.target && (e.target.id === 'logoutBtn' || e.target.id === 'tombolLogout')) { 
        window.logout();
    }
});

/**
 * AUTO-INJECT LANDSCAPE OVERLAY
 * Berfungsi di semua halaman yang memanggil main.js
 */
(function() {
    // 1. Cek apakah overlay sudah ada (biar gak double kalau di-refresh)
    if (document.getElementById("orientation-overlay")) return;

    // 2. Buat element overlay-nya
    const overlay = document.createElement("div");
    overlay.id = "orientation-overlay";
    
    // 3. Isi kontennya (CSS-nya ngambil dari global.css yang udah lo buat)
    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="phone-icon">🔄</div>
            <h2 style="margin-bottom:10px; color: #f1c40f; font-family: sans-serif;">MODE LANDSCAPE DIBUTUHKAN</h2>
            <p style="color: #ccc; font-size: 14px; font-family: sans-serif; line-height: 1.5;">
                Miringkan HP Anda untuk melihat tampilan <br> 
                bracket dan data lebih jelas.
            </p>
        </div>
    `;

    // 4. Suntik ke dalam body
    document.body.appendChild(overlay);

    // 5. Opsi: Tambahin log buat debugging
    console.log("Landscape Overlay Active 🔄");
})();
