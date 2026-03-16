// ======= TAMBAH PESERTA =======
async function tambahPeserta() {
    const input = document.getElementById("inputPeserta").value;
    const parts = input.split(",");

    if (parts.length !== 3) {
        alert("Format: Nama,Kategori,Level");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parseInt(parts[1].trim());
    const level = parts[2].trim().toUpperCase();

    const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

    await fetch(urlAPI, {
        method: "POST",
        body: JSON.stringify({
            nama: nama,
            kategori: kategori,
            level: level
        })
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

// ======= CARI PESERTA =======
function cariPeserta() {
    const keyword = prompt("Masukkan nama peserta yang dicari:");
    if (!keyword) return;

    const hasil = databaseAnak.filter(anak =>
        anak.nama.toLowerCase().includes(keyword.toLowerCase())
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
