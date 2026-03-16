window.onload = function() {
    // --- Load data peserta kalau fungsi tersedia (hanya di database.html) ---
    if (typeof loadDataFromSheet === "function") {
        loadDataFromSheet();
    }

    // --- Cek status login ---
    const loginStatus = localStorage.getItem("sudahLogin");
    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if (loginStatus === "true") {
        if (loginPage) loginPage.classList.add("hidden");
        if (mainMenu) mainMenu.classList.remove("hidden");
    }
};

// --- Fungsi logout ---
function logout() {
    localStorage.setItem("sudahLogin", "false");
    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if (loginPage) loginPage.classList.remove("hidden");
    if (mainMenu) mainMenu.classList.add("hidden");
}
