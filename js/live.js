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

    // Filter lomba yang statusnya aktif saja
    const statusAktif = ["on-going", "penyisihan", "semifinal", "final", "aktif", "open"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    if (daftarLombaAktif.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888;'>Tidak ada lomba yang sedang berlangsung.</p>";
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

    // Set default tab kalau belum ada yang aktif
    if (!window.kategoriAktif) {
        window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
    }

    daftarLombaAktif.forEach(l => {
        const keyKat = `${l.nama_lomba}-${l.kategori}`;
        const btn = document.createElement("button");
        btn.innerText = `${l.nama_lomba} (${l.kategori})`;
        btn.className = (window.kategoriAktif === keyKat) ? "tab-btn active" : "tab-btn";
        
        // Style inline dikit biar pasti keliatan tab-nya
        btn.style.whiteSpace = "nowrap";
        btn.style.minWidth = "fit-content";
        
        btn.onclick = () => {
            window.kategoriAktif = keyKat;
            renderLiveBracket(); 
        };
        tabWrapper.appendChild(btn);
    });
    container.appendChild(tabWrapper);

    const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
    titleDisplay.innerHTML = `<span class="live-indicator"></span> LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

    // --- FILTER DATA PESERTA ---
    const rekapAktif = dataSheet3.filter(p => {
        const lS3 = String(p.lomba || "").toLowerCase().trim();
        const kS3 = String(p.kategori || "").toLowerCase().trim();
        const lT = String(matchTampil.nama_lomba || "").toLowerCase().trim();
        const kT = String(matchTampil.kategori || "").toLowerCase().trim();
        return lS3 === lT && kS3 === kT;
    });

    // --- RENDER PER BABAK ---
    ["Penyisihan", "Semifinal", "Final"].forEach(namaBabak => {
        const dataPerBabak = rekapAktif.filter(p => {
            let stat = String(p.status_babak || "").toLowerCase();
            return stat.includes(namaBabak.toLowerCase());
        });

        if (dataPerBabak.length > 0) {
            const babakDiv = document.createElement("div");
            babakDiv.className = "babak-section"; // Sesuai live-style.css
            babakDiv.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;
            
            const groupHeat = {};
            dataPerBabak.forEach(p => {
                const noHeat = p.nomor_heat || "1";
                if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                groupHeat[noHeat].push(p);
            });

            const gridHeat = document.createElement("div");
            gridHeat.className = "heat-grid-container"; // Sesuai global.css

            Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                let htmlHeat = `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                
                groupHeat[noHeat].forEach(player => {
                    const s = (player.status_babak || "").toLowerCase();
                    let statusClass = "badge-wait"; // Default Abu-abu
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

fetchLiveReport();
setInterval(fetchLiveReport, 10000);
