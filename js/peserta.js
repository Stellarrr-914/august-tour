// --- KONFIGURASI ---
const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

// --- FUNGSI TAMBAH PESERTA (ANAK & IBU) ---
async function tambahPeserta() {
    const inputField = document.getElementById("inputPeserta");
    const value = inputField.value.trim();
    const parts = value.split(",");

    // Validasi format: Nama, Kategori, Level
    if (parts.length !== 3) {
        alert("Format Salah! Pakai: Nama, Kategori, Level\nContoh Anak: Budi, 1, A\nContoh Ibu: Susi, M, 1");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim().toUpperCase(); // M, I, atau Angka (1, 2, 3)
    const level = parts[2].trim().toUpperCase();

    try {
        inputField.disabled = true; // Kunci input pas lagi ngirim

        // 1. Kirim ke Google Sheets
        await fetch(urlAPI, {
            method: "POST",
            mode: "no-cors", // Pakai no-cors kalau Apps Script gak kasih header
            body: JSON.stringify({
                nama: nama,
                kategori: kategori,
                level: level
            })
        });

        // 2. Update Database Lokal
        databaseAnak.push({
            nama: nama,
            kategori: kategori,
            level: level
        });

        // 3. Update Tampilan & Reset
        tampilSemuaTabel();
        inputField.value = "";
        inputField.disabled = false;
        alert("Berhasil menambah: " + nama);

    } catch (error) {
        console.error("Gagal tambah peserta:", error);
        inputField.disabled = false;
        alert("Gagal konek ke server!");
    }
}

// --- FUNGSI TAMPILKAN DATA (DIPISAH DUA TABEL) ---
function tampilSemuaTabel() {
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");

    if (!tabelAnak || !tabelIbu) return;

    // Bersihkan tabel sebelum render ulang
    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";

    let noAnak = 1;
    let noIbu = 1;

    databaseAnak.forEach((p) => {
        const row = `
            <tr>
                <td>${(p.kategori === 'M' || p.kategori === 'I') ? noIbu++ : noAnak++}</td>
                <td>${p.nama}</td>
                <td>${p.kategori}</td>
                <td>${p.level}</td>
            </tr>
        `;

        // Filter: Jika kategori M (Moms) atau I (Ibu), masuk ke tabel Ibu
        if (p.kategori === "M" || p.kategori === "I") {
            tabelIbu.innerHTML += row;
        } else {
            // Selain itu (biasanya angka), masuk ke tabel Anak
            tabelAnak.innerHTML += row;
        }
    });
}

// --- FUNGSI CARI PESERTA (CERDAS) ---
function cariPeserta() {
    const input = document.getElementById("inputPeserta").value.trim().toUpperCase();

    if (input === "") {
        tampilSemuaTabel();
        return;
    }

    const kataKunci = input.split(" ");
    const hasil = databaseAnak.filter(p => {
        return kataKunci.every(k => {
            return (
                p.nama.toUpperCase().includes(k) || 
                p.kategori.toString().toUpperCase() === k || 
                p.level.toUpperCase() === k
            );
        });
    });

    // Render hasil pencarian ke tabel yang sesuai
    const tabelAnak = document.getElementById("tabelAnak");
    const tabelIbu = document.getElementById("tabelIbu");
    
    tabelAnak.innerHTML = "";
    tabelIbu.innerHTML = "";

    let noAnak = 1;
    let noIbu = 1;

    hasil.forEach((p) => {
        const row = `
            <tr>
                <td>${(p.kategori === 'M' || p.kategori === 'I') ? noIbu++ : noAnak++}</td>
                <td>${p.nama}</td>
                <td>${p.kategori}</td>
                <td>${p.level}</td>
            </tr>
        `;
        if (p.kategori === "M" || p.kategori === "I") {
            tabelIbu.innerHTML += row;
        } else {
            tabelAnak.innerHTML += row;
        }
    });
}
