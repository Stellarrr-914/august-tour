// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbzyiODfi1B0edunxcl1GpPyPP-RJoL4dyKu-MCYJ0UhdC1utfGZKOUaw8p4G5hTCQpa/exec"; 
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
            dataPesertaCloud = data; 
            container.innerHTML = "";
            
            if (!data || data.length === 0) {
                container.innerHTML = `
                <div style="padding:15px; border:1px solid #ffcccc; background:#fff5f5; border-radius:8px; color:#cc0000; text-align:center;">
                    <b>Data Kosong!</b><br>
                    ${babak === "Penyisihan" 
                        ? "Belum ada pendaftar di kategori ini." 
                        : "Belum ada peserta yang <b>Lolos</b> dari babak sebelumnya."}
                </div>`;
                document.getElementById("actionGenerate").style.display = "none";
                return;
            }

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
    const namaTerpilih = Array.from(checkboxes).map(cb => cb.value);

    // Filter dataPesertaCloud berdasarkan yang dicentang
    let pesertaFix = dataPesertaCloud.filter(p => namaTerpilih.includes(p.nama));

    if (pesertaFix.length === 0) {
        alert("Pilih peserta dulu!");
        return;
    }

    // Sort berdasarkan Level (Unggulan di atas)
    const bobot = {"S":10,"A+":9,"A":8,"A-":7,"B+":6,"B":5,"B-":4,"C+":3,"C":2,"C-":1};
    pesertaFix.sort((a,b) => (bobot[b.level] || 0) - (bobot[a.level] || 0));

    const hasil = document.getElementById("hasilBracket");
    hasil.innerHTML = "";
    let heatNum = 1;

    // Logika pembagian Heat
    while (pesertaFix.length > 0) {
        let n = pesertaFix.length;
        let ambil = 4;
        if (n === 5) ambil = 5;
        else if (n === 3 || n === 6) ambil = 3;

        const kloter = pesertaFix.splice(0, ambil);
        renderHeatBox(kloter, heatNum++);
    }
}

// 5. RENDER BOX HEAT (Fungsi yang tadi ilang)
function renderHeatBox(peserta, nomor) {
    const container = document.getElementById("hasilBracket");
    let list = "";

    // Acak urutan biar adil (Opsional)
    peserta.sort(() => Math.random() - 0.5);

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
