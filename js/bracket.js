// --- Fungsi Tampil Lomba di Tabel ---
function tampilLomba() {
    const tabel = document.getElementById("tabelLomba");
    if (!tabel) return;

    tabel.innerHTML = "";
    let i = 1;

    for (const namaLomba in databaseLomba) {
        const lomba = databaseLomba[namaLomba];
        tabel.innerHTML += `
        <tr>
            <td>${i++}</td>
            <td><strong>${namaLomba}</strong></td>
            <td>${lomba.kategori || "-"}</td>
            <td><mark>${lomba.status || "Open"}</mark></td>
        </tr>
        `;
    }
}

// --- Update Dropdown Lomba ---
function updateLombaDropdown() {
    const select = document.getElementById("lombaSelect");
    if (!select) return;

    select.innerHTML = `<option value="">-- Pilih Lomba --</option>`;
    for (const namaLomba in databaseLomba) {
        const opt = document.createElement("option");
        opt.value = namaLomba;
        opt.textContent = namaLomba;
        select.appendChild(opt);
    }
}

// --- FUNGSI BARU: Filter Peserta Berdasarkan Lomba ---
// Panggil fungsi ini pas dropdown lomba berubah (onchange)
function filterPesertaBerdasarkanLomba() {
    const lombaTerpilih = document.getElementById("lombaSelect").value;
    const selectPeserta = document.getElementById("pesertaSelect"); // Pastikan ID ini ada di HTML bracket
    
    if (!lombaTerpilih || !selectPeserta) return;

    const dataLomba = databaseLomba[lombaTerpilih];
    // Ambil kategori lomba (misal: "1, 2" atau "M")
    const kategoriLomba = dataLomba.kategori.split(",").map(k => k.trim().toUpperCase());

    selectPeserta.innerHTML = `<option value="">-- Pilih Peserta --</option>`;

    // Filter databaseAnak berdasarkan kategori lomba
    const pesertaCocok = databaseAnak.filter(anak => {
        return kategoriLomba.includes(anak.kategori.toUpperCase());
    });

    pesertaCocok.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.nama;
        opt.textContent = `${p.nama} [Kat: ${p.kategori}] [Lev: ${p.level}]`;
        selectPeserta.appendChild(opt);
    });
}
