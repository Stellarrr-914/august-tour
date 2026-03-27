// Menggunakan URL yang sama dengan yang ada di bracket.js lo
const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec";

function fetchLiveReport() {
    fetch(scriptURL + "?type=getLiveReportFull")
        .then(response => response.json())
        .then(data => {
            console.log("Data diterima:", data);
            renderLiveBracket(data.rekap); // Kirim data rekap ke fungsi render
        })
        .catch(err => {
            console.error("Gagal load live report:", err);
            document.getElementById("liveReportContainer").innerHTML = "<p>Koneksi ke server gagal brok, coba refresh!</p>";
        });
}

function renderLiveBracket(rekap) {
    const container = document.getElementById("liveReportContainer");
    container.innerHTML = ""; // Bersihkan dulu

    // 1. Kelompokkan data berdasarkan BABAK (dari kolom Status di Sheet 3)
    // Ingat: Status kita isinya "Lolos - Penyisihan" atau "Menunggu - Semifinal"
    const babaks = ["Penyisihan", "Semifinal", "Final"];

    babaks.forEach(namaBabak => {
        const section = document.createElement("div");
        section.className = "babak-section";
        section.innerHTML = `<h2>BABAK ${namaBabak.toUpperCase()}</h2>`;

        // FILTER data yang sesuai dengan nama babak ini
        const dataPerBabak = rekap.filter(p => p.status.includes(namaBabak));

        if (dataPerBabak.length === 0) {
            section.innerHTML += "<p>Belum ada jadwal/hasil.</p>";
        } else {
            // 2. Grouping lagi berdasarkan nomor HEAT (Kolom E)
            const heats = {};
            dataPerBabak.forEach(p => {
                const h = p.heat || "1"; // Default ke 1 kalau kosong
                if (!heats[h]) heats[h] = [];
                heats[h].push(p);
            });

            // 3. Render per Heat
            Object.keys(heats).forEach(num => {
                let heatHtml = `<div class="heat-card"><h3>HEAT ${num}</h3>`;
                heats[num].forEach(p => {
                    const isLolos = p.status.toLowerCase().includes("lolos");
                    const isWaiting = p.status.toLowerCase().includes("menunggu");
                    
                    let badge = "";
                    if (isLolos) badge = '<span class="badge-next">NEXT ➔</span>';
                    if (isWaiting) badge = '<span class="badge-wait">READY</span>';

                    heatHtml += `<div class="player-row">
                                    <span>${p.nama}</span>
                                    ${badge}
                                 </div>`;
                });
                heatHtml += `</div>`;
                section.innerHTML += heatHtml;
            });
        }
        container.appendChild(section);
    });
}

// Jalankan saat halaman dibuka
fetchLiveReport();
