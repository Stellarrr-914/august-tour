// Menggunakan URL yang sama dengan yang ada di bracket.js lo
const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec";

// Fungsi untuk ambil data dari Cloud
function fetchLiveReport() {
    fetch(scriptURL + "?type=getLiveReportFull")
        .then(response => response.json())
        .then(data => {
            if (data && data.rekap) {
                renderLiveBracket(data.rekap);
            }
        })
        .catch(err => console.error("Gagal update data:", err));
}

function renderLiveBracket(dataSheet2, dataSheet3) {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    if (!container) return;
    
    container.innerHTML = ""; 

    // 1. CARI LOMBA YANG LAGI "ON GOING" DI SHEET 2
    const currentMatch = dataSheet2.find(l => l.status === 'ON GOING');

    // 2. KONDISI A: LAGI ADA LOMBA AKTIF (TAMPILKAN BRACKET)
    if (currentMatch) {
        titleDisplay.innerText = `🔴 LIVE: ${currentMatch.nama_lomba} (${currentMatch.kategori})`;
        
        // Filter data Sheet 3 (Rekap) hanya untuk lomba yang lagi jalan ini
        const rekapAktif = dataSheet3.filter(p => p.lomba === currentMatch.nama_lomba);

        const daftarBabak = ["Penyisihan", "Semifinal", "Final"];

        daftarBabak.forEach(namaBabak => {
            const section = document.createElement("div");
            section.className = "babak-section";
            section.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;

            const dataPerBabak = rekapAktif.filter(player => {
                if (!player.status) return false;
                const parts = player.status.split(" - ");
                const babakDiStatus = parts[1] ? parts[1].trim() : "";
                return babakDiStatus.toLowerCase() === namaBabak.toLowerCase();
            });

            if (dataPerBabak.length === 0) {
                section.innerHTML += `<p style="text-align:center; color:#999; padding:20px;">Belum ada jadwal ${namaBabak}</p>`;
            } else {
                const groupHeat = {};
                dataPerBabak.forEach(p => {
                    const noHeat = p.heat || "1";
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });

                Object.keys(groupHeat).sort().forEach(noHeat => {
                    let htmlHeat = `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].forEach(player => {
                        const s = player.status.toLowerCase();
                        let badge = '<span class="badge badge-wait">READY</span>';
                        let style = "";

                        if (s.includes("lolos")) {
                            badge = '<span class="badge badge-next">LOLOS ➔</span>';
                            style = "background:#eaffea; border-left:4px solid #2ecc71;";
                        } else if (s.includes("gugur")) {
                            badge = '<span class="badge badge-lose">GUGUR</span>';
                            style = "background:#fff5f5; opacity:0.6;";
                        } else if (s.includes("juara")) {
                            badge = '<span class="badge badge-win">JUARA 🏆</span>';
                            style = "background:#fff9db; border-left:4px solid #f1c40f;";
                        }

                        htmlHeat += `
                            <div class="player-row" style="${style} display:flex; justify-content:space-between; padding:8px; margin-bottom:3px; border-radius:4px;">
                                <span class="player-name">${player.nama}</span>
                                ${badge}
                            </div>`;
                    });
                    htmlHeat += `</div>`;
                    section.innerHTML += htmlHeat;
                });
            }
            container.appendChild(section);
        });

    } else {
        // 3. KONDISI B: GAK ADA LOMBA AKTIF (TAMPILKAN LEADERBOARD)
        titleDisplay.innerText = `🏆 KLASEMEN SEMENTARA & PESERTA ZONK`;
        
        // Panggil fungsi hitung poin yang kita bahas tadi
        const dataPoin = generateLeaderboard(dataSheet3); 
        
        // Render tabel Leaderboard ke dalam container
        let htmlLeaderboard = `<div class="leaderboard-table" style="width:100%">`;
        dataPoin.forEach((p, index) => {
            const rank = index + 1;
            const statusZonk = p.isZonk ? '<span style="color:#888; font-size:12px;">(Zonk)</span>' : '⭐';
            htmlLeaderboard += `
                <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #eee; background:white; margin-bottom:5px; border-radius:8px;">
                    <span><strong>#${rank}</strong> ${p.nama} ${statusZonk}</span>
                    <span><strong>${p.totalPoin} Poin</strong></span>
                </div>`;
        });
        htmlLeaderboard += `</div>`;
        container.innerHTML = htmlLeaderboard;
    }
}// --- FITUR AUTO REFRESH ---
// Jalankan pertama kali saat halaman dibuka
fetchLiveReport();

// Jalankan ulang setiap 10 detik (10000 milidetik)
setInterval(fetchLiveReport, 10000);
