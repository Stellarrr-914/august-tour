async function tambahLomba() {

    const inputField = document.getElementById("inputLomba");

    const value = inputField.value.trim();



    // 1. Pecah input berdasarkan koma

    const parts = value.split(",");

    if (parts.length < 2) {

        alert("Format salah! Minimal: Nama Lomba, Kategori. \nContoh: Balap Kelereng, 1, 2");

        return;

    }



    // 2. Ambil Nama Lomba (elemen pertama)

    const nama = parts[0].trim();

    

    // 3. Ambil Kategori (sisanya) dan gabung jadi string "1, 2"

    const daftarKategori = parts.slice(1).map(k => k.trim()).join(", ");



    if (databaseLomba[nama]) {

        alert("Lomba '" + nama + "' sudah ada!");

        return;

    }



    const urlAPI = "https://script.google.com/macros/s/AKfycbwDTST0zknCALaYFju9wMSvD2zHIi9xBJr-0Kuq23ALGXChSgbUl0WFo8a8MoVsYQmD/exec"; 



    try {

        inputField.disabled = true;



        await fetch(urlAPI, {

            method: "POST",

            body: JSON.stringify({

                type: "tambahLomba",

                namaLomba: nama,

                kategoriLomba: daftarKategori,

                status: "Open"

            })

        });



        // Simpan ke database lokal

        databaseLomba[nama] = {

            kategori: daftarKategori,

            status: "Open",

            peserta: []

        };

        

        localStorage.setItem("databaseLomba", JSON.stringify(databaseLomba));



        // Reset

        inputField.value = "";

        inputField.disabled = false;

        

        tampilLomba();

        updateLombaDropdown();

        

        alert("Lomba '" + nama + "' dengan kategori [" + daftarKategori + "] berhasil ditambah!");



    } catch (error) {

        console.error(error);

        inputField.disabled = false;

        alert("Gagal kirim data ke Google Sheets.");

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
