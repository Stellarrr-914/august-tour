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

function renderLiveBracket(rekap) {
    const container = document.getElementById("liveReportContainer");
    if (!container) return;
    container.innerHTML = ""; 

    const babaks = ["Penyisihan", "Semifinal", "Final"];

    babaks.forEach(namaBabak => {
        const section = document.createElement("div");
        section.className = "babak-section";
        section.innerHTML = `<h2 class="babak-title">BABAK ${namaBabak.toUpperCase()}</h2>`;

        // --- LOGIKA FILTER ANTI-HILANG ---
        const dataPerBabak = rekap.filter(player => {
            // Pastikan variabel 'player' (atau 'p') terdefinisi di sini
            if (!player || !player.status) return false;
            
            const s = player.status.toLowerCase();
            const target = namaBabak.toLowerCase();

            // 1. Tampilkan jika memang statusnya di babak ini (misal: "Lolos - Penyisihan")
            if (s.includes(target)) return true;

            // 2. HISTORI: Jika dia sudah di Semifinal, dia harus TETAP muncul di kotak Penyisihan
            if (target === "penyisihan" && (s.includes("semifinal") || s.includes("final"))) return true;
            if (target === "semifinal" && s.includes("final")) return true;

            return false;
        });

        if (dataPerBabak.length === 0) {
            section.innerHTML += "<p class='empty-msg' style='text-align:center; color:#999;'>Belum ada data.</p>";
        } else {
            // Grouping Lomba
            const groupLomba = {};
            dataPerBabak.forEach(player => {
                if (!groupLomba[player.lomba]) groupLomba[player.lomba] = [];
                groupLomba[player.lomba].push(player);
            });

            Object.keys(groupLomba).forEach(namaLomba => {
                let htmlLomba = `<div class="lomba-card">
                                    <div class="lomba-header">${namaLomba}</div>`;

                // Grouping Heat
                const groupHeat = {};
                groupLomba[namaLomba].forEach(player => {
                    const noHeat = player.heat || "1";
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(player);
                });

                Object.keys(groupHeat).sort().forEach(noHeat => {
                    htmlLomba += `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].forEach(player => {
                        const statusKecil = player.status.toLowerCase();
                        let badge = "";
                        let rowStyle = "";

                        // Cek status buat nentuin warna & badge
                        if (statusKecil.includes("lolos")) {
                            badge = '<span class="badge badge-next">LOLOS ➔</span>';
                            rowStyle = "background: #eaffea; border-left: 4px solid #2ecc71;";
                        } else if (statusKecil.includes("gugur")) {
                            badge = '<span class="badge badge-lose">GUGUR</span>';
                            rowStyle = "background: #fff5f5; opacity: 0.7;";
                        } else if (statusKecil.includes("juara")) {
                            badge = '<span class="badge badge-win">JUARA 🏆</span>';
                            rowStyle = "background: #fff9db; border-left: 4px solid #f1c40f;";
                        } else {
                            badge = '<span class="badge badge-wait">READY</span>';
                        }

                        htmlLomba += `
                            <div class="player-row" style="${rowStyle} padding: 8px; margin: 2px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                                <span class="player-name" style="font-weight:600;">${player.nama} <small style="font-weight:normal; color:#666;">(${player.kat})</small></span>
                                ${badge}
                            </div>`;
                    });
                    htmlLomba += `</div>`;
                });
                htmlLomba += `</div>`;
                section.innerHTML += htmlLomba;
            });
        }
        container.appendChild(section);
    });
}// --- FITUR AUTO REFRESH ---
// Jalankan pertama kali saat halaman dibuka
fetchLiveReport();

// Jalankan ulang setiap 10 detik (10000 milidetik)
setInterval(fetchLiveReport, 10000);
