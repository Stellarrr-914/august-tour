// ======= DATA =======
const admin = { username: "admin", password: "1234" };

let databaseAnak = [];

// Membaca databaseLomba dari localStorage supaya data tidak hilang saat refresh
let databaseLomba = JSON.parse(localStorage.getItem("databaseLomba")) || {};

// LINK CSV GOOGLE SHEET
const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZwz2KR3s-srm3nj-9G1TAJLQg3NJO2_tU98j4KxniklmAnIS_q_kfkgOKGZQ07QYaeZuFWuh018XM/pub?gid=0&single=true&output=csv";

// Link Sheet 2 (Lomba)
const sheetLombaCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZwz2KR3s-srm3nj-9G1TAJLQg3NJO2_tU98j4KxniklmAnIS_q_kfkgOKGZQ07QYaeZuFWuh018XM/pub?gid=1443453687&single=true&output=csv"; 

// ======= LOAD DATA SHEET =======
async function loadDataFromSheet() {
    console.log("Loading Google Sheet...");
    try {
        const response = await fetch(sheetCSV + "&t=" + new Date().getTime());
        const text = await response.text();

        // Proses pecah data CSV
        const rows = text.split(/\r?\n/);
        databaseAnak = []; 
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(",");
            if (cols.length < 3) continue;
            databaseAnak.push({
                nama: cols[0].trim(),
                kategori: cols[1].trim().toUpperCase(),
                level: cols[2].trim().toUpperCase()
            });
        }

        // Panggil fungsi tampil dari peserta.js
        if (typeof tampilSemuaTabel === "function") {
            tampilSemuaTabel();
        }
        
        console.log("Data peserta berhasil di-load:", databaseAnak);
    } catch (err) {
        console.error("Gagal load sheet:", err);
    }
}
async function loadLombaFromSheet() {
    try {
        const response = await fetch(sheetLombaCSV + "&t=" + new Date().getTime());
        const text = await response.text();
        
        const rows = text.split(/\r?\n/);
        
        // Kosongkan dulu biar gak double pas di-load ulang
        databaseLomba = {}; 

        // Di data.js
for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",");
    if (cols.length < 3) continue;

    const namaLomba = cols[0].trim();
    const kategori = cols[1].trim();
    const status = cols[2].trim();

    // PAKAI KEY UNIK GABUNGAN
    const keyUnik = `${namaLomba}-${kategori}`; 

    databaseLomba[keyUnik] = {
        nama: namaLomba, // Simpan nama asli buat tampilan
        kategori: kategori,
        status: status
    };
}
        
        console.log("Data Lomba ter-update:", databaseLomba);
        
        // --- KUNCI BIAR MUNCUL PAS REFRESH ---
        if (typeof tampilLomba === "function") {
            tampilLomba(); 
        }
        if (typeof updateLombaDropdown === "function") {
            updateLombaDropdown();
        }

    } catch (err) {
        console.error("Gagal load sheet lomba:", err);
    }
}

// ======= PARSE CSV =======
function parseCSV(csv) {
    databaseAnak = [];
    // Memecah baris dan membersihkan karakter \r (carriage return)
    const rows = csv.split(/\r?\n/); 

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",");
        if (cols.length < 3) continue;

        databaseAnak.push({
            nama: cols[0].trim(),
            kategori: cols[1].trim(),
            level: cols[2].trim().toUpperCase()
        });
    }
}
