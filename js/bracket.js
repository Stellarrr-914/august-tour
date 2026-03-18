// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbyJAtPA6_FOOqTVHsmdsaTpjvuPIDUzyLE5QPVfCCY-SrvJsiqCal-1LVFRCqlhjUWS/exec"; 
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
    const container = document.getElementById("pesertaLomba");
    if (!kat) return alert("Pilih kategori dulu!");

    container.innerHTML = "Memuat peserta...";
    fetch(`${scriptURL}?type=getPesertaByKategori&kategori=${encodeURIComponent(kat)}`)
        .then(res => res.json())
        .then(data => {
            dataPesertaCloud = data; // Simpan ke variabel global
            container.innerHTML = "";
            if (data.length === 0) {
                container.innerHTML = "Gak ada peserta di kategori ini.";
                return;
            }
            data.forEach(p => {
                container.innerHTML += `
                <div class="peserta-item">
                    <input type="checkbox" class="peserta-check" value="${p.nama}" checked>
                    <label><strong>${p.nama}</strong> (${p.level})</label>
                </div>`;
            });
            document.getElementById("actionGenerate").style.display = "block";
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
    
    // Acak posisi lintasan biar fair
    peserta.sort(() => Math.random() - 0.5); 

    peserta.forEach((p, i) => {
        list += `
        <li>
            ${i+1}. ${p.nama} (${p.level})
            <select onchange="simpanKeSheet('${p.nama}', this)">
                <option value="">- Hasil -</option>
                <option value="Lolos">Lolos</option>
                <option value="J1">Juara 1</option>
                <option value="J2">Juara 2</option>
                <option value="J3">Juara 3</option>
            </select>
        </li>`;
    });

    container.innerHTML += `
    <div class="heat-box" style="border:1px solid #ccc; padding:10px; margin:10px; border-radius:8px; background:#f9f9f9;">
        <b style="color:#007bff;">HEAT ${nomor}</b>
        <ul style="list-style:none; padding:0; margin-top:5px;">${list}</ul>
    </div>`;
}

// 6. SIMPAN KE SHEET 3
function simpanKeSheet(nama, el) {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    
    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({
            type: "simpanJuara",
            lomba: lomba,
            kategori: kategori,
            nama: nama,
            status: el.value
        })
    })
    .then(() => { 
        el.style.background = "#d4edda"; 
        console.log(`Berhasil simpan: ${nama} sebagai ${el.value}`);
    })
    .catch(err => alert("Gagal simpan!"));
}

// Jalankan load dropdown pas halaman dibuka
document.addEventListener("DOMContentLoaded", updateLombaDropdown);
