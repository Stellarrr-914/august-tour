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

// 4. GENERATE HEAT (LOGIKA 4-3-5)
function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    let pesertaTerpilih = [];

    checkboxes.forEach(cb => {
        const dataAsli = dataPesertaCloud.find(p => p.nama === cb.value);
        if (dataAsli) pesertaTerpilih.push(dataAsli);
    });

    if (pesertaTerpilih.length < 3) return alert("Minimal 3 orang, brok!");

    // Seeding Level
    const bobot = { "A+": 9, "A": 8, "A-": 7, "B+": 6, "B": 5, "B-": 4, "C+": 3, "C": 2, "C-": 1 };
    pesertaTerpilih.sort((a, b) => (bobot[b.level] || 0) - (bobot[a.level] || 0) || Math.random() - 0.5);

    let total = pesertaTerpilih.length;
    let hasilGrup = [];
    let i = 0;

    while (i < total) {
        let sisa = total - i;
        let ukuranGrup = 4; 
        if (sisa === 5) ukuranGrup = 5;
        else if (sisa === 6 || sisa === 3) ukuranGrup = 3;
        hasilGrup.push(pesertaTerpilih.slice(i, i + ukuranGrup));
        i += ukuranGrup;
    }

    const container = document.getElementById("hasilBracket");
    container.innerHTML = ""; 
    window.currentHeatsData = []; 

    hasilGrup.forEach((grup, index) => {
        renderHeatBox(grup, index + 1);
    });

    document.getElementById("btnPublikasi").style.display = "block";
}

// 5. RENDER BOX HEAT (Unified Dark Mode)
function renderHeatBox(grup, nomor) {
    const container = document.getElementById("hasilBracket");
    let html = `
        <div class="heat-box" id="heat-${nomor}" style="background:#1e1e1e; border:1px solid #333; border-radius:12px; margin-bottom:20px; overflow:hidden;">
            <div style="background:#333; color:#f1c40f; padding:10px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                <span>HEAT ${nomor}</span>
                <button onclick="loloskanDuaTeratas(${nomor})" style="font-size:10px; padding:3px 8px; background:#2980b9;">Auto Lolos 2</button>
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

    html += `
        <button onclick="kirimSatuHeat(${nomor})" style="width:100%; margin-top:10px; background:#27ae60; font-size:12px; padding:8px;">Simpan Heat ${nomor}</button>
        </div></div>`;
    container.innerHTML += html;
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

function loloskanDuaTeratas(nomor) {
    const selects = document.querySelectorAll(`#heat-${nomor} .select-status`);
    selects.forEach((sel, idx) => {
        sel.value = (idx < 2) ? "Lolos" : "Gugur";
        sel.style.border = "2px solid #2980b9";
    });
}

function kirimSatuHeat(nomor) {
    const selects = document.querySelectorAll(`#heat-${nomor} .select-status`);
    const btn = event.target;
    btn.innerText = "⏳ Memproses...";
    
    let promises = Array.from(selects).filter(s => s.value !== "").map(s => {
        return fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                type: "simpanJuara",
                lomba: document.getElementById("lombaSelect").value,
                kategori: document.getElementById("kategoriSelect").value,
                nama: s.getAttribute("data-nama"),
                status: `${s.value} - ${document.getElementById("babakSelect").value}`,
                heat: nomor
            })
        });
    });

    Promise.all(promises).then(() => {
        alert(`Heat ${nomor} Berhasil Diupdate!`);
        btn.innerText = "✅ Selesai";
        btn.style.background = "#2ecc71";
    });
}

function publikasikanHeat() {
    const lomba = document.getElementById("lombaSelect").value;
    const babak = document.getElementById("babakSelect").value;
    if(!confirm(`Bikin status semua peserta jadi 'Menunggu - ${babak}'?`)) return;

    const selects = document.querySelectorAll(".select-status");
    let dataKirim = Array.from(selects).map(s => ({
        type: "simpanJuara",
        lomba: lomba,
        kategori: document.getElementById("kategoriSelect").value,
        nama: s.getAttribute("data-nama"),
        status: `Menunggu - ${babak}`,
        heat: s.getAttribute("data-heat")
    }));

    Promise.all(dataKirim.map(item => fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(item) })))
        .then(() => alert("Semua Peserta sudah tayang di Live Report!"));
}

document.addEventListener("DOMContentLoaded", updateLombaDropdown);
