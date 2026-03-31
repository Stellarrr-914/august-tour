// 1. KONFIGURASI URL
let dataSheet2 = []; 
let dataSheet3 = []; 
let scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 

function fetchLiveReport() {
    fetch(scriptURL + "?type=getLiveReportFull")
        .then(response => response.json())
        .then(data => {
            if (data && data.daftarLomba && data.rekapHasil) {
                dataSheet2 = data.daftarLomba; 
                dataSheet3 = data.rekapHasil; 
                renderLiveBracket(dataSheet2, dataSheet3);
                console.log("Data Berhasil Diperbarui:", new Date().toLocaleTimeString());
            }
        })
        .catch(err => console.error("Gagal update data:", err));
}

function renderLiveBracket(dataSheet2, dataSheet3) {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    if (!container) return;
    container.innerHTML = ""; 

    // 1. Ambil Lomba yang statusnya Aktif
    const statusAktif = ["on-going", "penyisihan", "semifinal", "final"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    if (daftarLombaAktif.length > 0) {
        // --- RENDER TAB ---
        const tabWrapper = document.createElement("div");
        tabWrapper.style = "display:flex; gap:10px; overflow-x:auto; padding:10px 5px; margin-bottom:20px; scrollbar-width:none;";

        if (!window.kategoriAktif) {
            window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
        }

        daftarLombaAktif.forEach(l => {
            const keyKat = `${l.nama_lomba}-${l.kategori}`;
            const btn = document.createElement("button");
            btn.innerText = `${l.nama_lomba} (${l.kategori})`;
            const isAktif = window.kategoriAktif === keyKat;
            btn.style = `padding:8px 15px; border-radius:20px; border:none; cursor:pointer; white-space:nowrap; font-weight:bold; 
                         background:${isAktif ? '#f1c40f' : '#2c3e50'}; color:${isAktif ? '#000' : '#fff'};`;

            btn.onclick = () => {
                window.kategoriAktif = keyKat;
                renderLiveBracket(dataSheet2, dataSheet3); 
            };
            tabWrapper.appendChild(btn);
        });
        container.appendChild(tabWrapper);

        const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
        titleDisplay.innerText = ` LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

        // --- FILTER STRICT (BIAR GAK SALAH KAMAR) ---
        const rekapAktif = dataSheet3.filter(p => {
            const lombaS3 = (p.lomba || "").toString().toLowerCase().trim();
            const katS3 = (p.kategori || "").toString().toLowerCase().trim();
            const lombaTampil = (matchTampil.nama_lomba || "").toString().toLowerCase().trim();
            const katTampil = (matchTampil.kategori || "").toString().toLowerCase().trim();
            return lombaS3 === lombaTampil && katS3 === katTampil;
        });

        console.log("Data ditemukan untuk " + matchTampil.nama_lomba + ":", rekapAktif.length, "orang");

        const daftarBabak = ["Penyisihan", "Semifinal", "Final"];
        daftarBabak.forEach(namaBabak => {
            const section = document.createElement("div");
            section.className = "babak-section";
            
            // Filter per babak
            const dataPerBabak = rekapAktif.filter(player => {
                if (!player.status_babak) return false;
                return player.status_babak.toLowerCase().includes(namaBabak.toLowerCase());
            });

            if (dataPerBabak.length > 0) {
                section.innerHTML = `<h2 style="color:#f1c40f; border-left:4px solid #f1c40f; padding-left:10px; margin-top:20px;">${namaBabak.toUpperCase()}</h2>`;
                
                const groupHeat = {};
                dataPerBabak.forEach(p => {
                    const noHeat = p.nomor_heat || "1"; 
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });
                
                Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                    let htmlHeat = `<div style="margin-bottom:15px; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px;">
                                    <div style="font-weight:bold; color:#888; font-size:0.9em; margin-bottom:8px;">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].forEach(player => {
                        const s = player.status_babak.toLowerCase();
                        let badge = '<span style="background:#444; padding:2px 8px; border-radius:4px; font-size:0.8em; color:#fff;">READY</span>';
                        if (s.includes("lolos")) badge = '<span style="background:#27ae60; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.8em;">LOLOS ➔</span>';
                        else if (s.includes("gugur")) badge = '<span style="background:#c0392b; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.8em;">GUGUR</span>';
                        else if (s.includes("juara")) badge = `<span style="background:#f1c40f; color:#000; padding:2px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">🏆 ${s.toUpperCase()}</span>`;

                        htmlHeat += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">
                                        <span style="color:#eee;">${player.nama}</span>
                                        ${badge}
                                     </div>`;
                    });
                    section.innerHTML += htmlHeat + `</div>`;
                });
                container.appendChild(section);
            }
        });
    } else {
        // --- MODE LEADERBOARD ---
        titleDisplay.innerText = `🏆 KLASEMEN SEMENTARA`;
        const dataPoin = generateLeaderboard(dataSheet3); 
        let htmlLeaderboard = `<div style="width:100%">`;
        dataPoin.forEach((p, index) => {
            htmlLeaderboard += `
                <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:8px;">
                    <span style="color:#fff;"><strong>#${index + 1}</strong> ${p.nama} ${p.isZonk ? '(Zonk)' : '⭐'}</span>
                    <span style="font-weight:bold; color:#f1c40f;">${p.totalPoin} Pts</span>
                </div>`;
        });
        container.innerHTML = htmlLeaderboard + `</div>`;
    }
}

// FUNGSI POIN & REKAP (Tetap sama namun pastikan key kecil semua)
function generateLeaderboard(rekapHasil) {
    let leaderboard = {};
    rekapHasil.forEach(row => {
        const nama = row.nama;
        const status = (row.status_babak || "").toLowerCase();
        if (!nama) return;
        if (!leaderboard[nama]) leaderboard[nama] = { nama: nama, totalPoin: 0, isZonk: true };
        if (status.includes("juara")) { leaderboard[nama].totalPoin += 100; leaderboard[nama].isZonk = false; }
        else if (status.includes("final")) leaderboard[nama].totalPoin += 10;
        else if (status.includes("semifinal")) leaderboard[nama].totalPoin += 5;
        else if (status.includes("lolos") || status.includes("gugur")) leaderboard[nama].totalPoin += 2;
    });
    return Object.values(leaderboard).sort((a, b) => b.totalPoin - a.totalPoin);
}

function showRekapJuara() {
    const list = document.getElementById("rekapList");
    const modal = document.getElementById("rekapModal");
    if (!list || !modal) return;
    modal.style.display = "flex";
    const daftarJuara = dataSheet3.filter(p => {
        const s = (p.status_babak || "").toLowerCase();
        return s.includes("juara 1") || s.includes("juara 2") || s.includes("juara 3");
    });
    if (daftarJuara.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color:#999;">🏁<p>Belum ada pemenang, brok!</p></div>`;
        return;
    }
    let html = "";
    daftarJuara.forEach(p => {
        html += `<div style="padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:8px; color:#fff;">
                    <strong>${p.nama}</strong> - ${p.lomba} (${p.status_babak})
                 </div>`;
    });
    list.innerHTML = html;
}

function closeRekapJuara() { document.getElementById("rekapModal").style.display = "none"; }

fetchLiveReport();
setInterval(fetchLiveReport, 10000);
