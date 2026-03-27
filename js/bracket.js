// URL Web App lu yang baru dari step di atas
const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 
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
        const dataAsli = dataPesertaCloud.find(p => p.nama === cb.value);
        if (dataAsli) pesertaTerpilih.push(dataAsli);
    });

    if (pesertaTerpilih.length < 3) return alert("Minimal 3 orang buat bikin Heat, brok!");

    // A. URUTKAN BERDASARKAN LEVEL
    const bobot = { "A+": 9, "A": 8, "A-": 7, "B+": 6, "B": 5, "B-": 4, "C+": 3, "C": 2, "C-": 1 };

    pesertaTerpilih.sort((a, b) => {
        let levelA = bobot[a.level] || 0;
        let levelB = bobot[b.level] || 0;
        if (levelA !== levelB) return levelB - levelA;
        return Math.random() - 0.5; 
    });

    // B. LOGIKA PEMBAGIAN
    let total = pesertaTerpilih.length;
    let hasilGrup = [];
    let i = 0;

    while (i < total) {
        let sisa = total - i;
        let ukuranGrup = 4; 
        if (sisa === 5) { ukuranGrup = 5; } 
        else if (sisa === 6 || sisa === 3) { ukuranGrup = 3; }

        hasilGrup.push(pesertaTerpilih.slice(i, i + ukuranGrup));
        i += ukuranGrup;
    }

    // C. RENDER KE LAYAR
    const container = document.getElementById("hasilBracket");
    container.innerHTML = ""; 
    
    hasilGrup.forEach((grup, index) => {
        // Kita oper 'index + 1' sebagai NOMOR HEAT
        renderHeatBox(grup, index + 1);
    });

    document.getElementById("btnPublikasi").style.display = "block";
}
function publikasikanHeat() {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babakAktif = document.getElementById("babakSelect").value;

    if (!lomba || !kategori) {
        alert("Pilih Lomba & Kategori dulu brok!");
        return;
    }

    const konfirmasi = confirm(`Publikasikan jadwal ${babakAktif} ini ke Live Report?`);
    if (!konfirmasi) return;

    // Ambil semua dropdown/elemen yang punya data-nama di dalam hasil generate
    const allPlayers = document.querySelectorAll(".select-status"); 
    let dataKirim = [];

    allPlayers.forEach(el => {
        dataKirim.push({
            type: "simpanJuara", // Kita pake type yang sama biar Apps Script yang nanganin update/append
            lomba: lomba,
            kategori: kategori,
            nama: el.getAttribute("data-nama"),
            status: `Menunggu - ${babakAktif}`,
            heat: el.getAttribute("data-heat")
        });
    });

    // Kirim satu-satu (atau bisa masal kalau mau modif Apps Script lagi)
    // Untuk awal, kita pake loop biar simple dan gak ubah Code.gs terlalu banyak
    Promise.all(dataKirim.map(item => {
        return fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(item)
        });
    })).then(() => {
        alert("Mantap! Jadwal Heat sudah live di Live Report.");
    }).catch(err => {
        alert("Aduh, gagal publikasi masal.");
        console.error(err);
    });
}
// 5. RENDER BOX HEAT (Fungsi yang tadi ilang)
function renderHeatBox(grup, nomorHeat) {
    const container = document.getElementById("hasilBracket");
    
    let html = `<div class="heat-box" style="border:2px solid #333; margin-bottom:20px; padding:15px; border-radius:10px; background:#fff;">
                <h3 style="margin-top:0; color:#007bff;">HEAT ${nomorHeat}</h3>`;

    grup.forEach(p => {
        html += `
            <div class="player-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span style="font-weight:bold;">${p.nama} <small style="color:#888;">(${p.level})</small></span>
                
                <select class="select-status" 
                        data-nama="${p.nama}" 
                        data-heat="${nomorHeat}" 
                        onchange="simpanKeSheet('${p.nama}', this)"
                        style="padding:5px; border-radius:5px; border:1px solid #ccc;">
                    <option value="">-- Set Hasil --</option>
                    <option value="Lolos">Lolos</option>
                    <option value="Gugur">Gugur</option>
                    <option value="Juara 1">Juara 1</option>
                    <option value="Juara 2">Juara 2</option>
                    <option value="Juara 3">Juara 3</option>
                </select>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML += html;
}
function kirimSatuHeat(nomorHeat) {
    const heatBox = document.getElementById(`heat-${nomorHeat}`);
    const semuaSelect = heatBox.querySelectorAll('.select-status');
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;

    let dataSiapKirim = [];

    semuaSelect.forEach(select => {
        if (select.value !== "") { // Cuma kirim yang sudah dipilih statusnya
            dataSiapKirim.push({
                nama: select.getAttribute('data-nama'),
                status: `${select.value} - ${babak}`
            });
        }
    });

    if (dataSiapKirim.length === 0) return alert("Pilih status peserta dulu, brok!");

    // Kasih indikator loading di tombol
    const btn = heatBox.querySelector('button[onclick^="kirimSatuHeat"]');
    const teksAsli = btn.innerText;
    btn.innerText = "⏳ Mengirim...";
    btn.disabled = true;

    // Kita kirim satu per satu atau sekaligus (pake Loop Fetch)
    let promises = dataSiapKirim.map(p => {
        return fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({
                type: "simpanJuara",
                lomba: lomba,
                kategori: kategori,
                nama: p.nama,
                status: p.status
            })
        });
    });

    Promise.all(promises)
        .then(() => {
            alert(`Sakti! Data Heat ${nomorHeat} berhasil diupdate.`);
            btn.innerText = "✅ Terupdate";
            btn.style.background = "#28a745";
        })
        .catch(err => {
            console.error(err);
            alert("Aduh, gagal kirim. Cek koneksi!");
            btn.innerText = teksAsli;
            btn.disabled = false;
        });
}

function loloskanDuaTeratas(nomorHeat) {
    const heatBox = document.getElementById(`heat-${nomorHeat}`);
    const semuaSelect = heatBox.querySelectorAll('.select-status');

    semuaSelect.forEach((select, index) => {
        // Index 0 dan 1 jadi Lolos, sisanya Gugur
        select.value = (index < 2) ? "Lolos" : "Gugur";
        
        // Kasih efek visual biar panitia tau mana yang berubah
        select.style.border = "2px solid #28a745";
    });
}
// 6. SIMPAN KE SHEET 3
function simpanKeSheet(nama, el) {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babakAktif = document.getElementById("babakSelect").value;

    // 1. Validasi Input Dasar
    if (!lomba || !kategori || !babakAktif) {
        alert("Pilih Lomba, Kategori, dan Babak dulu di menu atas!");
        el.value = ""; 
        return;
    }

    if (!el.value) return; // Kalau milih '-- Set --' abaikan

    // 2. Ambil Nomor Heat dari atribut data-heat yang kita set pas Generate
    const heatInfo = el.getAttribute("data-heat") || 1;

    // 3. Gabungkan status (misal: "Lolos - Penyisihan")
    const statusGabungan = `${el.value} - ${babakAktif}`;

    // Efek visual loading
    el.style.opacity = "0.5";
    el.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify({
            type: "simpanJuara",
            lomba: lomba,
            kategori: kategori,
            nama: nama,
            status: statusGabungan,
            heat: heatInfo
        })
    })
    .then(() => {
        // Efek visual sukses
        el.style.opacity = "1";
        el.disabled = false;
        el.style.borderColor = "#28a745";
        el.style.background = "#eaffea";
        console.log(`Berhasil update: ${nama} (${statusGabungan})`);
    })
    .catch(err => {
        el.disabled = false;
        el.style.opacity = "1";
        alert("Gagal koneksi ke Cloud!");
        console.error(err);
    });
}

document.addEventListener("DOMContentLoaded", updateLombaDropdown);
