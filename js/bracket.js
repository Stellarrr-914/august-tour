// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbyJAtPA6_FOOqTVHsmdsaTpjvuPIDUzyLE5QPVfCCY-SrvJsiqCal-1LVFRCqlhjUWS/exec"; 
let dataPesertaCloud = [];
// 1. UPDATE DROPDOWN LOMBA (Narik Real-time)
let listLombaFull = []; // Simpen kategori di sini biar gak fetch bolak-balik

function updateLombaDropdown() {
    const select = document.getElementById("lombaSelect");
    if (!select) return;

    fetch(`${scriptURL}?type=getLomba`)
        .then(res => res.json())
        .then(data => {
            listLombaFull = data; // Simpen data lengkap (Lomba + Kategorinya)
            select.innerHTML = `<option value="">-- Pilih Lomba --</option>`;
            
            data.forEach(l => {
                const opt = document.createElement("option");
                opt.value = l.nama; // Ambil properti 'nama' (Kolom A)
                opt.textContent = l.nama;
                select.appendChild(opt);
            });
            console.log("Dropdown Lomba Fixed!");
        })
        .catch(err => console.error("Gagal tarik data:", err));
}

// 2. UPDATE KATEGORI (Pecah titik koma dari Sheet 2)
function updateKategoriBerdasarkanLomba() {
    const lombaTerpilih = document.getElementById("lombaSelect").value;
    const kategoriSelect = document.getElementById("kategoriSelect");
    
    const lombaData = listLombaFull.find(l => l.nama === lombaTerpilih);
    if (!lombaData) return;

    const listKategori = lombaData.kategori.split(';').map(k => k.trim().toUpperCase());
    kategoriSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    listKategori.forEach(kat => {
        const opt = document.createElement("option");
        opt.value = kat;
        opt.textContent = "Kategori " + kat;
        kategoriSelect.appendChild(opt);
    });
}

function tampilkanPesertaBracket() {
    const kat = document.getElementById("kategoriSelect").value;
    const container = document.getElementById("pesertaLomba");
    if (!kat) return alert("Pilih kategori dulu!");

    container.innerHTML = "Memuat peserta...";

    fetch(`${scriptURL}?type=getPesertaByKategori&kategori=${encodeURIComponent(kat)}`)
        .then(res => res.json())
        .then(data => {
            // SIMPAN DATA KE VARIABEL GLOBAL
            dataPesertaCloud = data; 
            console.log("Data berhasil disimpan ke cloud variabel:", dataPesertaCloud);

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
            
            // Munculkan tombol generate
            document.getElementById("actionGenerate").style.display = "block";
        })
        .catch(err => alert("Gagal narik data: " + err));
}

function generateBracket() {
    // 2. Ambil semua checkbox yang DICENTANG
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    const namaTerpilih = Array.from(checkboxes).map(cb => cb.value);

    console.log("Nama yang dicentang:", namaTerpilih);

    // 3. Filter dataPesertaCloud berdasarkan nama yang dicentang
    let pesertaFix = dataPesertaCloud.filter(p => namaTerpilih.includes(p.nama));

    console.log("Data peserta yang siap tanding:", pesertaFix);

    if (pesertaFix.length === 0) {
        alert("Pilih peserta dulu (centang box-nya)!");
        return;
    }

    // --- LANJUT LOGIKA SORTING & PEMBAGIAN HEAT ---
    const bobot = {"S":10,"A+":9,"A":8,"A-":7,"B+":6,"B":5,"B-":4,"C+":3,"C":2,"C-":1};
    pesertaFix.sort((a,b) => (bobot[b.level] || 0) - (bobot[a.level] || 0));

    const hasil = document.getElementById("hasilBracket");
    hasil.innerHTML = "";
    let heatNum = 1;

    // Logika Heat 4-3-5
    while (pesertaFix.length > 0) {
        let n = pesertaFix.length;
        let ambil = 4;
        if (n === 5) ambil = 5;
        else if (n === 3 || n === 6) ambil = 3;

        const kloter = pesertaFix.splice(0, ambil);
        renderHeatBox(kloter, heatNum++);
    }
}
// 3. SIMPAN KE SHEET 3 (Pake fetch, bukan google.script.run)
function simpanKeSheet(nama, selectElement) {
    const hasil = selectElement.value;
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    if (!hasil) return;

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({
            type: "simpanJuara",
            namaLomba: lomba,
            kategoriLomba: kategori,
            namaPeserta: nama,
            babakBaru: hasil
        })
    })
    .then(() => {
        selectElement.style.background = "#d4edda";
        alert("Berhasil simpan " + nama);
    })
    .catch(err => alert("Gagal simpan ke cloud!"));
}

// Panggil saat halaman siap
document.addEventListener("DOMContentLoaded", updateLombaDropdown);
