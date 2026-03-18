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

// 3. TAMPILKAN PESERTA (Narik dari Sheet 1 via Apps Script)
function tampilkanPesertaBracket() {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const container = document.getElementById("pesertaLomba");
    const actionBtn = document.getElementById("actionGenerate");

    if (!lomba || !kategori) {
        alert("Pilih Lomba dan Kategori dulu, brok!");
        return;
    }

    container.innerHTML = "<i>Memuat data peserta dari cloud...</i>";

    // Kita request ke Apps Script dengan type baru: getPeserta
    fetch(`${scriptURL}?type=getPeserta&lomba=${encodeURIComponent(lomba)}&kategori=${encodeURIComponent(kategori)}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = "";
            
            if (data.length === 0) {
                container.innerHTML = "<p style='color:red;'>Gak ada peserta yang terdaftar di kategori ini.</p>";
                actionBtn.style.display = "none";
                return;
            }

            // Simpan data ke variabel global sementara buat dipakai fungsi Generate Heat nanti
            window.pesertaFilterCloud = data; 

            data.forEach(p => {
                container.innerHTML += `
                    <div class="peserta-item">
                        <input type="checkbox" class="peserta-check" value="${p.nama}" checked>
                        <label><strong>${p.nama}</strong> <br><small>Level: ${p.level}</small></label>
                    </div>
                `;
            });

            actionBtn.style.display = "block"; // Munculkan tombol Generate Heat
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = "<p style='color:red;'>Gagal narik data peserta. Cek koneksi!</p>";
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
