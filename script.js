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
        tampilAnak();

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



// ======= LOGIN =======
function login(){

    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    if(u === admin.username && p === admin.password){

        localStorage.setItem("sudahLogin","true");

        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");

    }else{

        alert("Username / Password salah!");

    }

}



// ======= NAVIGASI =======
function showDatabase(){

    document.getElementById("mainMenu").classList.add("hidden");
    document.getElementById("databasePage").classList.remove("hidden");

    tampilAnak();
    tampilLomba();

}

function showBracket(){

    document.getElementById("mainMenu").classList.add("hidden");
    document.getElementById("bracketPage").classList.remove("hidden");

    updateLombaDropdown();

}

function backToMenu(){

    document.getElementById("databasePage").classList.add("hidden");
    document.getElementById("bracketPage").classList.add("hidden");
    document.getElementById("mainMenu").classList.remove("hidden");

}

function logout(){

    localStorage.removeItem("sudahLogin");
    location.reload();

}

// ======= DATABASE ANAK =======
async function tambahPeserta(){

    const input = document
        .getElementById("inputPeserta")
        .value;

    const parts = input.split(",");

    if(parts.length !== 3){

        alert("Format: Nama,Kategori,Level");

        return;

    }

    const nama = parts[0].trim();
    const kategori = parts[1].trim();
    const level = parts[2].trim();

    const urlAPI = "https://script.google.com/macros/s/AKfycbwpp18nPBME5NaMZwKGwOsn1Bj5uJT7a6OH9XpOkeHaqHZdX7gsxZvqA1MVGmnZNMAz/exec";

    await fetch(urlAPI,{
        method:"POST",
        body: JSON.stringify({
            nama:nama,
            kategori:kategori,
            level:level
        })
    });

    alert("Peserta berhasil ditambah!");

}

function cariPeserta(){

    const keyword = document
        .getElementById("inputPeserta")
        .value
        .toLowerCase();

    const hasil = databaseAnak.filter(a =>
        a.nama.toLowerCase().includes(keyword)
    );

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
        <td>edit / hapus</td>
        </tr>
        `;

    });

}



// ======= DATABASE LOMBA =======
function tambahLomba(){

    const nama = document.getElementById("namaLomba").value.trim();

    if(!nama) return;

    if(databaseLomba[nama]){

        alert("Lomba sudah ada");
        return;

    }

    databaseLomba[nama] = [];

    document.getElementById("namaLomba").value = "";

    tampilLomba();

}



function tampilLomba(){

    const tabel = document.getElementById("tabelLomba");

    tabel.innerHTML = "";

    let i=1;

    for(const lomba in databaseLomba){

        tabel.innerHTML += `
        <tr>
        <td>${i}</td>
        <td>${lomba}</td>
        <td>edit / hapus</td>
        </tr>
        `;

        i++;

    }

}



// ======= BRACKET =======
function updateLombaDropdown(){

    const select = document.getElementById("lombaSelect");

    select.innerHTML = `<option value="">-- Pilih Lomba --</option>`;

    for(const lomba in databaseLomba){

        const opt = document.createElement("option");

        opt.value = lomba;
        opt.textContent = lomba;

        select.appendChild(opt);

    }

}



// ======= TAMPIL PESERTA =======
function tampilkanPesertaBracket(){

    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;

    const div = document.getElementById("pesertaLomba");

    div.innerHTML = "";

    if(!lomba){
        alert("Pilih lomba dulu brok!");
        return;
    }

    let list = databaseAnak;

    if(kategori){

        list = list.filter(p => p.kategori == parseInt(kategori));

    }

    if(list.length === 0){

        div.innerHTML = "Belum ada peserta";

        return;

    }

    const html = list.map((p,i)=>{

        return `<input type="checkbox" id="ikut${i}" checked> ${p.nama} (${p.level})<br>`;

    }).join("");

    div.innerHTML = html;

}



// ======= GENERATE HEAT =======
function generateBracket(){

    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;

    if(!lomba){

        alert("Pilih lomba dulu brok!");

        return;

    }

    let list = databaseAnak;

    if(kategori){

        list = list.filter(p => p.kategori == parseInt(kategori));

    }

    const pesertaDipakai = [];

    list.forEach((p,i)=>{

        const cb = document.getElementById(`ikut${i}`);

        if(cb && cb.checked){

            pesertaDipakai.push(p);

        }

    });

    if(pesertaDipakai.length === 0){

        alert("Tidak ada peserta!");

        return;

    }

    const ranking = {

        "A+":8,"A":7,"A-":6,
        "B+":5,"B":4,"B-":3,
        "C+":2,"C":1

    };

    pesertaDipakai.sort((a,b)=> ranking[a.level] - ranking[b.level]);

    const hasil = document.getElementById("hasilBracket");

    hasil.innerHTML = "";

    const heats = buatHeatPrioritas4Stabil(pesertaDipakai);

    heats.forEach((heat,index)=>{

        hasil.innerHTML += `<b>Heat ${index+1}</b><br>`;

        heat.forEach(p=>{

            hasil.innerHTML += `${p.nama} (${p.level})<br>`;

        });

        hasil.innerHTML += "<br>";

    });

}



// ======= SISTEM HEAT =======
function buatHeatPrioritas4Stabil(pesertaList){

    const heats = [];

    let index = 0;

    const total = pesertaList.length;

    while(index < total){

        let sisa = total - index;

        let size = 4;

        if(sisa === 3 || sisa === 5) size = sisa;
        else if(sisa === 6) size = 3;
        else if(sisa === 7) size = 4;
        else if(sisa === 8) size = 4;

        const heat = pesertaList.slice(index, index + size);

        heats.push(heat);

        index += size;

    }

    return heats;

}



// ======= LOAD SAAT WEBSITE DIBUKA =======
window.onload = function(){

    loadDataFromSheet();

    const loginStatus = localStorage.getItem("sudahLogin");

    if(loginStatus === "true"){

        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");

    }

};


