// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbwtKg1FYEnYokPZX9RcePvsFmdmrVkX1zitsNjyrUnc3i4l-97pF6UG4afuaLqVFet5/exec"; 
let dataPesertaCloud = [];
// 1. UPDATE DROPDOWN LOMBA (Narik Real-time)
let listLombaFull = []; // Simpen kategori di sini biar gak fetch bolak-balik

function updateLombaDropdown() {
    fetch(`${scriptURL}?type=getLomba`)
        .then(res => res.json())
        .then(data => {
            listLombaFull = data;
            const select = document.getElementById("lombaSelect");
            if (!select) return;
            select.innerHTML = '<option value="">-- Pilih Lomba --</option>';
            data.forEach(l => {
                const opt = document.createElement("option");
                opt.value = l.nama;
                opt.textContent = l.nama;
                select.appendChild(opt);
            });
        });
}

// 2. LOAD KATEGORI BERDASARKAN LOMBA
function updateKategoriBerdasarkanLomba() {
    const lombaVal = document.getElementById("lombaSelect").value;
    const katSelect = document.getElementById("kategoriSelect");
    const lombaData = listLombaFull.find(l => l.nama === lombaVal);
    if (!lombaData) return;

    const kats = lombaData.kategori.split(';').map(k => k.trim().toUpperCase());
    katSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kats.forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = "Kategori " + k;
        katSelect.appendChild(opt);
    });
}

// 3. TAMPILKAN PESERTA (Dari Sheet 1)
function tampilkanPesertaBracket() {
    const kat = document.getElementById("kategoriSelect").value;
    const lomba = document.getElementById("lombaSelect").value;
    const babak = document.getElementById("babakSelect").value;
    const container = document.getElementById("pesertaLomba");

    // Validasi awal
    if (!kat || !lomba) {
        alert("Pilih Lomba & Kategori dulu ya brok!");
        return;
    }

    container.innerHTML = "<div style='padding:10px; color:#666;'>⏳ Sedang narik data dari Cloud...</div>";

    // Tentukan mau panggil fungsi mana di Apps Script
    // Jika Penyisihan -> Ambil semua dari Sheet 1 (Pendaftaran)
    // Jika Semifinal/Final -> Ambil yang 'Lolos' dari babak sebelumnya di Sheet 3
    let typeRequest = (babak === "Penyisihan") ? "getPesertaByKategori" : "getPesertaLolos";
    
    // Pastikan parameter &babak=${babak} ikut dikirim buat filter berjenjang
    let fetchURL = `${scriptURL}?type=${typeRequest}&kategori=${encodeURIComponent(kat)}&lomba=${encodeURIComponent(lomba)}&babak=${encodeURIComponent(babak)}`;

    console.log("Fetching dari URL:", fetchURL); // Buat debug di F12

    fetch(fetchURL)
        .then(res => res.json())
        .then(data => {
            console.log("Data mentah dari server:", data); // CEK DI F12 (Penting!)
            
            // Cek apakah data beneran Array
            if (!Array.isArray(data)) {
                console.error("Format data salah, bukan Array:", data);
                container.innerHTML = "<div style='color:red;'>Format data dari server salah!</div>";
                return;
            }

            dataPesertaCloud = data; 
            container.innerHTML = "";
            
            if (data.length === 0) {
                container.innerHTML = `<div style="padding:15px; background:#fff5f5; color:#cc0000; text-align:center;">
                    <b>Data Kosong!</b><br>Belum ada peserta yang <b>Lolos</b> dari babak sebelumnya.
                </div>`;
                document.getElementById("actionGenerate").style.display = "none";
                return;
            }

            // ... sisa kode data.forEach lu di sini ...
            // Render Checkbox Peserta
            let htmlList = `<div style="margin-bottom:10px; font-weight:bold;">Daftar Peserta (${data.length} Orang):</div>`;
            
            data.forEach((p, index) => {
                htmlList += `
                <div class="peserta-item" style="display:flex; align-items:center; gap:10px; margin-bottom:8px; padding:8px; background:#f8f9fa; border-radius:5px; border:1px solid #eee;">
                    <input type="checkbox" class="peserta-check" id="check-${index}" value="${p.nama}" checked style="width:18px; height:18px; cursor:pointer;">
                    <label for="check-${index}" style="cursor:pointer; flex-grow:1;">
                        <strong>${p.nama}</strong> 
                        <span style="font-size:11px; color:#888;">${p.level ? '(' + p.level + ')' : ''}</span>
                    </label>
                </div>`;
            });

            container.innerHTML = htmlList;
            
            // Munculkan tombol "Generate Heat"
            document.getElementById("actionGenerate").style.display = "block";
        })
        .catch(err => {
            console.error("Error Fetch:", err);
            container.innerHTML = "<div style='color:red; padding:10px;'>❌ Gagal narik data. Pastikan Apps Script sudah di-Deploy!</div>";
        });
}
// 4. GENERATE HEAT (LOGIKA 4-3-5)
function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    let pesertaTerpilih = [];

    checkboxes.forEach(cb => {
        // Ambil data asli dari array dataPesertaCloud yang sudah ada Level-nya
        const dataAsli = dataPesertaCloud.find(p => p.nama === cb.value);
        if (dataAsli) pesertaTerpilih.push(dataAsli);
    });

    if (pesertaTerpilih.length < 3) return alert("Minimal 3 orang buat bikin Heat, brok!");

    // A. URUTKAN BERDASARKAN LEVEL (Penting!)
    const bobot = { "A": 3, "B": 2, "C": 1, "C-": 0 };
    pesertaTerpilih.sort((a, b) => bobot[b.level] - bobot[a.level]);

    // B. LOGIKA PEMBAGIAN (Prio 4, Range 3-5)
    let total = pesertaTerpilih.length;
    let hasilGrup = [];
    let i = 0;

    while (i < total) {
        let sisa = total - i;
        let ukuranGrup = 4; // Default prioritas

        // Kondisi khusus biar gak ada Heat isi 1 atau 2 orang
        if (sisa === 5) {
            ukuranGrup = 5; // Langsung sikat 5 biar gak sisa 1
        } else if (sisa === 6) {
            ukuranGrup = 3; // Pecah jadi 3 dan 3
        } else if (sisa === 3) {
            ukuranGrup = 3;
        }

        hasilGrup.push(pesertaTerpilih.slice(i, i + ukuranGrup));
        i += ukuranGrup;
    }

    // C. RENDER KE LAYAR
    const container = document.getElementById("hasilBracket");
    container.innerHTML = ""; // Bersihkan Heat lama
    hasilGrup.forEach((grup, index) => {
        renderHeatBox(grup, index + 1);
    });
}
// 5. RENDER BOX HEAT (Fungsi yang tadi ilang)
function renderHeatBox(peserta, nomor) {
    const container = document.getElementById("hasilBracket");
    let list = "";

    // Acak urutan biar adil (Opsional)

    peserta.forEach((p, i) => {
        list += `
        <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; border-bottom: 1px dashed #ddd;">
            <span style="font-size: 14px;"><strong>${i+1}.</strong> ${p.nama}</span>
            <select class="select-status" data-nama="${p.nama}" onchange="simpanKeSheet('${p.nama}', this)" 
                style="padding: 3px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                <option value="">- Status -</option>
                <option value="Lolos">✅ LOLOS</option>
                <option value="Gugur">❌ GUGUR</option>
            </select>
        </li>`;
    });

    // Template Box Heat dengan Style Inline
    container.innerHTML += `
    <div class="heat-box" id="heat-${nomor}" 
        style="border: 2px solid #444; border-radius: 12px; margin: 15px; padding: 15px; background: #ffffff; min-width: 280px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; vertical-align: top;">
        
        <div style="background: #444; color: white; padding: 5px 10px; border-radius: 6px; margin-bottom: 15px; text-align: center; font-weight: bold;">
            HEAT ${nomor}
        </div>

        <ul style="list-style: none; padding: 0; margin: 0;">${list}</ul>

        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
            <button onclick="loloskanDuaTeratas(${nomor})" 
                style="width: 100%; background: #28a745; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s;">
                ⚡ Loloskan 2 Teratas
            </button>
            <p style="font-size: 10px; color: #888; text-align: center; margin-top: 5px;">*Otomatis simpan ke Cloud</p>
        </div>
    </div>`;
}
function loloskanDuaTeratas(nomorHeat) {
    const heatBox = document.getElementById(`heat-${nomorHeat}`);
    const semuaSelect = heatBox.querySelectorAll('.select-status');

    semuaSelect.forEach((select, index) => {
        if (index < 2) {
            select.value = "Lolos";
        } else {
            select.value = "Gugur";
        }
        
        // Trigger fungsi simpan otomatis biar langsung ke-update ke Sheet 3
        const nama = select.getAttribute('data-nama');
        simpanKeSheet(nama, select);
    });
}

// 6. SIMPAN KE SHEET 3
function simpanKeSheet(nama, el) {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babakAktif = document.getElementById("babakSelect").value;

    if (!el.value) return;

    // Gabungkan status (Lolos/Gugur) dengan nama babaknya
    // Hasilnya di Sheet 3 nanti: "Lolos - Penyisihan"
    const statusGabungan = `${el.value} - ${babakAktif}`;

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({
            type: "simpanJuara",
            lomba: lomba,
            kategori: kategori,
            nama: nama,
            status: statusGabungan // Ini yang masuk ke Kolom D
        })
    })
    // ... sisa kode fetch ...
}
// Jalankan load dropdown pas halaman dibuka
document.addEventListener("DOMContentLoaded", updateLombaDropdown);
