// ======= TAMBAH PESERTA =======
async function tambahPeserta() {
    const input = document.getElementById("inputPeserta").value.trim();
    const parts = input.split(",");

    if (parts.length !== 3) {
        alert("Format tambah: Nama,Kategori,Level");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim().toUpperCase(); // kategori abjad A/B/C dst
    const level = parts[2].trim().toUpperCase();    // level bisa + atau -

    const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

    await fetch(urlAPI, {
        method: "POST",
        body: JSON.stringify({ nama, kategori, level })
    });

    databaseAnak.push({ nama, kategori, level });

    tampilAnak();
    document.getElementById("inputPeserta").value = "";
    alert("Peserta berhasil ditambah!");
}

// ======= TAMPIL PESERTA =======
function tampilAnak() {
    const tbody = document.getElementById("tabelAnak");
    tbody.innerHTML = "";

    if (databaseAnak.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="4">Belum ada peserta</td>`;
        tbody.appendChild(row);
        return;
    }

    databaseAnak.forEach((anak, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${i+1}</td>
            <td>${anak.nama}</td>
            <td>${anak.kategori}</td>
            <td>${anak.level}</td>
        `;
        tbody.appendChild(row);
    });
}

// ======= CARI PESERTA (nama/kategori/level) =======
function cariPeserta() {
    const keyword = document.getElementById("inputPeserta").value.trim().toUpperCase();
    if (!keyword) {
        alert("Masukkan nama, kategori, atau level di textbox untuk cari.");
        return;
    }

    const hasil = databaseAnak.filter(anak =>
        anak.nama.toUpperCase().includes(keyword) || // cari berdasarkan nama
        anak.kategori === keyword ||                 // cari berdasarkan kategori
        anak.level === keyword                       // cari berdasarkan level
    );

    const tbody = document.getElementById("tabelAnak");
    tbody.innerHTML = "";

    if (hasil.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="4">Peserta tidak ditemukan</td>`;
        tbody.appendChild(row);
        return;
    }

    hasil.forEach((anak, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${i+1}</td>
            <td>${anak.nama}</td>
            <td>${anak.kategori}</td>
            <td>${anak.level}</td>
        `;
        tbody.appendChild(row);
    });
}
