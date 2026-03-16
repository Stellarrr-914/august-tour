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

    // MASUKKAN KE DATABASE LOCAL JUGA
    databaseAnak.push({
        nama:nama,
        kategori:kategori,
        level:level
    });

    // UPDATE TABEL TANPA REFRESH
    tampilAnak();

    document.getElementById("inputPeserta").value = "";

    alert("Peserta berhasil ditambah!");

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

            // kategori
            if(!isNaN(k)){
                return p.kategori == k;
            }

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



function tampilAnak(){

    const tabel = document.getElementById("tabelAnak");

    tabel.innerHTML = "";

    databaseAnak.forEach((anak,i)=>{

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
