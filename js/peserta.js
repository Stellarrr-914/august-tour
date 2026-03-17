// --- FUNGSI TAMBAH ANAK (Tetap 3 Input: Nama, Kategori Angka, Level) ---
async function tambahPeserta(){
    const input = document.getElementById("inputPeserta").value;
    const parts = input.split(",");

    if(parts.length !== 3){ 
        alert("Format Anak: Nama, Kategori(Angka), Level (Contoh: Budi, 1, A)");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim(); // HAPUS parseInt() biar aman
    const level = parts[2].trim().toUpperCase();
    
    await kirimDataKeSheet(nama, kategori, level);
    document.getElementById("inputPeserta").value = "";
}

// --- FUNGSI TAMBAH IBU-IBU (Cukup 2 Input: Nama, LevelBB) ---
async function tambahIbu(){
    const input = document.getElementById("inputIbu").value;
    const parts = input.split(",");

    if(parts.length !== 2){ 
        alert("Format Ibu: Nama, Level (Contoh: Ibu Susi, M1)");
        return;
    }

    const nama = parts[0].trim();
    const kategori = "Ibu-Ibu"; // Kita kunci otomatis biar lu gak capek ngetik
    const level = parts[1].trim().toUpperCase();

    await kirimDataKeSheet(nama, kategori, level);
    document.getElementById("inputIbu").value = "";
}

// Fungsi kirim data (URL API pake yang punya lu tadi)
async function kirimDataKeSheet(nama, kategori, level) {
    const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

    try {
        await fetch(urlAPI, {
            method: "POST",
            body: JSON.stringify({ nama, kategori, level })
        });

        databaseAnak.push({ nama, kategori, level });
        tampilSemuaTabel(); 
        alert(nama + " berhasil ditambah!");
    } catch (e) {
        alert("Gagal kirim data!");
    }
}

// --- FUNGSI TAMPIL (Pemisah Tabel Visual) ---
function tampilSemuaTabel(){
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");
    
    if(tabelAnak) tabelAnak.innerHTML = "";
    if(tabelIbu) tabelIbu.innerHTML = "";

    let counterAnak = 1;
    let counterIbu = 1;

    databaseAnak.forEach((p) => {
        const row = `<tr>
            <td>${p.kategori === "Ibu-Ibu" ? counterIbu++ : counterAnak++}</td>
            <td>${p.nama}</td>
            <td>${p.kategori}</td>
            <td>${p.level}</td>
        </tr>`;

        // Filter: Kalau teksnya "Ibu-Ibu" masuk ke tabel Ibu, sisanya (Angka) masuk ke tabel Anak
        if(p.kategori === "Ibu-Ibu") {
            if(tabelIbu) tabelIbu.innerHTML += row;
        } else {
            if(tabelAnak) tabelAnak.innerHTML += row;
        }
    });
}

function cariPeserta(){

    const input = document
        .getElementById("inputPeserta")
        .value
        .trim();

    if(input === ""){
        tampilAnak();
        return;
    }

    const kata = input.split(" ");

    const hasil = databaseAnak.filter(p=>{

        return kata.every(k=>{

            const key = k.toUpperCase();

            // level
            if(["A+","A","A-","B+","B","B-","C+","C"].includes(key)){
                return p.level === key;
            }

            // nama
            return p.nama.toLowerCase().includes(k.toLowerCase());

        });

    });

    const tabel = document.getElementById("tabelAnak");

    tabel.innerHTML = "";

    hasil.forEach((anak,i)=>{

        tabel.innerHTML += `
        <tr>
        <td>${i+1}</td>
        <td>${anak.nama}</td>
        <td>${anak.kategori}</td>
        <td>${anak.level}</td>
        </tr>
        `;

    });

}

