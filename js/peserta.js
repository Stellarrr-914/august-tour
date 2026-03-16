async function tambahPeserta(){

    const input = document.getElementById("inputPeserta").value;

    const parts = input.split(",");

    if(parts.length !== 3){
        alert("Format: Nama,Kategori,Level");
        return;
    }

    const nama = parts[0].trim();
    const kategori = parseInt(parts[1].trim());
    const level = parts[2].trim().toUpperCase();

    const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

    await fetch(urlAPI,{
        method:"POST",
        body: JSON.stringify({
            nama:nama,
            kategori:kategori,
            level:level
        })
    });

    databaseAnak.push({
        nama:nama,
        kategori:kategori,
        level:level
    });

    tampilAnak();

    document.getElementById("inputPeserta").value = "";

    alert("Peserta berhasil ditambah!");

}