const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 
let dataSheet2 = []; 
let dataSheet3 = []; 
window.kategoriAktif = window.kategoriAktif || null;

function fetchLiveReport() {
    fetch(`${scriptURL}?type=getLiveReportFull`)
        .then(res => res.json())
        .then(data => {
            if (data && data.daftarLomba && data.rekapHasil) {
                dataSheet2 = data.daftarLomba; 
                dataSheet3 = data.rekapHasil; 
                renderLiveBracket();
            }
        })
        .catch(err => console.error("Gagal update data:", err));
}

function renderLiveBracket() {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    if (!container) return;

    const statusAktif = ["on-going", "penyisihan", "semifinal", "final", "aktif"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    if (daftarLombaAktif.length === 0) {
        renderLeaderboard(container, titleDisplay);
        return;
    }

    container.innerHTML = ""; 

    // --- TAB NAVIGASI ---
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "tab-wrapper"; // Pakai Class CSS

    if (!window.kategoriAktif) {
        window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
    }

    daftarLombaAktif.forEach(l => {
        const keyKat = `${l.nama_lomba}-${l.kategori}`;
        const btn = document.createElement("button");
        btn.innerText = `${l.nama_lomba} (${l.kategori})`;
        btn.className = (window.kategoriAktif === keyKat) ? "tab-btn active" : "tab-btn";
        btn.onclick = () => {
            window.kategoriAktif = keyKat;
            renderLiveBracket(); 
        };
        tabWrapper.appendChild(btn);
    });
    container.appendChild(tabWrapper);

    const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
    titleDisplay.innerText = `LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

    // --- FILTER DATA ---
    // --- FILTER DATA ---
    const rekapAktif = dataSheet3.filter(p => {
        // Paksa jadi String pake String(...) biar nggak error kalo isinya Angka
        const lS3 = String(p.lomba || "").toLowerCase().trim();
        const kS3 = String(p.kategori || "").toLowerCase().trim();
        
        const lT = String(matchTampil.nama_lomba || "").toLowerCase().trim();
        const kT = String(matchTampil.kategori || "").toLowerCase().trim();
        
        return lS3 === lT && kS3 === kT;
    });

    // Tambahin ini di live.js buat ngecek
console.log("Tombol yang diklik:", matchTampil.nama_lomba, matchTampil.kategori);
console.log("Isi Sheet 3 yang ditarik:", dataSheet3);
console.log("Hasil Filter (Cocok):", rekapAktif.length);

    ["Penyisihan", "Semifinal", "Final"].forEach(namaBabak => {
        // Ganti baris filter babak lo jadi gini biar lebih fleksibel
const dataPerBabak = rekapAktif.filter(p => {
    let stat = String(p.status_babak || "").toLowerCase();
    let target = namaBabak.toLowerCase();
    return stat.indexOf(target) !== -1; // Cara lama tapi paling ampuh buat nyari teks
});
        console.log(`Cek Babak ${namaBabak}:`, dataPerBabak.length, "orang"); // <--- TAMBAHIN LOG INI

        if (dataPerBabak.length > 0) {
            const babakDiv = document.createElement("div");
            babakDiv.className = "babak-container";
            babakDiv.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;
            
            const groupHeat = {};
            dataPerBabak.forEach(p => {
                const noHeat = p.nomor_heat || "1";
                if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                groupHeat[noHeat].push(p);
            });

            const gridHeat = document.createElement("div");
            gridHeat.className = "grid-heat";

            Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                let htmlHeat = `<div class="heat-card">
                                    <div class="heat-header">HEAT ${noHeat}</div>`;
                
                groupHeat[noHeat].forEach(player => {
                    const s = (player.status_babak || "").toLowerCase();
                    let statusClass = "status-ready";
                    let label = "READY";

                    if (s.includes("lolos")) { statusClass = "status-lolos"; label = "LOLOS ➔"; }
                    else if (s.includes("gugur")) { statusClass = "status-gugur"; label = "GUGUR"; }
                    else if (s.includes("juara")) { statusClass = "status-juara"; label = "🏆 " + s.split('-')[0].trim().toUpperCase(); }
                    else if (s.includes("menunggu")) { statusClass = "status-waiting"; label = "ON FIRE 🔥"; }

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
    title.innerText = `🏆 KLASEMEN POIN`;
    // ... Logika poin tetep sama, cuma output pake Class
    container.innerHTML = `<div class="leaderboard-list">...data poin...</div>`;
}

fetchLiveReport();
setInterval(fetchLiveReport, 10000);
