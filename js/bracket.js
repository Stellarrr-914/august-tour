// URL Web App dari Deploy > Test Deployment / Manage Deployment (yang akhiran /exec)
const scriptURL = "https://script.google.com/macros/s/AKfycbwozetGewXUnyT8RqZkwrYenD_Yt7gZFyb5JkCPAVRECg9Q-KwFMqOo0pPX0wUYvExK/exec"; 

// 1. UPDATE DROPDOWN LOMBA (Ambil data Real-time dari Sheets)
function updateLombaDropdown() {
    console.log("Memulai tarik data lomba...");
    const select = document.getElementById("lombaSelect");
    if (!select) return;

    // Pakai fetch GET ke Apps Script
    fetch(`${scriptURL}?type=getLomba`)
        .then(res => res.json())
        .then(daftarLomba => {
            select.innerHTML = `<option value="">-- Pilih Lomba --</option>`;
            daftarLomba.forEach(namaLomba => {
                const opt = document.createElement("option");
                opt.value = namaLomba;
                opt.textContent = namaLomba;
                select.appendChild(opt);
            });
            console.log("Dropdown Lomba terupdate dari Sheets!");
        })
        .catch(err => console.error("Gagal update dropdown:", err));
}

// 2. SIMPAN HASIL KE SHEET 3 (Pakai POST)
function simpanKeSheet(nama, selectElement) {
    const hasil = selectElement.value;
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    
    if (!hasil) return;

    // Bungkus data dalam JSON
    const payload = {
        type: "simpanJuara",
        namaLomba: lomba,
        kategoriLomba: kategori,
        namaPeserta: nama,
        babakBaru: hasil
    };

    // Tembak pake POST
    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
        if(response.result === "success") {
            alert("✅ " + response.message);
            selectElement.style.background = "#d4edda"; // Ijo kalau sukses
        } else {
            alert("❌ Gagal: " + response.message);
        }
    })
    .catch(error => {
        console.error('Error!', error);
        alert("Waduh, koneksi ke Sheets putus brok!");
    });
}

// Pastikan dropdown jalan pas halaman dibuka
document.addEventListener("DOMContentLoaded", updateLombaDropdown);
