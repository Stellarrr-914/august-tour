const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 
let dataSheet2 = []; 
let dataSheet3 = []; 
window.kategoriAktif = window.kategoriAktif || null;

// --- 1. FETCH DATA (ANTI-MACET) ---
function fetchLiveReport() {
    fetch(`${scriptURL}?type=getLiveReportFull`)
        .then(res => res.json())
        .then(data => {
            if (data && data.daftarLomba && data.rekapHasil) {
                dataSheet2 = data.daftarLomba; 
                dataSheet3 = data.rekapHasil; 
                
                // Jalankan render utama (Klasemen / Bracket)
                renderLiveBracket();
                // Jalankan Wall of Fame secara mandiri
                renderWallOfFame();
            }
        })
        .catch(err => console.error("Gagal update data:", err));
}

// --- 2. RENDER AREA DINAMIS (BRACKET ATAU LEADERBOARD) ---
function renderLiveBracket() {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    
    // 🔥 BIAR AMAN: Kalau gak ada elemen ini (berarti lagi di database.html), skip render bracket tapi jangan mogok!
    if (!container || !titleDisplay) return;

    // Filter lomba yang statusnya 'on-going'
    const statusAktif = ["on-going"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    // JIKA GAK ADA LOMBA JALAN -> TAMPILIN LEADERBOARD
    if (daftarLombaAktif.length === 0) {
        renderLeaderboard(container, titleDisplay);
        return;
    }

    container.innerHTML = ""; 

    // --- TAB NAVIGASI ---
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "tab-wrapper"; 
    tabWrapper.style.display = "flex";
    tabWrapper.style.gap = "10px";
    tabWrapper.style.marginBottom = "20px";
    tabWrapper.style.overflowX = "auto";
    tabWrapper.style.padding = "10px 0";

    if (!window.kategoriAktif || !daftarLombaAktif.some(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif)) {
        window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
    }

    daftarLombaAktif.forEach(l => {
        const keyKat = `${l.nama_lomba}-${l.kategori}`;
        const btn = document.createElement("button");
        btn.innerText = `${l.nama_lomba} (${l.kategori})`;
        btn.className = (window.kategoriAktif === keyKat) ? "tab-btn active" : "tab-btn";
        btn.style.whiteSpace = "nowrap";
        
        btn.onclick = () => {
            window.kategoriAktif = keyKat;
            renderLiveBracket(); 
        };
        tabWrapper.appendChild(btn);
    });
    container.appendChild(tabWrapper);

    const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
    titleDisplay.innerHTML = `<span class="live-indicator"></span> LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

    const rekapAktif = dataSheet3.filter(p => {
        const lS3 = String(p.lomba || "").toLowerCase().trim();
        const kS3 = String(p.kategori || "").toLowerCase().trim();
        const lT = String(matchTampil.nama_lomba || "").toLowerCase().trim();
        const kT = String(matchTampil.kategori || "").toLowerCase().trim();
        return lS3 === lT && kS3 === kT;
    });

    ["Penyisihan", "Semifinal", "Final"].forEach(namaBabak => {
        const dataPerBabak = rekapAktif.filter(p => {
            let stat = String(p.status_babak || "").toLowerCase().trim();
            let babakCari = namaBabak.toLowerCase();

            if (babakCari === "final") {
                return stat.includes("final") && !stat.includes("semi");
            } else {
                return stat.includes(babakCari);
            }
        });

        if (dataPerBabak.length > 0) {
            const babakDiv = document.createElement("div");
            babakDiv.className = "babak-section";
            babakDiv.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;
            
            const groupHeat = {};
            dataPerBabak.forEach(p => {
                const noHeat = p.nomor_heat || "1";
                if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                groupHeat[noHeat].push(p);
            });

            const gridHeat = document.createElement("div");
            gridHeat.className = "heat-grid-container";

            Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                let htmlHeat = `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                
                groupHeat[noHeat].forEach(player => {
                    const s = (player.status_babak || "").toLowerCase();
                    let statusClass = "badge-wait";
                    let label = "READY";

                    if (s.includes("lolos")) { statusClass = "badge-next"; label = "LOLOS ➔"; }
                    else if (s.includes("gugur")) { statusClass = "badge-lose"; label = "GUGUR"; }
                    else if (s.includes("juara")) { statusClass = "badge-next"; label = "🏆 " + s.split('-')[0].trim().toUpperCase(); }
                    else if (s.includes("menunggu")) { statusClass = "badge-wait"; label = "ON FIRE 🔥"; }

                    htmlHeat += `<div class="player-row">
                                    <span class="player-name">${player.nama}</span>
                                    <span class="badge ${statusClass}">${label}</span>
                                 </div>`;
                });
                htmlHeat += `</div>`;
                gridHeat.innerHTML += htmlHeat;
            });
            babakDiv.appendChild(gridHeat);
            container.appendChild(babakDiv);
        }
    });
}

function renderLeaderboard(container, title) {
    title.innerHTML = `🏆 KLASEMEN POIN TERTINGGI`;
    container.innerHTML = ""; 

    const trackLombaPerOrang = {};
    const statusJuaraGlobal = {};

    dataSheet3.forEach(p => {
        const nama = p.nama ? p.nama.trim() : ""; 
        const lomba = p.lomba || "";
        const kategori = p.kategori || "";
        const status = (p.status_babak || "").toLowerCase().trim(); 
        
        if (!nama) return; 

        const keyLomba = `${lomba}_${kategori}`;

        if (!trackLombaPerOrang[nama]) {
            trackLombaPerOrang[nama] = {};
            statusJuaraGlobal[nama] = false;
        }

        if (!status) {
            if (!trackLombaPerOrang[nama]["default_key"]) {
                trackLombaPerOrang[nama]["default_key"] = "belum_tanding";
            }
            return;
        }

        const statusLama = trackLombaPerOrang[nama][keyLomba] || "";

        if (status.includes("diskualifikasi")) {
            trackLombaPerOrang[nama][keyLomba] = "diskualifikasi";
        }
        else if (status.includes("juara")) {
            trackLombaPerOrang[nama][keyLomba] = status; 
            statusJuaraGlobal[nama] = true;
        } 
        else if (status === "gugur - final" && !statusLama.includes("juara")) {
            trackLombaPerOrang[nama][keyLomba] = "final_gugur";
        } 
        else if (status === "lolos - semifinal" && !statusLama.includes("juara") && statusLama !== "final_gugur") {
            trackLombaPerOrang[nama][keyLomba] = "semifinal_lolos";
        } 
        else if (status === "gugur - semifinal" && !statusLama.includes("juara") && statusLama !== "final_gugur" && statusLama !== "semifinal_lolos") {
            trackLombaPerOrang[nama][keyLomba] = "semifinal_gugur";
        } 
        else if (status === "lolos - penyisihan" && !trackLombaPerOrang[nama][keyLomba]) {
            trackLombaPerOrang[nama][keyLomba] = "penyisihan_lolos";
        }
        else if (status === "gugur - penyisihan" && !trackLombaPerOrang[nama][keyLomba]) {
            trackLombaPerOrang[nama][keyLomba] = "penyisihan_gugur";
        }
    });

    const poinPerOrang = {};

    Object.keys(trackLombaPerOrang).forEach(nama => {
        poinPerOrang[nama] = 0;

        Object.keys(trackLombaPerOrang[nama]).forEach(keyLomba => {
            const statusTertinggi = trackLombaPerOrang[nama][keyLomba];

            if (statusTertinggi === "diskualifikasi") poinPerOrang[nama] += 0; 
            else if (statusTertinggi.includes("juara 1")) poinPerOrang[nama] += 520; 
            else if (statusTertinggi.includes("juara 2")) poinPerOrang[nama] += 320; 
            else if (statusTertinggi.includes("juara 3")) poinPerOrang[nama] += 170; 
            else if (statusTertinggi === "final_gugur" || statusTertinggi === "semifinal_lolos") poinPerOrang[nama] += 20; 
            else if (statusTertinggi === "semifinal_gugur") poinPerOrang[nama] += 20; 
            else if (statusTertinggi === "penyisihan_lolos") poinPerOrang[nama] += 20; 
            else if (statusTertinggi === "penyisihan_gugur" || statusTertinggi === "belum_tanding") poinPerOrang[nama] += 0; 
        });
    });

    const sortedData = Object.keys(poinPerOrang)
        .map(nama => ({
            nama: nama,
            poin: poinPerOrang[nama],
            isWinner: statusJuaraGlobal[nama]
        }))
        .sort((a, b) => b.poin - a.poin);

    let html = `<div class="leaderboard-container"><table class="lboard-table">
                <thead><tr><th>RANK</th><th>NAMA</th><th>STATUS</th><th>POIN</th></tr></thead><tbody>`;

    sortedData.forEach((item, index) => {
    const rowClass = item.isWinner ? "row-winner" : "";
    const label = item.isWinner ? "🏅 PODIUM" : ""; 
    
    // 🔥 Inline style warna biru dihapus, sekarang murni dikontrol class 'name-cell' lewat CSS di atas
    html += `<tr class="${rowClass}">
                <td>${index + 1}</td>
                <td class="name-cell" onclick="bukaPopUpLive('${item.nama}', '', '${item.poin}', ${item.isWinner})">
                    ${item.nama}
                </td>
                <td><span class="status-tag">${label}</span></td>
                <td class="points-cell">${item.poin}</td>
            </tr>`;
});

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// --- 3. RENDER WALL OF FAME (DENGAN FIX OVERFLOW/APPEND) ---
function renderWallOfFame() {
    const wfContainer = document.getElementById("wallOfFameContainer");
    if (!wfContainer) return;

    // 🔥 KOSONGKAN CONTAINER TERLEBIH DAHULU BIAR GAK BERANAK PAS REFRESH!
    wfContainer.innerHTML = "";

    const semuaJuara = dataSheet3.filter(p => 
        String(p.status_babak || "").toLowerCase().includes("juara")
    );

    if (semuaJuara.length === 0) return;

    const groupedJuara = {};
    semuaJuara.forEach(j => {
        const key = `${j.lomba} - ${j.kategori}`;
        if (!groupedJuara[key]) groupedJuara[key] = [];
        groupedJuara[key].push(j);
    });

    let htmlContent = `
        <div class="hall-of-fame-wrapper">
            <h1 class="main-title-juara">🏆 REKAP PEMENANG 🏆</h1>
            <div class="hall-of-fame-grid">
    `;

    Object.keys(groupedJuara).forEach(lombaKat => {
        htmlContent += `<div class="box-juara"><div class="box-header">${lombaKat.toUpperCase()}</div><div class="box-body">`;
        
        groupedJuara[lombaKat].sort((a, b) => a.status_babak.localeCompare(b.status_babak)).forEach(p => {
            const rank = p.status_babak.split('-')[0].trim().toUpperCase();
            htmlContent += `<div class="winner-row">
                                <span class="winner-rank">${rank}</span>
                                <span class="winner-name">${p.nama}</span>
                            </div>`;
        });
        htmlContent += `</div></div>`;
    });

    htmlContent += `</div></div>`;
    wfContainer.innerHTML = htmlContent; // 🔥 Pakai innerHTML langsung biar nge-replace, bukan appendChild.
}

function bukaPopUpLive(nama, logBuktiMentah, totalPoin) {
    const modal = document.getElementById("modalPeserta");
    const container = document.querySelector(".modal-body-detail");
    if(!modal || !container) return;
    
    const namaClean = String(nama).trim();
    let htmlRiwayat = "";
    
    if (typeof dataSheet3 !== "undefined" && dataSheet3.length > 0) {
        // 1. Ambil semua riwayat milik si anak
        const riwayatAnak = dataSheet3.filter(p => String(p.nama || "").trim() === namaClean);
        
        // 🧠 2. LOGIKA FILTER: Cari babak tertinggi untuk setiap lomba unik
        const babakTertinggiPerLomba = {};

        riwayatAnak.forEach(row => {
            const s = String(row.status_babak || "").toLowerCase().trim();
            if(!s || s.includes("belum_tanding")) return;

            const lombaNama = `${row.lomba || ""} (${row.kategori || ""})`;
            
            // Tentukan tingkatan bobot babak (semakin tinggi angkanya, semakin final babaknya)
            let bobotBabak = 1; // Default penyisihan / lolos biasa
            if (s.includes("gugur")) bobotBabak = 0;
            if (s.includes("diskualifikasi")) bobotBabak = -1;
            if (s.includes("semifinal")) bobotBabak = 2;
            if (s.includes("juara 3")) bobotBabak = 3;
            if (s.includes("juara 2")) bobotBabak = 4;
            if (s.includes("juara 1")) bobotBabak = 5;

            // Simpan baris data yang memiliki bobot tertinggi saja untuk lomba tersebut
            if (!babakTertinggiPerLomba[lombaNama] || bobotBabak > babakTertinggiPerLomba[lombaNama].bobot) {
                babakTertinggiPerLomba[lombaNama] = {
                    data: row,
                    bobot: bobotBabak
                };
            }
        });

        // 3. Render baris-baris data tertinggi yang sudah difilter tadi ke HTML
for (const namaLombaUnique in babakTertinggiPerLomba) {
    const row = babakTertinggiPerLomba[namaLombaUnique].data;
    const s = String(row.status_babak || "").toLowerCase().trim();
            
            let badgeStyle = "badge-process-modal";
            let labelPoin = "+20 Poin";
            let labelStatus = row.status_babak;

            if (s.includes("diskualifikasi")) {
                badgeStyle = "badge-dq-modal"; labelPoin = "+0 Poin"; labelStatus = "Diskualifikasi ❌";
            } else if (s.includes("juara 1")) {
                badgeStyle = "badge-win-modal"; labelPoin = "+520 Poin"; labelStatus = "Juara 1 🥇";
            } else if (s.includes("juara 2")) {
                badgeStyle = "badge-win-modal"; labelPoin = "+320 Poin"; labelStatus = "Juara 2 🥈";
            } else if (s.includes("juara 3")) {
                badgeStyle = "badge-win-modal"; labelPoin = "+170 Poin"; labelStatus = "Juara 3 🥉";
            } else if (s.includes("gugur - penyisihan")) {
                badgeStyle = "badge-lose"; labelPoin = "+0 Poin"; labelStatus = "Gugur Penyisihan 🍂";
            } else if (s.includes("semifinal")) {
                // Jika di database lu status babaknya tertulis "Lolos - Semifinal" dengan poin tetap +20
                badgeStyle = "badge-process-modal"; labelPoin = "+20 Poin";
            }

            htmlRiwayat += `
                <div class="log-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 5px; border-bottom:1px solid #222; font-size:14px;">
                    <span style="font-weight:500; color:#e2e8f0;">${namaLombaUnique}</span>
                    <span class="badge ${badgeStyle}" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:bold;">${labelStatus.toUpperCase()}</span>
                    <span style="color:#10b981; font-weight:bold; text-shadow: 0 0 8px rgba(16,185,129,0.3);">${labelPoin}</span>
                </div>`;
        }
    }

    if (htmlRiwayat === "") {
        htmlRiwayat = `<p style="color:#6b7280; text-align:center; padding: 15px 0;">Belum ada riwayat tanding aktif.</p>`;
    }

    // 4. Render output ke dalam modal popup (Total Poin Live bawaan tetap utuh & benar)
    container.innerHTML = `

        <div class="profile-header" style="text-align:center; padding-bottom:15px; border-bottom:2px dashed #222;">

            <h2 style="margin:5px 0; font-size:22px; color:#ffffff; font-weight:800;">${namaClean}</h2>

            <div class="total-poin-box">

                ${totalPoin} <span style="font-size:11px; color:#f8fafc; display:block; font-weight:normal; margin-top:2px; opacity:0.8;">TOTAL POIN LIVE</span>

            </div>

        </div>

        <h3 style="margin-top:20px; font-size:13px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">📊 PROGRES & BUKTI RIWAYAT (PENCAPAIAN TERTINGGI)</h3>

        <div class="log-container" style="max-height:220px; overflow-y:auto; margin-top:10px;">${htmlRiwayat}</div>

    `;

    modal.style.display = "flex";

}

// Jalankan Fetch Pertama Kali
fetchLiveReport();
// Auto Refresh Tiap 10 Detik
setInterval(fetchLiveReport, 10000);
