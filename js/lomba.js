// ======= LOMBA.JS REVISED =======
const urlAPILomba = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec";

// 1. Fungsi Tambah Lomba
async function tambahLomba() {
    const inputField = document.getElementById("inputLomba");
    if (!inputField || !inputField.value.trim()) return;

    const value = inputField.value.trim();
    const parts = value.split(","); 

    if (parts.length < 2) {
        alert("Format salah! \nContoh: Balap Kelereng, 1, 2, M");
        return;
    }

    const nama = parts[0].trim();
    // Ambil semua kategori setelah koma pertama, bersihkan spasi
    const daftarKategori = parts.slice(1).map(k => k.trim().toUpperCase()).join("; ");

    if (databaseLomba[nama]) {
        alert("Lomba '" + nama + "' sudah ada di database!");
        return;
    }

    try {
        inputField.disabled = true;
        
        // POST ke Google Apps Script
        // Update bagian fetch di fungsi tambahLomba() JS lo:
        await fetch(urlAPILomba, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8" // Pake trik text/plain
            },
            body: JSON.stringify({
                type: "tambahLomba",
                namaLomba: nama,
                kategoriLomba: daftarKategori,
                status: "Open"
            })
        });

        // Update Lokal
        databaseLomba[nama] = {
            kategori: daftarKategori,
            status: "Open"
        };
        
        localStorage.setItem("databaseLomba", JSON.stringify(databaseLomba));

        // Reset UI
        inputField.value = "";
        inputField.disabled = false;
        
        if (typeof tampilLomba === "function") tampilLomba();
        if (typeof updateLombaDropdown === "function") updateLombaDropdown();
        
        alert("✅ Lomba '" + nama + "' berhasil didaftarkan!");

    } catch (error) {
        console.error(error);
        inputField.disabled = false;
        alert("❌ Gagal simpan ke Cloud.");
    }
}

// 2. Tampilan Tabel Lomba dengan Warna Status Dinamis
// ======= LOMBA.JS (BAGIAN TAMPIL TABEL) =======
function tampilLomba() {
    const tabel = document.getElementById("tabelLomba");
    if (!tabel) return;

    tabel.innerHTML = "";
    
    for (const key in databaseLomba) {
        const lomba = databaseLomba[key];
        
        // 1. Ambil status dan paksa jadi huruf kecil biar cocok sama Class CSS
        const statusMentah = (lomba.status || "Open").toLowerCase();
        
        // 2. Tentukan class warna berdasarkan status (SESUAI CSS LO)
        let statusClass = "status-open"; // Default Hijau
        if (statusMentah === "on-going") statusClass = "status-ongoing"; // Oranye
        if (statusMentah === "selesai") statusClass = "status-selesai"; // Merah

        // 3. Ambil Nama Asli (biar yang muncul "Kerupuk", bukan "Kerupuk-1")
        const namaTampil = lomba.namaAsli || lomba.nama || key;

        tabel.innerHTML += `
        <tr>
            <td style="font-weight:bold; color:var(--secondary);">${namaTampil}</td>
            <td><span class="badge-kat">${lomba.kategori}</span></td>
            <td>
                <select class="status-select ${statusClass}" 
                    onchange="updateStatusLomba('${key}', '${lomba.kategori}', this.value)">
                    <option value="Open" ${lomba.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="On-Going" ${lomba.status === 'On-Going' ? 'selected' : ''}>On-Going</option>
                    <option value="Selesai" ${lomba.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                </select>
            </td>
        </tr>
        `;
    }
}
async function updateStatusLomba(keyUnik, kategori, statusBaru) {
    try {
        // 1. Ambil Nama Lomba Asli (Tanpa tambahan kategori)
        // Kalau keyUnik = "Mewarnai-Kat 1", namaAslinya = "Mewarnai"
        const dataLomba = databaseLomba[keyUnik];
        const namaLombaAsli = dataLomba.namaAsli || keyUnik.split('-')[0];

        console.log(`Updating ${namaLombaAsli} (${kategori}) to ${statusBaru}...`);

        // 2. Gunakan URLSearchParams (Format yang disukai Google Apps Script)
        const params = new URLSearchParams();
        params.append("type", "updateStatus");
        params.append("namaLomba", namaLombaAsli);
        params.append("kategoriLomba", kategori);
        params.append("statusBaru", statusBaru);

        // 3. Kirim ke Cloud (HAPUS mode: "no-cors")
        await fetch(urlAPILomba, {
            method: "POST",
            body: params // GAS bakal nerima ini di 'e.parameter'
        });

        // 4. Update Lokal (Pake keyUnik biar gak salah sasaran)
        if (databaseLomba[keyUnik]) {
            databaseLomba[keyUnik].status = statusBaru;
            localStorage.setItem("databaseLomba", JSON.stringify(databaseLomba));
        }

        // 5. Refresh tampilan biar warna dropdown langsung berubah
        tampilLomba(); 
        console.log("Sinkronisasi Cloud Berhasil (Status Sent)");
        
    } catch (error) {
        console.error("Gagal update status:", error);
        alert("Gagal sinkron status ke Cloud.");
    }
}
