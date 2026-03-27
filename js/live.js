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

    // Urutan kolom yang akan muncul di layar
    const daftarBabak = ["Penyisihan", "Semifinal", "Final"];

    daftarBabak.forEach(namaBabak => {
        // 1. BUAT KOLOM UNTUK BABAK INI
        const section = document.createElement("div");
        section.className = "babak-section";
        section.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;

        // 2. FILTER DATA: Ambil data yang statusnya mengandung nama babak ini
        // Contoh: "Lolos - Semifinal" hanya masuk ke kolom Semifinal
        const dataPerBabak = rekap.filter(player => {
            if (!player.status) return false;
            
            // Kita pecah statusnya (Misal: "Lolos - Semifinal")
            const parts = player.status.split(" - ");
            const babakDiStatus = parts[1] ? parts[1].trim() : "";

            // CEK: Apakah babak di status SAMA DENGAN nama kolom (namaBabak)?
            return babakDiStatus.toLowerCase() === namaBabak.toLowerCase();
        });

        // 3. JIKA KOSONG, TAMPILKAN PESAN
        if (dataPerBabak.length === 0) {
            section.innerHTML += `<p style="text-align:center; color:#999; padding:20px;">Belum ada jadwal ${namaBabak}</p>`;
        } else {
            // 4. GROUPING PER LOMBA & HEAT (Seperti biasa)
            const groupLomba = {};
            dataPerBabak.forEach(p => {
                if (!groupLomba[p.lomba]) groupLomba[p.lomba] = [];
                groupLomba[p.lomba].push(p);
            });

            Object.keys(groupLomba).forEach(namaLomba => {
                let htmlLomba = `<div class="lomba-card">
                                    <div class="lomba-header">${namaLomba}</div>`;

                const groupHeat = {};
                groupLomba[namaLomba].forEach(p => {
                    const noHeat = p.heat || "1";
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });

                Object.keys(groupHeat).sort().forEach(noHeat => {
                    htmlLomba += `<div class="heat-wrapper">
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

                        htmlLomba += `
                            <div class="player-row" style="${style} display:flex; justify-content:space-between; padding:8px; margin-bottom:3px; border-radius:4px;">
                                <span class="player-name">${player.nama}</span>
                                ${badge}
                            </div>`;
                    });
                    htmlLomba += `</div>`;
                });
                htmlLomba += `</div>`;
                section.innerHTML += htmlLomba;
            });
        }
        // Masukkan kolom babak ke container utama
        container.appendChild(section);
    });
}// --- FITUR AUTO REFRESH ---
// Jalankan pertama kali saat halaman dibuka
fetchLiveReport();

// Jalankan ulang setiap 10 detik (10000 milidetik)
setInterval(fetchLiveReport, 10000);
