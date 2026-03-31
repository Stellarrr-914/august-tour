// 1. KONFIGURASI URL (Pastiin URL Deployment GS lo bener)
let dataSheet2 = []; // Buat simpan data status lomba
let dataSheet3 = []; // Buat simpan data rekap/juara
let scriptURL = "https://script.google.com/macros/s/AKfycbyijZepuUbuoZOXdpKJLfvEXFSm0NNzjf-AwM4MkM5iP7ly1aV34V_bgRBI3HM_pV49/exec"; 

// 2. FUNGSI AMBIL DATA (Satu kali tarik dapat dua data sheet)
// 2. FUNGSI AMBIL DATA (Satu kali tarik dapat dua data sheet)
function fetchLiveReport() {
    fetch(scriptURL + "?type=getLiveReportFull")
        .then(response => response.json())
        .then(data => {
            if (data && data.daftarLomba && data.rekapHasil) {
                
                // --- KUNCI UTAMA: ISI VARIABEL GLOBAL DISINI ---
                dataSheet2 = data.daftarLomba; 
                dataSheet3 = data.rekapHasil; 
                // -----------------------------------------------

                // Baru panggil render
                renderLiveBracket(dataSheet2, dataSheet3);
                console.log("Data Global Terupdate!");
            }
        })
        .catch(err => {
            console.error("Gagal update data:", err);
            const title = document.getElementById('live-title');
            if(title) title.innerText = "Koneksi Terputus...";
        });
}
// 3. FUNGSI PANGALIMA (Pilih Tampilan: Bracket vs Leaderboard)
function renderLiveBracket(dataSheet2, dataSheet3) {
    const container = document.getElementById("liveReportContainer");
    const titleDisplay = document.getElementById('live-title');
    if (!container) return;
    
    container.innerHTML = ""; 

    // 1. CARI SEMUA lomba yang statusnya Aktif
    const statusAktif = ["on-going", "penyisihan", "semifinal", "final"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || l.Status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    if (daftarLombaAktif.length > 0) {
        // --- MODE A: TAMPILKAN BRACKET (LOMBA AKTIF) ---

        // Wadah Tab Kategori
        const tabWrapper = document.createElement("div");
        tabWrapper.className = "tab-kategori-wrapper";
        tabWrapper.style = "display:flex; gap:10px; overflow-x:auto; padding:10px 5px; margin-bottom:20px; scrollbar-width: none;";

        if (!window.kategoriAktif) {
            window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
        }

        daftarLombaAktif.forEach(l => {
            const keyKat = `${l.nama_lomba}-${l.kategori}`;
            const btn = document.createElement("button");
            btn.innerText = `${l.nama_lomba} (${l.kategori})`;
            
            const isAktif = window.kategoriAktif === keyKat;
            btn.style = `padding:8px 15px; border-radius:20px; border:none; cursor:pointer; white-space:nowrap; font-weight:bold; transition:0.3s;
                         background:${isAktif ? '#f1c40f' : '#2c3e50'}; 
                         color:${isAktif ? '#000' : '#fff'};`;

            btn.onclick = () => {
                window.kategoriAktif = keyKat;
                renderLiveBracket(dataSheet2, dataSheet3); 
            };
            tabWrapper.appendChild(btn);
        });
        container.appendChild(tabWrapper);

        const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
        titleDisplay.innerText = ` LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

        // Filter Sheet 3 sesuai Lomba & Kategori
        // GANTI BAGIAN INI DI live.js
const rekapAktif = dataSheet3.filter(p => {
    const namaLombaSheet = (p.lomba || "").toString().trim().toUpperCase();
    const kategoriSheet = (p.kategori || p.kat || "").toString().trim().toUpperCase();
    
    const namaLombaTab = matchTampil.nama_lomba.trim().toUpperCase();
    const kategoriTab = matchTampil.kategori.trim().toUpperCase();

    return namaLombaSheet === namaLombaTab && kategoriSheet === kategoriTab;
});

        console.log("Kategori yang dipilih:", matchTampil.nama_lomba, matchTampil.kategori);
console.log("Data yang berhasil lolos filter:", rekapAktif);

        const daftarBabak = ["Penyisihan", "Semifinal", "Final"];

        // DISINI KUNCI PERBAIKANNYA (Looping daftarBabak)
        daftarBabak.forEach(namaBabak => {
            const section = document.createElement("div");
            section.className = "babak-section";
            section.innerHTML = `<h2 class="babak-title" style="color:#f1c40f; border-left:4px solid #f1c40f; padding-left:10px; margin-top:20px;">${namaBabak.toUpperCase()}</h2>`;

            // GANTI BAGIAN INI JUGA
const dataPerBabak = rekapAktif.filter(player => {
    if (!player.status_babak) return false;
    
    const statusLengkap = player.status_babak.toLowerCase();
    const targetBabak = namaBabak.toLowerCase(); // "penyisihan", "semifinal", atau "final"

    // Cukup cek apakah kata "penyisihan" ada di dalam status_babak
    // Jadi mau tulisannya "Lolos - Penyisihan" atau "Penyisihan" aja, dia bakal dapet.
    return statusLengkap.includes(targetBabak);
});

            if (dataPerBabak.length === 0) {
                section.innerHTML += `<p style="text-align:center; color:#666; padding:15px;">Belum ada jadwal ${namaBabak}</p>`;
            } else {
                const groupHeat = {};
                dataPerBabak.forEach(p => {
                    const noHeat = p.nomor_heat || "1"; 
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });
                
                Object.keys(groupHeat).sort((a,b) => a - b).forEach(noHeat => {
                    let htmlHeat = `<div class="heat-wrapper" style="margin-bottom:15px; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px;">
                                    <div class="heat-label" style="font-weight:bold; color:#888; font-size:0.9em; margin-bottom:8px;">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].sort((a, b) => a.status_babak.localeCompare(b.status_babak));

                    groupHeat[noHeat].forEach(player => {
                        const s = player.status_babak.toLowerCase();
                        let badge = '<span class="badge badge-wait" style="background:#444; padding:2px 8px; border-radius:4px; font-size:0.8em;">READY</span>';
                        
                        if (s.includes("lolos")) {
                            badge = '<span class="badge badge-next" style="background:#27ae60; color:white; padding:2px 8px; border-radius:4px;">LOLOS ➔</span>';
                        } else if (s.includes("gugur")) {
                            badge = '<span class="badge badge-lose" style="background:#c0392b; color:white; padding:2px 8px; border-radius:4px;">GUGUR</span>';
                        } else if (s.includes("juara 1")) {
                            badge = '<span class="badge" style="background:#f1c40f; color:#000; padding:2px 8px; border-radius:4px; font-weight:bold;">🥇 JUARA 1</span>';
                        } else if (s.includes("juara 2")) {
                            badge = '<span class="badge" style="background:#bdc3c7; color:#000; padding:2px 8px; border-radius:4px; font-weight:bold;">🥈 JUARA 2</span>';
                        } else if (s.includes("juara 3")) {
                            badge = '<span class="badge" style="background:#cd7f32; color:#fff; padding:2px 8px; border-radius:4px; font-weight:bold;">🥉 JUARA 3</span>';
                        }

                        htmlHeat += `
                            <div class="player-row" style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span class="player-name" style="color:#eee;">${player.nama}</span>
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
        // --- MODE B: LEADERBOARD ---
        titleDisplay.innerText = `🏆 KLASEMEN SEMENTARA`;
        const dataPoin = generateLeaderboard(dataSheet3); 
        let htmlLeaderboard = `<div style="width:100%">`;
        dataPoin.forEach((p, index) => {
            htmlLeaderboard += `
                <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:8px;">
                    <span style="color:#fff;"><strong>#${index + 1}</strong> ${p.nama} ${p.isZonk ? '(Zonk)' : '⭐'}</span>
                    <span style="font-weight:bold; color:#f1c40f;">${p.totalPoin} Pts</span>
                </div>`;
        });
        container.innerHTML = htmlLeaderboard + `</div>`;
    }
}
// 4. FUNGSI HITUNG POIN (Logic untuk Peserta Zonk & Juara Umum)
function generateLeaderboard(rekapHasil) {
    let leaderboard = {};

    rekapHasil.forEach(row => {
        const nama = row.nama;
        const status = row.status_babak ? row.status_babak.toLowerCase() : "";
        
        if (!nama) return;
        if (!leaderboard[nama]) {
            leaderboard[nama] = { nama: nama, totalPoin: 0, isZonk: true };
        }

        // Logic Poin
        if (status.includes("juara")) {
            leaderboard[nama].totalPoin += 100;
            leaderboard[nama].isZonk = false; // Jika pernah juara, status Zonk hilang
        } else if (status.includes("final")) {
            leaderboard[nama].totalPoin += 10;
        } else if (status.includes("semifinal")) {
            leaderboard[nama].totalPoin += 5;
        } else if (status.includes("lolos") || status.includes("gugur")) {
            leaderboard[nama].totalPoin += 2; // Poin partisipasi dasar
        }
    });

    // Urutkan dari poin tertinggi
    return Object.values(leaderboard).sort((a, b) => b.totalPoin - a.totalPoin);
}

// ==========================================
// FUNGSI REKAP JUARA (Final & Rapi Jali)
// ==========================================
function showRekapJuara() {
    const list = document.getElementById("rekapList");
    const modal = document.getElementById("rekapModal");
    if (!list || !modal) return; // Safety check
    
    modal.style.display = "flex";
    
    // 1. Filter Strict: Cuma ambil Juara 1, 2, 3
    const daftarJuara = dataSheet3.filter(p => {
        const s = p.status_babak ? p.status_babak.toLowerCase() : "";
        return s.includes("juara 1") || s.includes("juara 2") || s.includes("juara 3");
    });

    if (daftarJuara.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color:#999;"><div style="font-size: 50px;">🏁</div><p>Belum ada pemenang yang naik podium, brok!</p></div>`;
        return;
    }

    // 2. Sortir Multi-Level: Urut Lomba Dulu, Baru Urut Ranking
    daftarJuara.sort((a, b) => {
        const grupA = `${a.lomba} - ${a.kategori}`.toLowerCase();
        const grupB = `${b.lomba} - ${b.kategori}`.toLowerCase();
        if (grupA !== grupB) return grupA.localeCompare(grupB);
        
        const getRank = (str) => {
            if (str.includes("1")) return 1;
            if (str.includes("2")) return 2;
            if (str.includes("3")) return 3;
            return 99;
        };
        return getRank(a.status_babak) - getRank(b.status_babak);
    });

    // 3. Render HTML
    let html = "";
    let currentGroup = "";

    daftarJuara.forEach(p => {
        let groupName = `${p.lomba} - ${p.kategori}`;
        
        // Header Nama Lomba
        if (currentGroup !== groupName) {
            html += `<div style="margin: 25px 0 10px 0; color:#f1c40f; font-weight:bold; font-size: 1.1em; text-transform:uppercase; border-bottom:1px solid #333; padding-bottom:5px;">🚩 ${groupName}</div>`;
            currentGroup = groupName;
        }
        
        // Tentukan Emoji, Warna Medali, dan Status Tulisan
        let medali = "🥉";
        let medaliColor = "#e67e22"; // Perunggu
        let statusTeks = "JUARA 3";
        
        if (p.status_babak.includes("1")) {
            medali = "🥇"; medaliColor = "#f1c40f"; statusTeks = "JUARA 1";
        } else if (p.status_babak.includes("2")) {
            medali = "🥈"; medaliColor = "#bdc3c7"; statusTeks = "JUARA 2";
        }

        // --- RENDER BARIS PEMENANG (Satu Baris Rapi) ---
        html += `
            <div class="item-rekap" style="display:flex; align-items:center; padding:12px; background:rgba(255,255,255,0.06); margin-bottom:5px; border-radius:8px; border-left: 5px solid ${medaliColor}; gap: 15px;">
                
                <span style="font-size: 1.4em;">${medali}</span>
                
                <div style="display:flex; align-items:baseline; gap:10px; flex-grow:1;">
                    <strong style="color:#fff; font-size: 1.1em; text-transform:uppercase; letter-spacing: 0.5px;">${p.nama}</strong>
                    
                    <span style="font-size: 0.8em; color: ${medaliColor}; font-weight: bold; letter-spacing: 1px;">
                        (${statusTeks})
                    </span>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}
function closeRekapJuara() {
    document.getElementById("rekapModal").style.display = "none";
}

// 5. INISIALISASI & AUTO REFRESH
// Jalankan saat pertama kali dibuka
fetchLiveReport();

// Auto update tiap 10 detik
setInterval(fetchLiveReport, 10000);
