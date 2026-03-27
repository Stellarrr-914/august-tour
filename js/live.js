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

    // Daftar babak yang mau kita tampilin
    const babaks = ["Penyisihan", "Semifinal", "Final"];

    babaks.forEach(namaBabak => {
        const section = document.createElement("div");
        section.className = "babak-section";
        section.innerHTML = `<h2>BABAK ${namaBabak.toUpperCase()}</h2>`;

        // 1. Filter data hanya untuk babak ini (Penyisihan/Semi/Final)
        const dataPerBabak = rekap.filter(p => p.status.includes(namaBabak));

        if (dataPerBabak.length === 0) {
            section.innerHTML += "<p style='text-align:center; color:#999;'>Belum ada jadwal.</p>";
        } else {
            // 2. LOGIC GROUPING BERDASARKAN HEAT (Kolom E)
            const groups = {};
            dataPerBabak.forEach(p => {
                const noHeat = p.heat || "1"; // Ambil kolom Heat, default ke 1
                if (!groups[noHeat]) groups[noHeat] = [];
                groups[noHeat].push(p);
            });

            // 3. Render per Kotak Heat
            Object.keys(groups).sort().forEach(noHeat => {
                let htmlHeat = `<div class="heat-card">
                                    <h3>HEAT ${noHeat}</h3>`;
                
                groups[noHeat].forEach(player => {
                    const statusKecil = player.status.toLowerCase();
                    let badge = "";
                    
                    if (statusKecil.includes("lolos")) {
                        badge = '<span class="badge badge-next">NEXT ➔</span>';
                    } else if (statusKecil.includes("menunggu")) {
                        badge = '<span class="badge badge-wait">READY</span>';
                    } else if (statusKecil.includes("juara")) {
                        badge = '<span class="badge badge-win">🏆</span>';
                    }

                    htmlHeat += `
                        <div class="player-row">
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
}

// --- FITUR AUTO REFRESH ---
// Jalankan pertama kali saat halaman dibuka
fetchLiveReport();

// Jalankan ulang setiap 10 detik (10000 milidetik)
setInterval(fetchLiveReport, 10000);
