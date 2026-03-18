// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbyJAtPA6_FOOqTVHsmdsaTpjvuPIDUzyLE5QPVfCCY-SrvJsiqCal-1LVFRCqlhjUWS/exec"; 

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
    const btn = document.getElementById("actionGenerate");

    if (!kat) return alert("Pilih kategori dulu!");

    container.innerHTML = "Memuat peserta...";
    
    fetch(`${scriptURL}?type=getPesertaByKategori&kategori=${encodeURIComponent(kat)}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = "";
            // Simpan ke global biar bisa diakses generateBracket()
            window.semuaPesertaKategori = data; 

            if (data.length === 0) {
                container.innerHTML = "Gak ada orang di kategori ini.";
                btn.style.display = "none";
                return;
            }

            data.forEach(p => {
                container.innerHTML += `
                <div class="peserta-item">
                    <input type="checkbox" class="peserta-check" value="${p.nama}" checked>
                    <label>${p.nama} (Level: ${p.level})</label>
                </div>`;
            });
            btn.style.display = "block";
        });
}

function generateBracket() {
    const checkedNames = Array.from(document.querySelectorAll(".peserta-check:checked")).map(c => c.value);
    let pesertaTanding = dataPesertaCloud.filter(p => checkedNames.includes(p.nama));

    if (pesertaTanding.length === 0) return alert("Pilih peserta dulu!");

    // Sorting Level
    const bobot = {"S":10,"A+":9,"A":8,"A-":7,"B+":6,"B":5,"B-":4,"C+":3,"C":2,"C-":1};
    pesertaTanding.sort((a,b) => (bobot[b.level]||0) - (bobot[a.level]||0));

    const hasil = document.getElementById("hasilBracket");
    hasil.innerHTML = "";
    let heatNum = 1;

    while (pesertaTanding.length > 0) {
        let jml = pesertaTanding.length;
        let ambil = 4; // Default
        if (jml === 5) ambil = 5;
        else if (jml === 3 || jml === 6) ambil = 3;

        const kloter = pesertaTanding.splice(0, ambil);
        kloter.sort(() => Math.random() - 0.5); // Acak posisi lintasan
        
        let listHtml = kloter.map((p, i) => `
            <li>${i+1}. ${p.nama} 
                <select onchange="simpanKeSheet('${p.nama}', this)">
                    <option value="">-</option>
                    <option value="Lolos">Lolos</option>
                    <option value="J1">J1</option>
                    <option value="J2">J2</option>
                </select>
            </li>`).join("");

        hasil.innerHTML += `<div class="heat-box"><b>HEAT ${heatNum++}</b><ul>${listHtml}</ul></div>`;
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
