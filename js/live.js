// 1. KONFIGURASI
const scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 
let dataSheet2 = []; 
let dataSheet3 = []; 
window.kategoriAktif = window.kategoriAktif || null;

// 2. AMBIL DATA DARI SERVER
function fetchLiveReport() {
    fetch(`${scriptURL}?type=getLiveReportFull`)
        .then(res => res.json())
        .then(data => {
            if (data && data.daftarLomba && data.rekapHasil) {
                dataSheet2 = data.daftarLomba; 
                dataSheet3 = data.rekapHasil; 
                renderLiveBracket();
                console.log("⚡ Live Update:", new Date().toLocaleTimeString());
            }
        })
        .catch(err => console.error("❌ Gagal Sinkronisasi:", err));
}

// 3. RENDER TAMPILAN UTAMA
function renderLiveBracket() {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    if (!container) return;

    // Filter Lomba yang sedang berjalan (Status di Sheet 2)
    const statusAktif = ["on-going", "penyisihan", "semifinal", "final", "aktif"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    // Jika tidak ada lomba aktif, tampilkan Leaderboard/Klasemen
    if (daftarLombaAktif.length === 0) {
        renderLeaderboard(container, titleDisplay);
        return;
    }

    container.innerHTML = ""; 

    // --- RENDER TAB NAVIGASI ---
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "tab-navigation";
    tabWrapper.style = "display:flex; gap:10px; overflow-x:auto; padding:10px 5px; margin-bottom:20px; scrollbar-width:none; -webkit-overflow-scrolling:touch;";

    if (!window.kategoriAktif) {
        window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
    }

    daftarLombaAktif.forEach(l => {
        const keyKat = `${l.nama_lomba}-${l.kategori}`;
        const btn = document.createElement("button");
        btn.innerText = `${l.nama_lomba} (${l.kategori})`;
        const isAktif = window.kategoriAktif === keyKat;
        
        btn.style = `padding:10px 20px; border-radius:25px; border:none; cursor:pointer; white-space:nowrap; font-weight:bold; transition: 0.3s;
                     background:${isAktif ? '#f1c40f' : '#2c3e50'}; color:${isAktif ? '#000' : '#fff'}; box-shadow: ${isAktif ? '0 0 10px #f1c40f' : 'none'};`;

        btn.onclick = () => {
            window.kategoriAktif = keyKat;
            renderLiveBracket(); 
        };
        tabWrapper.appendChild(btn);
    });
    container.appendChild(tabWrapper);

    // Identifikasi Lomba yang sedang dibuka
    const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
    titleDisplay.innerText = `🔴 LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

    // --- FILTER DATA REKAP (SHEET 3) ---
    const rekapAktif = dataSheet3.filter(p => {
        const lS3 = (p.lomba || "").toString().toLowerCase().trim();
        const kS3 = (p.kategori || "").toString().toLowerCase().trim();
        const lTampil = (matchTampil.nama_lomba || "").toString().toLowerCase().trim();
        const kTampil = (matchTampil.kategori || "").toString().toLowerCase().trim();
        return lS3 === lTampil && kS3 === kTampil;
    });

    const daftarBabak = ["Penyisihan", "Semifinal", "Final"];
    
    daftarBabak.forEach(namaBabak => {
        const dataPerBabak = rekapAktif.filter(p => (p.status_babak || "").toLowerCase().includes(namaBabak.toLowerCase()));

        if (dataPerBabak.length > 0) {
            const babakDiv = document.createElement("div");
            babakDiv.innerHTML = `<h3 style="color:#f1c40f; border-left:4px solid #f1c40f; padding-left:10px; margin: 25px 0 15px 0;">${namaBabak.toUpperCase()}</h3>`;
            
            // Grouping Berdasarkan Heat
            const groupHeat = {};
            dataPerBabak.forEach(p => {
                const noHeat = p.nomor_heat || "1";
                if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                groupHeat[noHeat].push(p);
            });

            const heatContainer = document.createElement("div");
            heatContainer.style = "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;";

            Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                let htmlHeat = `<div class="heat-card" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border: 1px solid rgba(255,255,255,0.1);">
                                    <div style="font-weight:bold; color:#f1c40f; font-size:0.8em; margin-bottom:10px; border-bottom:1px solid #444; padding-bottom:5px;">HEAT ${noHeat}</div>`;
                
                groupHeat[noHeat].forEach(player => {
                    const s = (player.status_babak || "").toLowerCase();
                    let badge = '';

                    if (s.includes("lolos")) {
                        badge = '<span style="background:#27ae60; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75em; font-weight:bold;">LOLOS ➔</span>';
                    } else if (s.includes("gugur")) {
                        badge = '<span style="background:#c0392b; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75em;">GUGUR</span>';
                    } else if (s.includes("juara")) {
                        badge = `<span style="background:#f1c40f; color:#000; padding:3px 8px; border-radius:4px; font-size:0.75em; font-weight:bold; box-shadow: 0 0 8px #f1c40f;">🏆 ${s.split('-')[0].trim().toUpperCase()}</span>`;
                    } else if (s.includes("menunggu")) {
                        badge = '<span class="pulse-animation" style="background:#e67e22; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75em;">ON FIRE 🔥</span>';
                    } else {
                        badge = '<span style="background:#555; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75em;">READY</span>';
                    }

                    htmlHeat += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                                    <span style="color:#eee; font-weight:500;">${player.nama}</span>
                                    ${badge}
                                 </div>`;
                });
                htmlHeat += `</div>`;
                heatContainer.innerHTML += htmlHeat;
            });
            babakDiv.appendChild(heatContainer);
            container.appendChild(babakDiv);
        }
    });
}

// 4. RENDER LEADERBOARD (KLASEMEN)
function renderLeaderboard(container, title) {
    title.innerText = `🏆 KLASEMEN POIN SEMENTARA`;
    const leaderboard = {};
    
    dataSheet3.forEach(row => {
        const nama = row.nama;
        const status = (row.status_babak || "").toLowerCase();
        if (!nama) return;
        if (!leaderboard[nama]) leaderboard[nama] = { nama: nama, poin: 0 };
        
        if (status.includes("juara 1")) leaderboard[nama].poin += 100;
        else if (status.includes("juara 2")) leaderboard[nama].poin += 75;
        else if (status.includes("juara 3")) leaderboard[nama].poin += 50;
        else if (status.includes("final")) leaderboard[nama].poin += 25;
        else if (status.includes("semifinal")) leaderboard[nama].poin += 10;
        else if (status.includes("lolos")) leaderboard[nama].poin += 5;
    });

    const sorted = Object.values(leaderboard).sort((a,b) => b.poin - a.poin);
    
    let html = `<div style="margin-top:20px;">`;
    sorted.forEach((p, i) => {
        const isTop3 = i < 3;
        html += `<div style="display:flex; justify-content:space-between; padding:15px; background:${isTop3 ? 'rgba(241, 196, 15, 0.1)' : 'rgba(2
