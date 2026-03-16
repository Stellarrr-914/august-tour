// ======= DATA =======

const admin = { username: "admin", password: "1234" };

let databaseAnak = [];
const databaseLomba = {};

// LINK CSV GOOGLE SHEET
const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZwz2KR3s-srm3nj-9G1TAJLQg3NJO2_tU98j4KxniklmAnIS_q_kfkgOKGZQ07QYaeZuFWuh018XM/pub?output=csv";


// ======= LOAD DATA SHEET =======

async function loadDataFromSheet(){

    console.log("Loading Google Sheet...");

    try{

        const response = await fetch(sheetCSV + "&t=" + new Date().getTime());
        const text = await response.text();

        parseCSV(text);

if (typeof tampilAnak === "function") {
    tampilAnak();
}

    }catch(err){

        console.error("Gagal load sheet:", err);

    }

}


// ======= PARSE CSV =======

function parseCSV(csv){

    databaseAnak = [];

    const rows = csv.split("\n");

    for(let i=1;i<rows.length;i++){

        const cols = rows[i].split(",");

        if(cols.length < 3) continue;

        databaseAnak.push({

            nama: cols[0].trim(),
            kategori: parseInt(cols[1]),
            level: cols[2].trim()

        });

    }

    console.log("Data peserta:", databaseAnak);

}
