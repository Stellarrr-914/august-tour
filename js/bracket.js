const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 
let dataPesertaCloud = [];
let listLombaFull = [];

// 1. UPDATE DROPDOWN LOMBA
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

// 3. TAMPILKAN PESERTA (Filter Cloud)
function tampilkanPesertaBracket() {
    const kat = document.getElementById("kategoriSelect").value;
    const lomba = document.getElementById("lombaSelect").value;
    const babak = document.getElementById("babakSelect").value;
    const container = document.getElementById("pesertaLomba");

    if (!kat || !lomba) return alert("Pilih Lomba & Kategori dulu ya brok!");

    container.innerHTML = "<div style='padding:10px; color:#f1c40f;'>⏳ Sedang narik data dari Cloud...</div>";

    let typeRequest = (babak === "Penyisihan") ? "getPesertaByKategori" : "getPesertaLolos";
    let fetchURL = `${scriptURL}?type=${typeRequest}&kategori=${encodeURIComponent(kat)}&lomba=${encodeURIComponent(lomba)}&babak=${encodeURIComponent(babak)}`;

    fetch(fetchURL)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return console.error("Data bukan Array");

            dataPesertaCloud = data; 
            container.innerHTML = "";
            
            if (data.length === 0) {
                container.innerHTML = `<div style="padding:15px; background:#2c3e50; color:#e74c3c; text-align:center; border-radius:8px;">
                    <b>Data Kosong!</b><br>Belum ada peserta yang sesuai kriteria / lolos.
                </div>`;
                document.getElementById("actionGenerate").style.display = "none";
                return;
            }

            let htmlList = `<div style="margin-bottom:10px; font-weight:bold; color:white;">Daftar Peserta (${data.length} Orang):</div>`;
            data.forEach((p, index) => {
                htmlList += `
                <div class="peserta-item" style="display:flex; align-items:center; gap:10px; margin-bottom:8px; padding:8px; background:#1e1e1e; border-radius:5px; border:1px solid #333;">
                    <input type="checkbox" class="peserta-check" id="check-${index}" value="${p.nama}" checked style="width:18px; height:18px;">
                    <label for="check-${index}" style="color:white; cursor:pointer; flex-grow:1;">
                        <strong>${p.nama}</strong> <small style="color:#888;">${p.level ? '('+p.level+')' : ''}</small>
                    </label>
                </div>`;
            });

            container.innerHTML = htmlList;
            document.getElementById("actionGenerate").style.display = "block";
        })
        .catch(err => {
            container.innerHTML = "<div style='color:red;'>❌ Gagal narik data!</div>";
        });
}

// 4. GENERATE HEAT (LOGIKA 4-3-5) - VERSI RAPI TOTAL
function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    let pesertaTerpilih = [];

    checkboxes.forEach(cb => {
        const dataAsli = dataPesertaCloud.find(p => p.nama === cb.value);
        if (dataAsli) pesertaTerpilih.push(dataAsli);
    });

    if (pesertaTerpilih.length < 3) return alert("Minimal 3 orang buat bikin Heat, brok!");

    // A. URUTKAN BERDASARKAN LEVEL (Seeding)
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

    // C. RENDER KE LAYAR (Tampilan Diperhalus)
    const container = document.getElementById("hasilBracket");
    container.innerHTML = ""; 
    
    hasilGrup.forEach((grup, index) => {
        const nomorHeat = index + 1;
        
        let html = `
            <div class="heat-box" id="heat-${nomorHeat}" style="background:#1e1e1e; border:1px solid #333; border-radius:12px; margin-bottom:20px; color:white; overflow:hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <div style="background:#333; color:#f1c40f; padding:12px; font-weight:bold; text-align:center; border-bottom: 2px solid #444; text-transform: uppercase; letter-spacing: 1px;">
                    HEAT ${nomorHeat}
                </div>
                <div style="padding:10px;">
        `;

        grup.forEach(p => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 5px; border-bottom:1px solid #2a2a2a; gap: 15px;">
                    <span style="color:white; font-size:14px; flex-grow:1; text-align:left;">
                        <strong style="text-transform: uppercase;">${p.nama}</strong> 
                        <br><small style="color:#888; font-size:11px;">Level: ${p.level || '-'}</small>
                    </span>
                    
                    <select class="select-status" 
                            data-nama="${p.nama}" 
                            data-heat="${nomorHeat}" 
                            onchange="simpanKeSheet('${p.nama}', this)"
                            style="background:#2c3e50; color:white; border:1px solid #444; padding:8px; border-radius:6px; width:130px; min-width:130px; cursor:pointer; font-size:13px; outline:none;">
                        <option value="">-- Set --</option>
                        <option value="Lolos">🏆 Lolos</option>
                        <option value="Gugur">❌ Gugur</option>
                        <option value="Juara 1">🥇 Juara 1</option>
                        <option value="Juara 2">🥈 Juara 2</option>
                        <option value="Juara 3">🥉 Juara 3</option>
                    </select>
                </div>`;
        });

        html += `</div></div>`;
        container.innerHTML += html;
    });

    // Munculkan tombol publikasi di paling bawah
    const btnPub = document.getElementById("btnPublikasi");
    if(btnPub) {
        btnPub.style.display = "block";
        btnPub.style.width = "100%";
        btnPub.style.padding = "15px";
        btnPub.style.fontWeight = "bold";
    }
}
// 5. RENDER BOX HEAT (Unified Dark Mode)
function renderHeatBox(grup, nomor) {
    const container = document.getElementById("hasilBracket");
    let html = `
        <div class="heat-box" id="heat-${nomor}" style="background:#1e1e1e; border:1px solid #333; border-radius:12px; margin-bottom:20px; overflow:hidden;">
            <div style="background:#333; color:#f1c40f; padding:10px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                <span>HEAT ${nomor}</span>
            </div>
            <div style="padding:10px;">
    `;

    grup.forEach(p => {
        html += `
            <div class="player-row" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #2a2a2a;">
                <span style="color:white;">${p.nama} <small style="color:#888;">(${p.level})</small></span>
                <select class="select-status" data-nama="${p.nama}" data-heat="${nomor}" 
                        onchange="simpanKeSheet('${p.nama}', this)"
                        style="background:#2c3e50; color:white; border:1px solid #444; border-radius:4px; padding:4px;">
                    <option value="">-- Set --</option>
                    <option value="Lolos">🏆 Lolos</option>
                    <option value="Gugur">❌ Gugur</option>
                    <option value="Juara 1">🥇 Juara 1</option>
                    <option value="Juara 2">🥈 Juara 2</option>
                    <option value="Juara 3">🥉 Juara 3</option>
                </select>
            </div>`;
    });
}

// 6. FUNGSI SIMPAN & PUBLIKASI
function simpanKeSheet(nama, el) {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;
    const heat = el.getAttribute("data-heat");

    if (!el.value) return;
    el.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            type: "simpanJuara",
            lomba: lomba, kategori: kategori, nama: nama,
            status: `${el.value} - ${babak}`, heat: heat
        })
    }).then(() => {
        el.disabled = false;
        el.style.borderColor = "#27ae60";
    });
}

function kirimSatuHeat(nomorHeat) {
    const heatBox = document.getElementById(`heat-${nomorHeat}`);
    const semuaSelect = heatBox.querySelectorAll('.select-status');
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;

    let dataHeat = [];

    semuaSelect.forEach(select => {
        if (select.value !== "") {
            dataHeat.push({
                nama: select.getAttribute('data-nama'),
                status: `${select.value} - ${babak}`,
                heat: nomorHeat
            });
        }
    });

    if (dataHeat.length === 0) return alert("Pilih status dulu!");

    const btn = event.target;
    btn.innerText = "⏳ Sinkronisasi...";
    btn.disabled = true;

    // KIRIM SEKALI JALAN (Batch)
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            type: "batchSimpanJuara", // Kita buat fungsi baru di Apps Script
            lomba: lomba,
            kategori: kategori,
            data: dataHeat // Kirim array langsung
        })
    })
    .then(() => {
        alert(`Heat ${nomorHeat} Beres!`);
        btn.innerText = "✅ Tersimpan";
    })
    .catch(err => {
        console.error(err);
        btn.innerText = "Gagal!";
        btn.disabled = false;
    });
}
function publikasikanHeat() {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;

    if (!lomba || !kategori) return alert("Pilih Lomba & Kategori dulu brok!");

    const konfirmasi = confirm(`Publikasikan SEMUA Heat ${babak} ini ke Live Report?`);
    if (!konfirmasi) return;

    // Ambil semua dropdown status yang ada di layar
    const allSelects = document.querySelectorAll(".select-status"); 
    let payload = [];

    allSelects.forEach(sel => {
        // Kita kirim status "Menunggu" sebagai tanda jadwal sudah rilis
        payload.push({
            nama: sel.getAttribute("data-nama"),
            status: `Menunggu - ${babak}`,
            heat: sel.getAttribute("data-heat")
        });
    });

    if (payload.length === 0) return alert("Gak ada data peserta buat dipublikasi, brok!");

    // Kasih proteksi biar gak diklik dua kali
    const btn = document.getElementById("btnPublikasi");
    const teksAsli = btn.innerText;
    btn.innerText = "⏳ Memproses Publikasi...";
    btn.disabled = true;

    // KIRIM BATCH (SATU REQUEST UNTUK SEMUA)
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            type: "batchSimpanJuara", // Pastikan type ini ada di Code.gs
            lomba: lomba,
            kategori: kategori,
            data: payload 
        })
    })
    .then(() => {
        alert("Sakti! Semua jadwal Heat berhasil dipublikasikan tanpa ada yang ketinggalan.");
        btn.innerText = teksAsli;
        btn.disabled = false;
    })
    .catch(err => {
        console.error(err);
        alert("Aduh, gagal publikasi masal. Cek koneksi!");
        btn.disabled = false;
    });
}
document.addEventListener("DOMContentLoaded", updateLombaDropdown);
