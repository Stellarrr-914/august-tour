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

    // 1. CARI SEMUA lomba yang statusnya Aktif (bisa lebih dari satu!)
    const statusAktif = ["on-going", "penyisihan", "semifinal", "final"];
    const daftarLombaAktif = dataSheet2.filter(l => {
        let s = (l.status || l.Status || "").toString().toLowerCase().trim();
        return statusAktif.includes(s);
    });

    if (daftarLombaAktif.length > 0) {
        // --- MODE BARU: PAKE TAB / FILTER KATEGORI ---
        
        // Bikin wadah buat tombol kategori (Tabs)
        const tabWrapper = document.createElement("div");
        tabWrapper.className = "tab-kategori-wrapper"; // Kasih CSS flex & overflow-x: auto
        tabWrapper.style = "display:flex; gap:10px; overflow-x:auto; padding:10px 0; margin-bottom:20px;";

        // Ambil kategori pertama buat jadi default yang tampil
        if (!window.kategoriAktif) {
            window.kategoriAktif = `${daftarLombaAktif[0].nama_lomba}-${daftarLombaAktif[0].kategori}`;
        }

        daftarLombaAktif.forEach(l => {
            const keyKat = `${l.nama_lomba}-${l.kategori}`;
            const btn = document.createElement("button");
            btn.innerText = `${l.nama_lomba} (${l.kategori})`;
            
            // Styling Tombol (Kuning kalau aktif, Gelap kalau nggak)
            const isAktif = window.kategoriAktif === keyKat;
            btn.style = `padding:8px 15px; border-radius:20px; border:none; cursor:pointer; white-space:nowrap; font-weight:bold; 
                         background:${isAktif ? '#f1c40f' : '#2c3e50'}; 
                         color:${isAktif ? '#000' : '#fff'};`;

            btn.onclick = () => {
                window.kategoriAktif = keyKat;
                renderLiveBracket(dataSheet2, dataSheet3); // Re-render saat diklik
            };
            tabWrapper.appendChild(btn);
        });
        
        container.appendChild(tabWrapper);

        // 2. FILTER DATA berdasarkan tab yang dipilih
        const matchTampil = daftarLombaAktif.find(l => `${l.nama_lomba}-${l.kategori}` === window.kategoriAktif) || daftarLombaAktif[0];
        
        titleDisplay.innerText = ` LIVE: ${matchTampil.nama_lomba} (${matchTampil.kategori})`;

        // Filter Sheet 3: HARUS COCOK LOMBA DAN KATEGORI
        const rekapAktif = dataSheet3.filter(p => 
            p.lomba === matchTampil.nama_lomba && 
            (p.kategori === matchTampil.kategori || p.kat === matchTampil.kategori)
        );

        // ... SISANYA (Looping Babak & Heat) PAKE rekapAktif YANG SUDAH DIFILTER TADI ...
        // (Gak perlu diubah banyak, tinggal lanjutin kode lo yang lama ke bawah)    
    if (currentMatch) {
        // --- MODE A: TAMPILKAN BRACKET (LOMBA AKTIF) ---
        titleDisplay.innerText = ` LIVE: ${currentMatch.nama_lomba} (${currentMatch.kategori})`;
        
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
    
    // Sortir biar yang Lolos/Juara ada di atas
    groupHeat[noHeat].sort((a, b) => a.status_babak.localeCompare(b.status_babak));

    groupHeat[noHeat].forEach(player => {
        const s = player.status_babak.toLowerCase();
        let badge = '<span class="badge badge-wait">READY</span>';
        let rowClass = "";

        // Logika Badge & Styling Baris
        if (s.includes("lolos")) {
            badge = '<span class="badge badge-next">LOLOS ➔</span>';
        } else if (s.includes("gugur")) {
            badge = '<span class="badge badge-lose">GUGUR</span>';
        } else if (s.includes("juara 1")) {
            badge = '<span class="badge" style="background:#f1c40f; color:#000; box-shadow: 0 0 10px #f1c40f;">🥇 JUARA 1</span>';
        } else if (s.includes("juara 2")) {
            badge = '<span class="badge" style="background:#bdc3c7; color:#000;">🥈 JUARA 2</span>';
        } else if (s.includes("juara 3")) {
            badge = '<span class="badge" style="background:#cd7f32; color:#fff;">🥉 JUARA 3</span>';
        }

        htmlHeat += `
            <div class="player-row ${rowClass}">
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
