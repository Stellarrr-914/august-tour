// ======= LOMBA.JS =======
// URL API Google Apps Script lu
const urlAPILomba = "https://script.google.com/macros/s/AKfycbwDTST0zknCALaYFju9wMSvD2zHIi9xBJr-0Kuq23ALGXChSgbUl0WFo8a8MoVsYQmD/exec";

// 1. Fungsi Tambah Lomba (Support pemisah titik koma agar CSV aman)
async function tambahLomba() {
    const inputField = document.getElementById("inputLomba");
    if (!inputField) return;

    const value = inputField.value.trim();
    const parts = value.split(","); // Nama lomba tetep dipisah koma pertama

    if (parts.length < 2) {
        alert("Format salah! Minimal: Nama Lomba, Kategori. \nContoh: Balap Kelereng, 1; 2; M");
        return;
    }

    const nama = parts[0].trim();
    // Ambil kategori, bersihkan spasi, dan gabung pakai titik koma (;)
    const daftarKategori = parts.slice(1).map(k => k.trim().toUpperCase()).join("; ");

    if (databaseLomba[nama]) {
        alert("Lomba '" + nama + "' sudah ada!");
        return;
    }

    try {
        inputField.disabled = true;

        // Kirim ke Google Apps Script
        await fetch(urlAPILomba, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                type: "tambahLomba",
                namaLomba: nama,
                kategoriLomba: daftarKategori,
                status: "Open"
            })
        });

        // Simpan ke database lokal (Object)
        databaseLomba[nama] = {
            kategori: daftarKategori,
            status: "Open",
            peserta: []
        };
        
        // Update LocalStorage biar pas refresh data terbaru aman
        localStorage.setItem("databaseLomba", JSON.stringify(databaseLomba));

        // Reset Input
        inputField.value = "";
        inputField.disabled = false;
        
        // Panggil fungsi tampil (pastiin fungsi ini ada di bracket atau main)
        if (typeof tampilLomba === "function") tampilLomba();
        if (typeof updateLombaDropdown === "function") updateLombaDropdown();
        
        alert("Lomba '" + nama + "' berhasil ditambah!");

    } catch (error) {
        console.error(error);
        inputField.disabled = false;
        alert("Gagal konek ke Google Sheets.");
    }
}

// 2. Fungsi Tampil Tabel Lomba (Biar gak kosong kalau dipanggil)
function tampilLomba() {
    const tabel = document.getElementById("tabelLomba");
    if (!tabel) return;

    tabel.innerHTML = "";
    
    for (const namaLomba in databaseLomba) {
        const lomba = databaseLomba[namaLomba];
        tabel.innerHTML += `
        <tr>
            <td><strong>${namaLomba}</strong></td>
            <td>${lomba.kategori}</td>
            <td>
                <select onchange="updateStatusLomba('${namaLomba}', '${lomba.kategori}', this.value)">
                    <option value="Open" ${lomba.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="Penyisihan" ${lomba.status === 'Penyisihan' ? 'selected' : ''}>Penyisihan</option>
                    <option value="Semifinal" ${lomba.status === 'Semifinal' ? 'selected' : ''}>Semifinal</option>
                    <option value="Final" ${lomba.status === 'Final' ? 'selected' : ''}>Final</option>
                    <option value="Selesai" ${lomba.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                </select>
            </td>
        </tr>
        `;
    }
}
async function updateStatusLomba(namaLomba, kategori, statusBaru) {
    const urlAPI = "URL_WEB_APP_GOOGLE_SHEETS_LU"; // Samain sama yang di tambahLomba

    try {
        await fetch(urlAPI, {
            method: "POST",
            mode: "no-cors", // Pakai no-cors biar gak kena masalah policy browser
            body: JSON.stringify({
                type: "updateStatus",
                namaLomba: namaLomba,
                kategoriLomba: kategori,
                statusBaru: statusBaru
            })
        });

        // Update juga di database lokal biar gak perlu refresh
        if (databaseLomba[namaLomba]) {
            databaseLomba[namaLomba].status = statusBaru;
            localStorage.setItem("databaseLomba", JSON.stringify(databaseLomba));
        }

        alert("Status " + namaLomba + " (" + kategori + ") sekarang: " + statusBaru);
        tampilLomba(); // Refresh tabel lomba
    } catch (error) {
        console.error("Gagal update status:", error);
    }
}
