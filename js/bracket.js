/**
 * BRACKET.JS - Full System (Ambil, Tampil, Simpan)
 */

// --- 1. FUNGSI AMBIL DATA DARI SHEETS (Penyisihan) ---
function loadBracketPenyisihan(lomba, kategori) {
    console.log("Menarik data peserta dari Sheet 1...");
    
    // Pastikan ID ini ada di HTML buat kasih tau user lagi loading
    const statusText = document.getElementById("statusUpdate");
    if(statusText) statusText.innerText = "⏳ Memuat daftar peserta...";

    // Panggil fungsi di Code.gs (Asumsi lu punya fungsi ambilPeserta di sana)
    google.script.run
        .withSuccessHandler(function(daftarNama) {
            if(statusText) statusText.innerText = "✅ Data dimuat.";
            // Panggil fungsi render untuk nampilin ke layar
            renderBracket(daftarNama, lomba, kategori);
        })
        .withFailureHandler(function(err) {
            console.error("Gagal ambil data:", err);
            if(statusText) statusText.innerText = "❌ Gagal memuat data.";
        })
        .ambilPesertaLomba(lomba, kategori); // Fungsi ini harus ada di Code.gs
}

// --- 2. FUNGSI TAMPILKAN KE WEB (RENDER) ---
function renderBracket(daftarNama, lomba, kategori) {
    const container = document.getElementById("bracketContainer");
    if (!container) return;

    container.innerHTML = ""; // Bersihkan tampilan lama

    if (daftarNama.length === 0) {
        container.innerHTML = "<p>Tidak ada peserta di kategori ini.</p>";
        return;
    }

    // Looping tiap nama untuk dibuatkan kotak tanding + tombol
    daftarNama.forEach((nama) => {
        const card = document.createElement("div");
        card.className = "peserta-card"; // Kasih CSS biar rapi
        card.innerHTML = `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 5px; display: flex; justify-content: space-between; align-items: center;">
                <strong>${nama}</strong>
                <button onclick="prosesPemenang('${nama}', '${lomba}', '${kategori}', 'Penyisihan')">
                    🏆 Loloskan
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 3. FUNGSI SIMPAN (KODE LU SEBELUMNYA - JANGAN DIUBAH) ---
function prosesPemenang(nama, lomba, kategori, babak) {
    console.log(`Mengirim data: ${nama} Lolos ${babak}...`);

    const statusText = document.getElementById("statusUpdate");
    if(statusText) statusText.innerText = "Menyimpan data...";

    google.script.run
        .withSuccessHandler(function(response) {
            console.log("Respon Server:", response);
            alert(response); 
            if(statusText) statusText.innerText = "Data tersimpan!";
        })
        .withFailureHandler(function(err) {
            console.error("Gagal konek ke Sheets:", err);
            alert("Waduh, koneksi putus brok. Coba lagi!");
        })
        .simpanKelolosan(nama, lomba, kategori, babak);
}
