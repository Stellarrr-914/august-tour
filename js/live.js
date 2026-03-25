// Menggunakan URL yang sama dengan yang ada di bracket.js lo
const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec";

async function fetchLiveReport() {
    const root = document.getElementById("bracket-root");
    try {
        const response = await fetch(`${scriptURL}?type=getLiveReportFull`);
        const data = await response.json();
        
        if (data.rekap && data.rekap.length > 0) {
            renderLiveBracket(data.rekap, data.jadwal);
        } else {
            root.innerHTML = "<div style='text-align:center; padding:50px; color:#666;'>Belum ada data pertandingan yang masuk brok...</div>";
        }
    } catch (err) {
        console.error("Gagal load live report:", err);
        root.innerHTML = "<div style='text-align:center; color:red;'>Koneksi ke server gagal.</div>";
    }
}

function renderLiveBracket(rekap, jadwal) {
    const root = document.getElementById("bracket-root");
    const titleEl = document.getElementById("lomba-aktif");
    const nextEl = document.getElementById("next-match-text");

    // 1. Update Judul Lomba (Data terbaru di urutan pertama)
    titleEl.innerText = `${rekap[0].lomba} - ${rekap[0].kat}`;

    // 2. Cari Next Match di Jadwal (Sheet 4)
    const idx = jadwal.findIndex(j => j.lomba === rekap[0].lomba && j.kat === rekap[0].kat);
    const next = jadwal[idx + 1];
    nextEl.innerText = next ? `${next.lomba} (${next.kat})` : "Selesai! 🏁";

    // 3. Render Kolom (Penyisihan, Semifinal, Final)
    const stages = ["Penyisihan", "Semifinal", "Final"];
    let finalHTML = "";

    stages.forEach(stage => {
        const players = rekap.filter(p => p.status.includes(stage));
        let columnHTML = `<div class="column"><div class="column-header">${stage.toUpperCase()}</div>`;
        
        if (players.length === 0) {
            columnHTML += `<div style="text-align:center; color:#444; font-size:12px; margin-top:20px;">Menunggu hasil...</div>`;
        } else {
            // Kita kelompokkan per 4 orang (Sesuai limit default lo di bracket.html)
            for (let i = 0; i < players.length; i += 4) {
                const groups = {};
    dataPerBabak.forEach(p => {
        if (!groups[p.heat]) groups[p.heat] = [];
        groups[p.heat].push(p);
    });

    // Sekarang tinggal tampilin per group
    Object.keys(groups).forEach(heatNum => {
        let htmlHeat = `<div class="match-box">
            <div class="match-label">HEAT ${heatNum}</div>`;
        
        groups[heatNum].forEach(player => {
            htmlHeat += `<div class="player">${player.nama} - ${player.status}</div>`;
        });
        
        htmlHeat += `</div>`;
        // Masukin ke kolom babak yang sesuai
    });
                columnHTML += `<div class="match-card">${pList}</div>`;
            }
        }
        columnHTML += `</div>`;
        finalHTML += columnHTML;
    });

    root.innerHTML = finalHTML;
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
    fetchLiveReport();
    setInterval(fetchLiveReport, 15000); // Auto update tiap 15 detik
});
