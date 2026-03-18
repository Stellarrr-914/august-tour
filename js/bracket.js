// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbwvL6XGHCgv-67DkKo80yoz9qu_Tx9MudeHaTLjXOPutDWrLTidDHgDY8a9VwkjDKE/exec"; 

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
