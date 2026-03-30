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

    // Cari lomba yang statusnya "ON GOING" di Sheet 2
    // Nama kolom di Sheet 2: "Status"
    // List babak yang dianggap aktif
const statusAktif = ["on-going", "penyisihan", "semifinal", "final"];

const currentMatch = dataSheet2.find(l => {
    // Ambil nilai status dari object, gak peduli huruf gede/kecil key-nya
    // Kita cari property yang namanya mirip "status"
    let nilaiStatus = l.status || l.Status || l.STATUS || "";
    
    // Bersihkan spasi dan samakan jadi huruf kecil
    let s = nilaiStatus.toString().toLowerCase().trim();
    
    return statusAktif.includes(s);
});
    
    if (currentMatch) {
        // --- MODE A: TAMPILKAN BRACKET (LOMBA AKTIF) ---
        titleDisplay.innerText = `🔴 LIVE: ${currentMatch.nama_lomba} (${currentMatch.kategori})`;
        
        // Filter data Sheet 3 hanya untuk lomba yang sedang jalan
        const rekapAktif = dataSheet3.filter(p => p.lomba === currentMatch.nama_lomba);

        const daftarBabak = ["Penyisihan", "Semifinal", "Final"];

        daftarBabak.forEach(namaBabak => {
            const section = document.createElement("div");
            section.className = "babak-section";
            section.innerHTML = `<h2 class="babak-title">${namaBabak.toUpperCase()}</h2>`;

            const dataPerBabak = rekapAktif.filter(player => {
                if (!player.status_babak) return false;
                // Pecah status (Misal: "Lolos - Semifinal")
                const parts = player.status_babak.split(" - ");
                const babakDiStatus = parts[1] ? parts[1].trim() : "";
                return babakDiStatus.toLowerCase() === namaBabak.toLowerCase();
            });

            if (dataPerBabak.length === 0) {
                section.innerHTML += `<p style="text-align:center; color:#999; padding:20px;">Belum ada jadwal ${namaBabak}</p>`;
            } else {
                const groupHeat = {};
                dataPerBabak.forEach(p => {
                    const noHeat = p.nomor_heat || "1";
                    if (!groupHeat[noHeat]) groupHeat[noHeat] = [];
                    groupHeat[noHeat].push(p);
                });
                
                Object.keys(groupHeat).sort().forEach(noHeat => {
                    let htmlHeat = `<div class="heat-wrapper">
                                    <div class="heat-label">HEAT ${noHeat}</div>`;
                    
                    groupHeat[noHeat].forEach(player => {
                        const s = player.status_babak.toLowerCase();
                        dataPerBabak.sort((a, b) => {
    const statusA = a.status_babak.toLowerCase();
    const statusB = b.status_babak.toLowerCase();
    return statusA.localeCompare(statusB); 
});
                        let badge = '<span class="badge badge-wait">READY</span>';
                        let style = "";

                        if (s.includes("lolos")) {
                            badge = '<span class="badge badge-next">LOLOS ➔</span>';
                            style = "background:#eaffea; border-left:4px solid #2ecc71;";
                        } else if (s.includes("gugur")) {
                            badge = '<span class="badge badge-lose">GUGUR</span>';
                            style = "background:#fff5f5; opacity:0.6;";
                        } else if (s.includes("juara 1")) {
    badge = '<span class="badge" style="background:#f1c40f; color:#000;">🥇 JUARA 1</span>';
    style = "background:#fff9db; border-left:5px solid #f1c40f; font-weight:bold;";
} else if (s.includes("juara 2")) {
    badge = '<span class="badge" style="background:#95a5a6; color:#fff;">🥈 JUARA 2</span>';
    style = "background:#f8f9fa; border-left:5px solid #95a5a6;";
} else if (s.includes("juara 3")) {
    badge = '<span class="badge" style="background:#e67e22; color:#fff;">🥉 JUARA 3</span>';
    style = "background:#fdf2e9; border-left:5px solid #e67e22;";
} else if (s.includes("juara")) { 
    // Backup kalau cuma nulis "Juara" doang tanpa angka
    badge = '<span class="badge badge-win">🏆 JUARA</span>';
    style = "background:#fff9db; border-left:4px solid #f1c40f;";
}

                        htmlHeat += `
                            <div class="player-row" style="${style} display:flex; justify-content:space-between; padding:8px; margin-bottom:3px; border-radius:4px;">
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

    } else {
        // --- MODE B: TAMPILKAN LEADERBOARD (ISTIRAHAT / SEMUA FINISHED) ---
        titleDisplay.innerText = `🏆 KLASEMEN SEMENTARA & PESERTA ZONK`;
        
        const dataPoin = generateLeaderboard(dataSheet3); 
        
        let htmlLeaderboard = `<div class="leaderboard-table" style="width:100%">`;
        dataPoin.forEach((p, index) => {
            const rank = index + 1;
            // Peserta Zonk adalah yang poinnya ada tapi gak pernah juara
            const statusZonk = p.isZonk ? '<span style="color:#888; font-size:12px;">(Zonk)</span>' : '⭐';
            
            htmlLeaderboard += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; background:white; margin-bottom:5px; border-radius:8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <span><strong>#${rank}</strong> ${p.nama} ${statusZonk}</span>
                    <span style="font-weight:bold; color:#2c3e50;">${p.totalPoin} Poin</span>
                </div>`;
        });
        htmlLeaderboard += `</div>`;
        container.innerHTML = htmlLeaderboard;
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

function showRekapJuara() {
    const list = document.getElementById("rekapList");
    const modal = document.getElementById("rekapModal");
    modal.style.display = "flex";
    
    // Filter KHUSUS Juara 1, 2, dan 3 saja
    const daftarJuara = dataSheet3.filter(p => {
        const s = p.status_babak ? p.status_babak.toLowerCase() : "";
        return s.includes("juara 1") || s.includes("juara 2") || s.includes("juara 3");
    });

    if (daftarJuara.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size: 50px;">🏁</div>
                <p>Belum ada pemenang yang naik podium, brok.<br>Tunggu pertandingan selesai ya!</p>
            </div>`;
        return;
    }

    // Sortir biar Juara 1 selalu paling atas di tiap grup
    // 1. Sortir Multi-Level: Urut Lomba Dulu, Baru Urut Juara
daftarJuara.sort((a, b) => {
    // Gabungkan Nama Lomba + Kategori buat pembanding
    const grupA = `${a.lomba} - ${a.kategori}`.toLowerCase();
    const grupB = `${b.lomba} - ${b.kategori}`.toLowerCase();
    
    // Kalau Lombanya beda, urutkan berdasarkan abjad Nama Lomba
    if (grupA !== grupB) {
        return grupA.localeCompare(grupB);
    }
    
    // Kalau Lombanya SAMA, baru urutkan berdasarkan Ranking (1, 2, 3)
    const getRank = (str) => {
        const s = str.toLowerCase();
        if (s.includes("1")) return 1;
        if (s.includes("2")) return 2;
        if (s.includes("3")) return 3;
        return 99;
    };
    
    return getRank(a.status_babak) - getRank(b.status_babak);
});

    // Render HTML-nya
    let html = "";
    let currentGroup = "";

    daftarJuara.forEach(p => {
        let groupName = `${p.lomba} - ${p.kategori}`;
        if (currentGroup !== groupName) {
            html += `<h3 class="rekap-group-title">${groupName}</h3>`;
            currentGroup = groupName;
        }
        
        // Ganti bagian class item-rekap jadi dinamis
let rankClass = p.status_babak.includes("1") ? "juara-1" : 
                p.status_babak.includes("2") ? "juara-2" : "juara-3";

html += `
    <div class="item-rekap ${rankClass}">
        <div class="pemenang-info">
            <span class="medali-icon">${medali}</span>
            <span class="nama-pemenang">${p.nama}</span>
        </div>
        <span class="label-juara">${p.status_babak.split(" - ")[0]}</span>
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
