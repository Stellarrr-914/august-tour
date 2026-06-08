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
                
                // Jalankan render utama
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
    if (!container) return;

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

            // LOGIKA FILTER KETAT:
            // 1. Harus mengandung kata babak tersebut
            // 2. Kalau nyari "Final", pastikan BUKAN "Semifinal"
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

    // 1. KUMPULKAN STATUS TERTINGGI PER PESERTA PER LOMBA
    dataSheet3.forEach(p => {
        const nama = p.nama ? p.nama.trim() : ""; // Bersihkan spasi gaib di nama
        const lomba = p.lomba || "";
        const kategori = p.kategori || "";
        const status = (p.status_babak || "").toLowerCase().trim(); 
        
        if (!nama) return; // Lewati hanya jika kolom nama di sheet bener-bener kosong

        const keyLomba = `${lomba}_${kategori}`;

        // PASTIKAN SEMUA NAMA YANG ADA DI DATABASE TERDAFTAR DULUAN
        if (!trackLombaPerOrang[nama]) {
            trackLombaPerOrang[nama] = {};
            statusJuaraGlobal[nama] = false;
        }

        // Jika baris database ada namanya tapi status_babak kosong/belum main, daftarkan status default
        if (!status) {
            if (!trackLombaPerOrang[nama]["default_key"]) {
                trackLombaPerOrang[nama]["default_key"] = "belum_tanding";
            }
            return;
        }

        const statusLama = trackLombaPerOrang[nama][keyLomba] || "";

        // HIERARKI STATUS LOMBA
        if (status.includes("juara")) {
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

    // 2. HITUNG POIN AKHIR BERDASARKAN STATUS TERTINGGI PER LOMBA
    const poinPerOrang = {};

    Object.keys(trackLombaPerOrang).forEach(nama => {
        poinPerOrang[nama] = 0;

        Object.keys(trackLombaPerOrang[nama]).forEach(keyLomba => {
            const statusTertinggi = trackLombaPerOrang[nama][keyLomba];

            // HITUNG POIN DENGAN MATEMATIKA PAKET FLAT
            if (statusTertinggi.includes("juara 1")) {
                poinPerOrang[nama] += (20 + 500);
            } 
            else if (statusTertinggi.includes("juara 2")) {
                poinPerOrang[nama] += (20 + 300);
            } 
            else if (statusTertinggi.includes("juara 3")) {
                poinPerOrang[nama] += (20 + 150);
            } 
            else if (statusTertinggi === "final_gugur" || statusTertinggi === "semifinal_lolos") {
                poinPerOrang[nama] += 20; 
            } 
            else if (statusTertinggi === "semifinal_gugur") {
                poinPerOrang[nama] += 20; 
            } 
            else if (statusTertinggi === "penyisihan_lolos") {
                poinPerOrang[nama] += 20; 
            } 
            else if (statusTertinggi === "penyisihan_gugur" || statusTertinggi === "belum_tanding") {
                poinPerOrang[nama] += 0; // Dipaksa masuk klasemen dengan 0 poin
            }
        });
    });

    // 3. MAPPING DAN SORTING (TOTAL ALL OUT DATA)
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
        const label = item.isWinner ? "🏅 PODIUM" : ""; // Kosongkan label default agar CSS display:none bekerja bersih
        html += `<tr class="${rowClass}">
                    <td>${index + 1}</td>
                    <td class="name-cell">${item.nama}</td>
                    <td><span class="status-tag">${label}</span></td>
                    <td class="points-cell">${item.poin}</td>
                </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}
// --- 4. RENDER WALL OF FAME (SELALU MUNCUL DI BAWAH) ---
function renderWallOfFame() {
    const wfContainer = document.getElementById("wallOfFameContainer");
    if (!wfContainer) return;

    const semuaJuara = dataSheet3.filter(p => 
        String(p.status_babak || "").toLowerCase().includes("juara")
    );

    if (semuaJuara.length === 0) {
        wfContainer.innerHTML = ""; 
        return;
    }

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
    wfContainer.innerHTML = htmlContent;
}

// Jalankan Fetch Pertama Kali
fetchLiveReport();
// Auto Refresh Tiap 10 Detik
setInterval(fetchLiveReport, 10000);
