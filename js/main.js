window.onload = function() {
    // 1. Load data dari Google Sheets (Peserta & Lomba)
    if (typeof loadDataFromSheet === "function") {
        loadDataFromSheet(); 
    }

    if (typeof loadLombaFromSheet === "function") {
        loadLombaFromSheet();
    }

    // 2. Cek status login
    const loginStatus = localStorage.getItem("sudahLogin");
    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if (loginStatus === "true") {
        if (loginPage) loginPage.classList.add("hidden");
        if (mainMenu) mainMenu.classList.remove("hidden");
    }
}; // Semicolon di sini menutup fungsi window.onload

// --- Fungsi logout ---
function logout() {
    localStorage.setItem("sudahLogin", "false");
    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if (loginPage) loginPage.classList.remove("hidden");
    if (mainMenu) mainMenu.classList.add("hidden");
    
    // Opsional: Balikin ke halaman utama kalau mau
    location.reload(); 
}
