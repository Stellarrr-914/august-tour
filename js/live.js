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
    container.innerHTML = ""; 

    const babaks = ["Penyisihan", "Semifinal", "Final"];

    babaks.forEach(namaBabak => {
        const section = document.createElement("div");
        section.className = "babak-section";
        section.innerHTML = `<h2 class="babak-title">BABAK ${namaBabak.toUpperCase()}</h2>`;

        // 1. Filter data babak ini
        const dataPerBabak = rekap.filter(p => p.status.includes(namaBabak));

        if (dataPerBabak.length === 0) {
            section.innerHTML += "<p class='empty-msg'>Belum ada jadwal.</p>";
        } else {
            // 2. GROUPING BERDASARKAN NAMA LOMBA
            const groupLomba = {};
            dataPerBabak.forEach(p => {
                if (!groupLomba[p.lomba]) groupLomba[p.lomba] = [];
                groupLomba[p.lomba].push(p);
            });

            // 3. Render Per Lomba
            Object.keys(groupLomba).forEach(namaLomba => {
                let htmlLomba = `<div class="lomba-card">
                                    <div class="lomba-header">${namaLomba}</div>`;

                // 4. GROUPING BERDASARKAN HEAT DI DALAM LOMBA TERSEBUT
                const groupHeat = {};
                groupLomba[namaLomba].forEach(p => {
                    const noHeat = p.heat || "1";
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });

                // 5. Render Per Heat
                Object.keys(groupHeat).sort().forEach(noHeat => {
                    htmlLomba += `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].forEach(player => {
                        const statusKecil = player.status.toLowerCase();
                        let badge = "";
                        if (statusKecil.includes("lolos")) badge = '<span class="badge badge-next">NEXT ➔</span>';
                        else if (statusKecil.includes("menunggu")) badge = '<span class="badge badge-wait">READY</span>';
                        else if (statusKecil.includes("juara")) badge = '<span class="badge badge-win">🏆</span>';

                        htmlLomba += `
                            <div class="player-row">
                                <span class="player-name">${player.nama} <small>(${player.kat})</small></span>
                                ${badge}
                            </div>`;
                    });
                    htmlLomba += `</div>`; // Tutup heat-wrapper
                });

                htmlLomba += `</div>`; // Tutup lomba-card
                section.innerHTML += htmlLomba;
            });
        }
        container.appendChild(section);
    });
}
// --- FITUR AUTO REFRESH ---
// Jalankan pertama kali saat halaman dibuka
fetchLiveReport();

// Jalankan ulang setiap 10 detik (10000 milidetik)
setInterval(fetchLiveReport, 10000);
