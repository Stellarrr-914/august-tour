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

function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    const hasil = document.getElementById("hasilBracket");
    
    let daftarPeserta = [];
    checkboxes.forEach(cb => {
        const pData = databaseAnak.find(a => a.nama === cb.value);
        if (pData) daftarPeserta.push(pData);
    });

    if (daftarPeserta.length === 0) {
        alert("Pilih warga dulu, brok!");
        return;
    }

    // 1. KELOMPOKKAN BERDASARKAN LEVEL (Adil Versi Warga)
    const grupLevel = {};
    daftarPeserta.forEach(p => {
        if (!grupLevel[p.level]) grupLevel[p.level] = [];
        grupLevel[p.level].push(p);
    });

    hasil.innerHTML = ""; 
    let heatCounter = 1;

    // 2. PROSES TIAP GRUP LEVEL
    for (const level in grupLevel) {
        let pesertaLevel = grupLevel[level];
        
        // Acak internal level tersebut biar gak disangka pilih kasih
        pesertaLevel.sort(() => Math.random() - 0.5);

        // Algoritma pembagian 4-3-5
        let i = 0;
        while (i < pesertaLevel.length) {
            let sisa = pesertaLevel.length - i;
            let jumlahDiHeat = 4; // Prioritas 4

            if (sisa === 5) {
                jumlahDiHeat = 5; // Maksimal 5
            } else if (sisa === 3) {
                jumlahDiHeat = 3; // Minimal 3
            } else if (sisa < 3 && i > 0) {
                // Kalau sisa 1 atau 2, masukin ke heat sebelumnya (biar jadi 5 atau 6)
                // Tapi karena limit maksimal 5, kita paksa seimbang 3 dan 3 atau semacamnya
                // Untuk simplenya, kita ambil sisa ini gabung ke heat terakhir yang dibuat
                i = pesertaLevel.length; // Keluar loop karena sudah dihandle
                break; 
            }

            const heatPeserta = pesertaLevel.slice(i, i + jumlahDiHeat);
            if(heatPeserta.length > 0) {
                renderHeatBox(heatPeserta, heatCounter++, level);
            }
            i += jumlahDiHeat;
        }
    }

    // Tambah tombol action di bawah
    hasil.innerHTML += `
        <div style="width: 100%; margin: 20px 0; text-align: center;">
            <button onclick="window.print()" style="background: #000; color: #fff;">🖨️ Cetak Bagan Untuk Juri</button>
        </div>
    `;
}

// Fungsi pembantu buat nggambar Box Heat
function renderHeatBox(peserta, nomor, level) {
    const hasil = document.getElementById("hasilBracket");
    let listHtml = "";
    
    peserta.forEach((p, idx) => {
        listHtml += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <span><strong>${idx + 1}. ${p.nama}</strong></span>
                <select class="juara-select" style="border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">- Hasil -</option>
                    <option value="1">Juara 1</option>
                    <option value="2">Juara 2</option>
                    <option value="3">Juara 3</option>
                    <option value="Lolos">Lolos</option>
                </select>
            </li>`;
    });

    hasil.innerHTML += `
        <div class="heat-box" style="
            background: white; border: 2px solid #000; border-radius: 8px;
            width: 100%; max-width: 320px; box-shadow: 6px 6px 0px #000;
            margin-bottom: 20px; overflow: hidden;
        ">
            <div style="background: #f1c40f; color: #000; padding: 8px; text-align: center; font-weight: bold; border-bottom: 2px solid #000;">
                HEAT ${nomor} - LEVEL ${level}
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">${listHtml}</ul>
        </div>
    `;
}
