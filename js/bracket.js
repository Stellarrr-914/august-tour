// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbyZNFTsScJbWwLhhK_zBEanzJNzTZ4mI_rPIrcr8glPxNXBKI5aDSZNDZyulR4Jjq7j/exec"; 

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
    // Cuma ambil yang dicentang
    const checked = document.querySelectorAll(".peserta-check:checked");
    const namaDipilih = Array.from(checked).map(c => c.value);
    
    // Filter data mentah berdasarkan checkbox
    let pesertaTanding = window.semuaPesertaKategori.filter(p => namaDipilih.includes(p.nama));
    
    if (pesertaTanding.length === 0) return alert("Centang dulu pesertanya!");

    // LANJUTKAN LOGIKA PEMBAGIAN HEAT 4-3-5 LU DI SINI...
    // (Gunakan variabel pesertaTanding)
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
