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

function switchDatabaseTab(evt, tabId) {
            // Sembunyikan semua blok tab content
            const contents = document.getElementsByClassName("db-tab-content");
            for (let i = 0; i < contents.length; i++) {
                contents[i].classList.remove("active-content");
            }

            // Matikan warna aktif di tombol lama
            const buttons = document.getElementsByClassName("db-tab-btn");
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].classList.remove("active");
            }

            // Aktifkan tab dan tombol yang baru di-klik
            document.getElementById(tabId).classList.add("active-content");
            evt.currentTarget.classList.add("active");
        }
    // 5. Opsi: Tambahin log buat debugging
    console.log("Landscape Overlay Active 🔄");
})();
