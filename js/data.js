// ======= DATA =======
const admin = { username: "admin", password: "1234" };

let databaseAnak = [];

// Membaca databaseLomba dari localStorage supaya data tidak hilang saat refresh
let databaseLomba = JSON.parse(localStorage.getItem("databaseLomba")) || {};

// LINK CSV GOOGLE SHEET
const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZwz2KR3s-srm3nj-9G1TAJLQg3NJO2_tU98j4KxniklmAnIS_q_kfkgOKGZQ07QYaeZuFWuh018XM/pub?output=csv";

// Link Sheet 2 (Lomba)
const sheetLombaCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZwz2KR3s-srm3nj-9G1TAJLQg3NJO2_tU98j4KxniklmAnIS_q_kfkgOKGZQ07QYaeZuFWuh018XM/pub?gid=1443453687&single=true&output=csv"; 

// ======= LOAD DATA SHEET =======
async function loadDataFromSheet(){
    console.log("Loading Google Sheet...");
    try{
        const response = await fetch(sheetCSV + "&t=" + new Date().getTime());
        const text = await response.text();

        parseCSV(text);

        // Update tampilan tabel kalau fungsinya tersedia
        if (typeof tampilAnak === "function") {
            tampilAnak();
        }
        
        console.log("Data peserta berhasil di-load:", databaseAnak);

    } catch(err){
        console.error("Gagal load sheet:", err);
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
