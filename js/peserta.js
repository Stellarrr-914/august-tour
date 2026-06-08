// URL API dari Google Apps Script lu
const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

// FUNGSI CEK: Apakah ini kategori Ibu-ibu?
// Mengembalikan true jika kategori diawali huruf M atau I
function cekKategoriIbu(kat) {
    const k = String(kat).toUpperCase();
    return k.startsWith("M") || k.startsWith("I");
}

async function tambahPeserta() {
    const inputField = document.getElementById("inputPeserta");
    const value = inputField.value.trim();
    const parts = value.split(",");

    if (parts.length !== 3) {
        alert("Format: Nama, Kategori, Level\nContoh: Budi, 1, A atau Susi, M1, 1");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim().toUpperCase(); 
    const level = parts[2].trim().toUpperCase();

    try {
        inputField.disabled = true;
        await fetch(urlAPI, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ nama, kategori, level })
        });

        databaseAnak.push({ nama, kategori, level });
        tampilSemuaTabel();
        
        inputField.value = "";
        inputField.disabled = false;
        alert("Berhasil menambah: " + nama);
    } catch (e) {
        alert("Gagal konek server!");
        inputField.disabled = false;
    }
}

function tampilSemuaTabel() {
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");

    if (!tabelAnak || !tabelIbu) return;

    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";

    let noAnak = 1;
    let noIbu = 1;

    databaseAnak.forEach(p => {
        const isIbu = cekKategoriIbu(p.kategori);
        
        // SUNTIKAN ONCLICK: Nama dipasang trigger klik pop-up detail progres
        const row = `<tr>
            <td>${isIbu ? noIbu++ : noAnak++}</td>
            <td class="nama-klik" onclick="bukaDetailPeserta('${p.nama}', '${p.kategori}', '${p.level}')"><strong>${p.nama}</strong> 🔍</td>
            <td>${p.kategori}</td>
            <td>${p.level}</td>
        </tr>`;

        if (isIbu) {
            tabelIbu.innerHTML += row;
        } else {
            tabelAnak.innerHTML += row;
        }
    });
}

function cariPeserta() {
    const input = document.getElementById("inputPeserta").value.trim().toUpperCase();
    if (input === "") {
        tampilSemuaTabel();
        return;
    }

    const kataKunci = input.split(" ");
    const hasil = databaseAnak.filter(p => {
        return kataKunci.every(k => 
            p.nama.toUpperCase().includes(k) || 
            p.kategori.toString().toUpperCase() === k || 
            p.level.toUpperCase() === k
        );
    });

    renderHasilCari(hasil);
}

function renderHasilCari(hasil) {
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");
    if (!tabelAnak || !tabelIbu) return;
    
    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";
    
    let noAnak = 1; 
    let noIbu = 1;
    
    hasil.forEach(p => {
        const isIbu = cekKategoriIbu(p.kategori);
        
        // SUNTIKAN ONCLICK JUGA DI HASIL PENCARIAN
        const row = `<tr>
            <td>${isIbu ? noIbu++ : noAnak++}</td>
            <td class="nama-klik" onclick="bukaDetailPeserta('${p.nama}', '${p.kategori}', '${p.level}')"><strong>${p.nama}</strong> 🔍</td>
            <td>${p.kategori}</td>
            <td>${p.level}</td>
        </tr>`;
        
        if (isIbu) tabelIbu.innerHTML += row;
        else tabelAnak.innerHTML += row;
    });
}

// ==========================================================================
// 🔥 CORE BARU: LOGIKA MODAL DETAIL POP-UP PROGRES POIN & BUKTI PROTES
// ==========================================================================
function bukaDetailPeserta(nama, kategori, level) {
    const modal = document.getElementById("modalPeserta");
    const container = document.querySelector(".modal-body-detail");
    const namaClean = nama.trim();

    let totalPoin = 0;
    let htmlRiwayat = "";

    // Kalkulasi Riwayat Real-time dari dataSheet3 (Database Live Pertandingan)
    if (typeof dataSheet3 !== "undefined" && dataSheet3) {
        const riwayatLomba = dataSheet3.filter(row => (row.nama || "").trim() === namaClean);

        riwayatLomba.forEach(row => {
            const status = (row.status_babak || "").toLowerCase().trim();
            const namaLomba = `${row.lomba || ""} ${row.kategori || ""}`.trim();
            let poinLomba = 0;
            let badgeStyle = "badge-lose";
            let labelStatus = status;

            // Logika Matematika Paket Flat Turnamen Lo
            if (status.includes("diskualifikasi")) {
                poinLomba = 0;
                badgeStyle = "badge-dq-modal";
                labelStatus = "Diskualifikasi 🏃💨";
            } else if (status.includes("juara 1")) {
                poinLomba = 520; badgeStyle = "badge-win-modal"; labelStatus = "Juara 1 🥇";
            } else if (status.includes("juara 2")) {
                poinLomba = 320; badgeStyle = "badge-win-modal"; labelStatus = "Juara 2 🥈";
            } else if (status.includes("juara 3")) {
                poinLomba = 170; badgeStyle = "badge-win-modal"; labelStatus = "Juara 3 🥉";
            } else if (status === "final_gugur" || status === "semifinal_lolos" || status === "semifinal_gugur" || status === "penyisihan_lolos") {
                poinLomba = 20; badgeStyle = "badge-process-modal"; labelStatus = "Partisipasi Babak 📋";
            }

            if (status && !status.includes("belum_tanding")) {
                totalPoin += poinLomba;
                htmlRiwayat += `
                    <div class="log-item">
                        <span class="log-lomba">${namaLomba}</span>
                        <span class="log-status ${badgeStyle}">${labelStatus}</span>
                        <span class="log-poin">+${poinLomba} Poin</span>
                    </div>`;
            }
        });
    }

    if (htmlRiwayat === "") {
        htmlRiwayat = `<p style="color:#9ca3af; text-align:center; padding: 15px 0;">Belum mengikuti perlombaan / poin kosong.</p>`;
    }

    // Render Template Detail Modal ke Layar Admin
    container.innerHTML = `
        <div class="profile-header">
            <div class="avatar-bocil">👦</div>
            <h2>${nama}</h2>
            <p style="margin: 5px 0; color: #666;">Kategori: ${kategori} | Level: ${level}</p>
            <div class="total-poin-box">${totalPoin} <span>TOTAL POIN KLASEMEN</span></div>
        </div>
        <h3 style="margin-top: 20px; font-size: 16px; color: var(--secondary);">📊 PROGRES & BUKTI RIWAYAT</h3>
        <div class="log-container">
            ${htmlRiwayat}
        </div>
    `;

    modal.style.display = "flex"; 
}

// FUNGSI UTILITY: Tutup Pop-up Modal
function tutupModal() {
    document.getElementById("modalPeserta").style.display = "none";
}

// FUNGSI UTILITY: Switcher Tab Pindahan dari HTML
function switchDatabaseTab(evt, tabId) {
    const contents = document.getElementsByClassName("db-tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.remove("active-content");
    }

    const buttons = document.getElementsByClassName("db-tab-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    document.getElementById(tabId).classList.add("active-content");
    evt.currentTarget.classList.add("active");
}
