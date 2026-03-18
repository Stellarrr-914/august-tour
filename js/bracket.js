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

// 1. Bobot Level Universal (Biar sistem tau urutan 'kekuatan')
const bobotLevel = {
    // Anak/Umum
    "S": 10, "A+": 9, "A": 8, "A-": 7, "B+": 6, "B": 5, "B-": 4, "C+": 3, "C": 2, "C-": 1,
    // Ibu-ibu (Asumsi: Angka kecil = Makin Jago)
    "1": 10, "2": 9, "3": 8, "4": 7, "5": 6, "6": 5, "7": 4, "8": 3, "9": 2
};

function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    const hasil = document.getElementById("hasilBracket");
    
    let daftarPeserta = [];
    checkboxes.forEach(cb => {
        const pData = databaseAnak.find(a => a.nama === cb.value);
        if (pData) daftarPeserta.push(pData);
    });

    if (daftarPeserta.length === 0) {
        alert("Pilih peserta dulu, brok!");
        return;
    }

    // --- LOGIKA UTAMA: SORTING BERDASARKAN LEVEL ---
    // Karena mereka sudah satu KATEGORI (hasil filter sebelumnya), 
    // sekarang kita jejerin berdasarkan Levelnya.
    daftarPeserta.sort((a, b) => {
        const bA = bobotLevel[String(a.level).toUpperCase()] || 0;
        const bB = bobotLevel[String(b.level).toUpperCase()] || 0;
        return bB - bA; // Dari paling jago ke paling pemula
    });

    hasil.innerHTML = ""; 
    let heatCounter = 1;
    let tempPeserta = [...daftarPeserta];

    // --- PEMBAGIAN HEAT (4-3-5) ---
    while (tempPeserta.length > 0) {
        let n = tempPeserta.length;
        let ambil = 4; // Default

        if (n === 5) ambil = 5;
        else if (n === 3) ambil = 3;
        else if (n === 6) ambil = 3; // Biar adil 3 vs 3, bukan 4 vs 2
        else if (n < 3 && heatCounter > 1) {
            // Jika sisa 1 atau 2, kita bongkar heat sebelumnya (Logic Manual)
            // Tapi untuk sistem RT, kita gabung aja ke heat terakhir biar gampang.
            break; 
        }

        const kloter = tempPeserta.splice(0, ambil);
        const rangeLevel = [...new Set(kloter.map(p => p.level))].join("/");

        renderHeatBox(kloter, heatCounter++, rangeLevel);
    }
}

function renderHeatBox(peserta, nomor, levelLabel) {
    const hasil = document.getElementById("hasilBracket");
    let listHtml = "";
    
    // Diacak di dalam heat biar urutan lintasan/posisi adil
    peserta.sort(() => Math.random() - 0.5);

    peserta.forEach((p, idx) => {
        listHtml += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <span><strong>${idx + 1}. ${p.nama}</strong> <small>(${p.level})</small></span>
                <select class="juara-select no-print" data-nama="${p.nama}">
                    <option value="">-</option>
                    <option value="1">J1</option>
                    <option value="2">J2</option>
                    <option value="3">J3</option>
                    <option value="L">Lolos</option>
                </select>
            </li>`;
    });

    hasil.innerHTML += `
        <div class="heat-box" style="
            background: white; border: 2.5px solid #000; border-radius: 12px;
            width: 100%; max-width: 300px; box-shadow: 6px 6px 0px #000;
            margin: 10px; overflow: hidden; display: inline-block; vertical-align: top;
            text-align: left;
        ">
            <div style="background: #e74c3c; color: #fff; padding: 10px; text-align: center; font-weight: bold; border-bottom: 2.5px solid #000;">
                HEAT ${nomor} <br>
                <span style="font-size: 10px; opacity: 0.9;">LEVEL: ${levelLabel}</span>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">${listHtml}</ul>
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
        <select class="juara-select" 
                style="border: 1px solid #ccc; border-radius: 4px;" 
                onchange="simpanKeSheet('${p.nama}', this)"> <option value="">- Hasil -</option>
            <option value="Juara 1">Juara 1</option>
            <option value="Juara 2">Juara 2</option>
            <option value="Juara 3">Juara 3</option>
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
                HEAT ${nomor}
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">${listHtml}</ul>
        </div>
    `;
}

function simpanKeSheet(nama, selectElement) {
    const hasil = selectElement.value;
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    
    if (!hasil) return;

    console.log(`Mencoba simpan: ${nama} | ${lomba} | ${kategori} | ${hasil}`);

    // CEK: Apakah kita sedang di Google Apps Script?
    if (typeof google !== 'undefined' && google.script && google.script.run) {
        // JALUR ASLI (Kalau sudah di-deploy)
        google.script.run
            .withSuccessHandler(function(res) {
                console.log("Berhasil:", res);
                selectElement.style.background = "#d4edda"; 
            })
            .withFailureHandler(err => alert("Gagal: " + err))
            .simpanKelolosan(nama, lomba, kategori, hasil);
    } else {
        // JALUR SIMULASI (Kalau buka file lokal di Chrome)
        console.warn("Google Script Run tidak deteksi. Simulasi simpan berhasil!");
        alert(`[MODE SIMULASI]\nData ${nama} akan disimpan sebagai ${hasil}.\n(Ini muncul karena lu buka file lokal, bukan link deploy)`);
        selectElement.style.background = "#fff3cd"; // Kuning tanda simulasi
    }
}
