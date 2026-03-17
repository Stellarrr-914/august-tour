// ======= BRACKET LOGIC =======

// 1. Update Dropdown Lomba (Dipanggil otomatis dari data.js saat load)
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

// 2. Filter Kategori pas Lomba dipilih
function updateKategoriBerdasarkanLomba() {
    const lombaTerpilih = document.getElementById("lombaSelect").value;
    const kategoriSelect = document.getElementById("kategoriSelect");
    
    if (!lombaTerpilih || !databaseLomba[lombaTerpilih]) {
        kategoriSelect.innerHTML = `<option value="">-- Pilih Lomba Dulu --</option>`;
        return;
    }

    // Ambil string kategori dari database lomba (hasil input titik koma)
    const kategoriString = databaseLomba[lombaTerpilih].kategori; 
    
    // PERBAIKAN: Kita pecah pakai titik koma (;)
    const listKategori = kategoriString.split(';').map(k => k.trim().toUpperCase());

    kategoriSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';

    listKategori.forEach(kat => {
        if (kat) { 
            const opt = document.createElement("option");
            opt.value = kat;
            opt.textContent = "Kategori " + kat;
            kategoriSelect.appendChild(opt);
        }
    });
}

// 3. Tampilkan Peserta dengan Checkbox
function tampilkanPesertaBracket() {
    const kategoriTerpilih = document.getElementById("kategoriSelect").value;
    const container = document.getElementById("pesertaLomba");
    const actionBtn = document.getElementById("actionGenerate");
    
    if (!kategoriTerpilih) {
        alert("Pilih kategorinya dulu brok!");
        return;
    }

    container.innerHTML = "";
    
    // Filter databaseAnak (Peserta) berdasarkan kategori yang dipilih
    const pesertaCocok = databaseAnak.filter(p => p.kategori === kategoriTerpilih);

    if (pesertaCocok.length === 0) {
        container.innerHTML = "<p style='color:red;'>Gak ada peserta di kategori ini.</p>";
        actionBtn.style.display = "none";
        return;
    }

    pesertaCocok.forEach(p => {
        container.innerHTML += `
            <div class="peserta-item">
                <input type="checkbox" class="peserta-check" value="${p.nama}" checked>
                <label>${p.nama} <br><small>Lev: ${p.level}</small></label>
            </div>
        `;
    });

    actionBtn.style.display = "block";
}

// 4. Generate Heat / Bagan
function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    const limit = parseInt(document.getElementById("limitPerHeat").value) || 4;
    const hasil = document.getElementById("hasilBracket");
    
    let daftarNama = [];
    checkboxes.forEach(cb => daftarNama.push(cb.value));

    if (daftarNama.length === 0) {
        alert("Pilih minimal satu peserta!");
        return;
    }

    // Acak Peserta (Shuffle)
    daftarNama.sort(() => Math.random() - 0.5);

    hasil.innerHTML = ""; // Reset tampilan

    // Bagi peserta ke dalam box Heat
    for (let i = 0; i < daftarNama.length; i += limit) {
        const heatPeserta = daftarNama.slice(i, i + limit);
        const heatNum = (i / limit) + 1;

        let listHtml = "";
        heatPeserta.forEach(nama => {
            listHtml += `<li>${nama}</li>`;
        });

        hasil.innerHTML += `
            <div class="heat-box">
                <div class="heat-header">HEAT ${heatNum}</div>
                <ul class="heat-list">
                    ${listHtml}
                </ul>
            </div>
        `;
    }
}
