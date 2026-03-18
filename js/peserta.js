// URL API dari Google Apps Script lu
const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

// FUNGSI CEK: Apakah ini kategori Ibu-ibu?
// Mengembalikan true jika kategori diawali huruf M atau I
function cekKategoriIbu(kat) {
    const k = String(kat).toUpperCase();
    return k.startsWith("M") || k.startsWith("I");
}

async function tambahPeserta() {
    const inputField = document.getElementById("inputPeserta");
    const value = inputField.value.trim();
    const parts = value.split(",");

    if (parts.length !== 3) {
        alert("Format: Nama, Kategori, Level\nContoh: Budi, 1, A atau Susi, M1, 1");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim().toUpperCase(); 
    const level = parts[2].trim().toUpperCase();

    try {
        inputField.disabled = true;
        await fetch(urlAPI, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ nama, kategori, level })
        });

        databaseAnak.push({ nama, kategori, level });
        tampilSemuaTabel();
        
        inputField.value = "";
        inputField.disabled = false;
        alert("Berhasil menambah: " + nama);
    } catch (e) {
        alert("Gagal konek server!");
        inputField.disabled = false;
    }
}

function tampilSemuaTabel() {
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");

    if (!tabelAnak || !tabelIbu) return;

    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";

    let noAnak = 1;
    let noIbu = 1;

    databaseAnak.forEach(p => {
        const isIbu = cekKategoriIbu(p.kategori);
        const row = `<tr>
            <td>${isIbu ? noIbu++ : noAnak++}</td>
            <td>${p.nama}</td>
            <td>${p.kategori}</td>
            <td>${p.level}</td>
        </tr>`;

        if (isIbu) {
            tabelIbu.innerHTML += row;
        } else {
            tabelAnak.innerHTML += row;
        }
    });
}

function cariPeserta() {
    const input = document.getElementById("inputPeserta").value.trim().toUpperCase();
    if (input === "") {
        tampilSemuaTabel();
        return;
    }

    const kataKunci = input.split(" ");
    const hasil = databaseAnak.filter(p => {
        return kataKunci.every(k => 
            p.nama.toUpperCase().includes(k) || 
            p.kategori.toString().toUpperCase() === k || 
            p.level.toUpperCase() === k
        );
    });

    renderHasilCari(hasil);
}

function renderHasilCari(hasil) {
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");
    if (!tabelAnak || !tabelIbu) return;
    
    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";
    
    let noAnak = 1; 
    let noIbu = 1;
    
    hasil.forEach(p => {
        const isIbu = cekKategoriIbu(p.kategori);
        const row = `<tr>
            <td>${isIbu ? noIbu++ : noAnak++}</td>
            <td>${p.nama}</td>
            <td>${p.kategori}</td>
            <td>${p.level}</td>
        </tr>`;
        
        if (isIbu) tabelIbu.innerHTML += row;
        else tabelAnak.innerHTML += row;
    });
}
