async function tambahLomba() {
    const nama = document.getElementById("namaLomba").value.trim();
    if (!nama) return;

    // Cek biar nggak dobel
    if (databaseLomba[nama]) {
        alert("Lomba sudah ada di daftar!");
        return;
    }

    // GANTI PAKE URL APPS SCRIPT LU YANG BARU DI-DEPLOY
    const urlAPI = "https://script.google.com/macros/s/AKfycbyB9aHWSYYe23Er4nz15Mh_x9nO18IbSMDU1fp2YInIPtgi7jsd9PgcZciqHob42B13/exec"; 

    try {
        await fetch(urlAPI, {
            method: "POST",
            body: JSON.stringify({
                type: "tambahLomba",
                namaLomba: nama,
                status: "Open"
            })
        });

        // Update lokal biar langsung muncul di tabel tanpa nunggu sheet
        databaseLomba[nama] = { kategori: "", status: "Open", peserta: [] };
        
        document.getElementById("namaLomba").value = "";
        tampilLomba();
        updateLombaDropdown();
        
        alert("Lomba '" + nama + "' berhasil masuk database!");
    } catch (e) {
        console.error(e);
        alert("Gagal konek ke server.");
    }
}


function tampilLomba() {
    const tabel = document.getElementById("tabelLomba");
    if (!tabel) return; // Biar nggak error kalau elemennya nggak ada

    tabel.innerHTML = "";
    let i = 1;

    for (const namaLomba in databaseLomba) {
        const lomba = databaseLomba[namaLomba];
        tabel.innerHTML += `
        <tr>
            <td>${i}</td>
            <td>${namaLomba}</td>
            <td>${lomba.kategori || "-"}</td>
            <td>${lomba.status || "Open"}</td>
            <td>
                <button onclick="hapusLomba('${namaLomba}')">Hapus</button>
            </td>
        </tr>
        `;
        i++;
    }
}

function updateLombaDropdown() {
    const select = document.getElementById("lombaSelect");
    if (!select) return;

    // Reset isi dropdown tapi sisakan opsi pertama
    select.innerHTML = `<option value="">-- Pilih Lomba --</option>`;

    for (const namaLomba in databaseLomba) {
        const opt = document.createElement("option");
        opt.value = namaLomba;
        opt.textContent = namaLomba;
        select.appendChild(opt);
    }
}
