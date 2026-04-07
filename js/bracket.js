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

            const namaUnik = [...new Set(data.map(l => l.nama))];
            select.innerHTML = '<option value="">-- Pilih Lomba --</option>';
            namaUnik.forEach(namaLomba => {
                const opt = document.createElement("option");
                opt.value = namaLomba;
                opt.textContent = namaLomba;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error("Gagal load lomba:", err));
}

// 2. LOAD KATEGORI BERDASARKAN LOMBA
function updateKategoriBerdasarkanLomba() {
    const lombaVal = document.getElementById("lombaSelect").value;
    const katSelect = document.getElementById("kategoriSelect");
    if (!katSelect) return;

    const semuaBarisLomba = listLombaFull.filter(l => l.nama === lombaVal);
    if (semuaBarisLomba.length === 0) {
        katSelect.innerHTML = '<option value="">-- Pilih Lomba Dulu --</option>';
        return;
    }

    let semuaKategori = [];
    semuaBarisLomba.forEach(l => {
        if (l.kategori) {
            const splitKat = l.kategori.split(';').map(k => k.trim().toUpperCase());
            semuaKategori = semuaKategori.concat(splitKat);
        }
    });

    const kategoriUnik = [...new Set(semuaKategori)];
    katSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kategoriUnik.forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = "Kategori " + k;
        katSelect.appendChild(opt);
    });
}

// 3. TAMPILKAN PESERTA
function tampilkanPesertaBracket() {
    const kat = document.getElementById("kategoriSelect").value;
    const lomba = document.getElementById("lombaSelect").value;
    const babak = document.getElementById("babakSelect").value;
    const container = document.getElementById("pesertaLomba");

    if (!kat || !lomba) return alert("Pilih Lomba & Kategori dulu ya brok!");

    container.innerHTML = "<div class='loading-text'>⏳ Sedang menyaring peserta...</div>";

    let fetchURL = (babak === "Penyisihan") 
        ? `${scriptURL}?type=getPesertaByKategori&kategori=${encodeURIComponent(kat)}`
        : `${scriptURL}?type=getPesertaLolos&kategori=${encodeURIComponent(kat)}&lomba=${encodeURIComponent(lomba)}&babak=${encodeURIComponent(babak)}`;

    fetch(fetchURL)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            dataPesertaCloud = data; 
            container.innerHTML = "";
            
            if (data.length === 0) {
                container.innerHTML = `<div class='alert-empty'><b>Data Kosong!</b><br>Tidak ada peserta ditemukan.</div>`;
                document.getElementById("actionGenerate").style.display = "none";
                return;
            }

            let htmlList = `<div class='list-title'>Peserta Siap Tanding (${data.length} Orang):</div>`;
            data.forEach((p, index) => {
                htmlList += `
                <div class="peserta-selection-item">
                    <input type="checkbox" class="peserta-check" id="check-${index}" value="${p.nama}" checked>
                    <label for="check-${index}">
                        <strong>${p.nama}</strong> <small>${p.level ? '('+p.level+')' : ''}</small>
                    </label>
                </div>`;
            });

            container.innerHTML = htmlList;
            document.getElementById("actionGenerate").style.display = "block";
        })
        .catch(err => {
            container.innerHTML = "<div class='alert-error'>❌ Gagal narik data server!</div>";
        });
}

// 4. GENERATE HEAT
function generateBracket() {
    const checkboxes = document.querySelectorAll(".peserta-check:checked");
    let pesertaTerpilih = [];

    checkboxes.forEach(cb => {
        const dataAsli = dataPesertaCloud.find(p => p.nama === cb.value);
        if (dataAsli) pesertaTerpilih.push(dataAsli);
    });

    if (pesertaTerpilih.length < 3) return alert("Minimal 3 orang buat bikin Heat, brok!");

    // Urutkan (Seeding)
    const bobot = { "A+": 9, "A": 8, "A-": 7, "B+": 6, "B": 5, "B-": 4, "C+": 3, "C": 2, "C-": 1 };
    pesertaTerpilih.sort((a, b) => (bobot[b.level] || 0) - (bobot[a.level] || 0) || Math.random() - 0.5);

    // Pembagian Grup
    let total = pesertaTerpilih.length;
    let hasilGrup = [];
    let i = 0;
    while (i < total) {
        let sisa = total - i;
        let ukuranGrup = (sisa === 5) ? 5 : (sisa === 6 || sisa === 3) ? 3 : 4;
        hasilGrup.push(pesertaTerpilih.slice(i, i + ukuranGrup));
        i += ukuranGrup;
    }

    // Render Heat Box
    const container = document.getElementById("hasilBracket");
    container.innerHTML = ""; 
    
    hasilGrup.forEach((grup, index) => {
        const nomorHeat = index + 1;
        let html = `
            <div class="heat-box" id="heat-${nomorHeat}">
                <div class="heat-header">HEAT ${nomorHeat}</div>
                <div class="heat-body">
        `;

        grup.forEach(p => {
            html += `
                <div class="heat-player-row">
                    <span class="player-info">
                        <strong>${p.nama}</strong> 
                        <small>Level: ${p.level || '-'}</small>
                    </span>
                    <select class="select-status" 
                            data-nama="${p.nama}" 
                            data-heat="${nomorHeat}" 
                            onchange="simpanKeSheet('${p.nama}', this)">
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

    const btnPub = document.getElementById("btnPublikasi");
    if(btnPub) btnPub.style.display = "block";
}

// 5. SIMPAN KE SERVER
function simpanKeSheet(nama, el) {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;
    const heat = el.getAttribute("data-heat");

    if (!el.value) return;
    el.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            type: "simpanJuara",
            lomba: lomba,
            kategori: kategori,
            nama: nama,
            status: `${el.value} - ${babak}`,
            heat: heat
        })
    })
    .then(res => res.text())
    .then(txt => {
        el.disabled = false;
        el.classList.add('is-saved'); // Class buat kasih border hijau di CSS
    })
    .catch(err => {
        el.disabled = false;
        alert("Gagal koneksi server!");
    });
}

// 6. PUBLIKASI MASSAL
function publikasikanHeat() {
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const babak = document.getElementById("babakSelect").value;

    if (!lomba || !kategori) return alert("Pilih Lomba & Kategori dulu!");

    const konfirmasi = confirm(`Publikasikan SEMUA Heat ${babak} ini ke Live Report?`);
    if (!konfirmasi) return;

    const allSelects = document.querySelectorAll(".select-status"); 
    let payload = [];

    allSelects.forEach(sel => {
        payload.push({
            nama: sel.getAttribute("data-nama"),
            status: `Menunggu - ${babak}`,
            heat: sel.getAttribute("data-heat")
        });
    });

    if (payload.length === 0) return alert("Gak ada data!");

    const btn = document.getElementById("btnPublikasi");
    btn.disabled = true;
    btn.innerText = "⏳ Memproses...";

    fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            type: "batchSimpanJuara",
            lomba: lomba,
            kategori: kategori,
            data: payload 
        })
    })
    .then(res => res.text())
    .then(txt => {
        alert(txt);
        btn.disabled = false;
        btn.innerText = "✅ Selesai";
    })
    .catch(err => {
        btn.disabled = false;
        alert("Gagal!");
    });
}

document.addEventListener("DOMContentLoaded", updateLombaDropdown);
