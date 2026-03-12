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
        alert("Pilih lomba dulu!");
        return;
    }

    let peserta = databaseAnak.filter(p => {

        if(kategori && p.kategori !== kategori) return false;

        return true;

    });

    if(peserta.length < 3){
        alert("Peserta kurang dari 3");
        return;
    }

    const rankingLevel = {
        "C-":1,
        "C":2,
        "C+":3,
        "B-":4,
        "B":5,
        "B+":6,
        "A-":7,
        "A":8,
        "A+":9
    };

    peserta.sort((a,b)=>rankingLevel[a.level]-rankingLevel[b.level]);

    const total = peserta.length;

    let jumlahHeat = Math.round(total/4);

    if(jumlahHeat < 1) jumlahHeat = 1;

    let size = Math.ceil(total / jumlahHeat);

    if(size > 5){
        jumlahHeat = Math.ceil(total/5);
        size = Math.ceil(total/jumlahHeat);
    }

    if(size < 3){
        jumlahHeat = Math.floor(total/3);
        size = Math.ceil(total/jumlahHeat);
    }

    let heats = [];

    for(let i=0;i<peserta.length;i+=size){

        heats.push(peserta.slice(i,i+size));

    }

    function shuffle(arr){

        for(let i=arr.length-1;i>0;i--){

            const j = Math.floor(Math.random()*(i+1));

            [arr[i],arr[j]]=[arr[j],arr[i]];

        }

        return arr;

    }

    heats = heats.map(h=>shuffle(h));

    tampilkanHeat(heats);

}

function tampilkanHeat(heats){

    const hasil = document.getElementById("hasilBracket");

    hasil.innerHTML = "";

    heats.forEach((heat,index)=>{

        let html = `<h3>Heat ${index+1}</h3>`;

        html += "<ul>";

        heat.forEach(p=>{

            html += `<li>${p.nama} (Level ${p.level})</li>`;

        });

        html += "</ul>";

        hasil.innerHTML += html;

    });

}

function tampilkanHeat(heats){

    const hasil = document.getElementById("hasilBracket");

    hasil.innerHTML = "";

    heats.forEach((heat,index)=>{

        let html = `<h3>Heat ${index+1}</h3>`;

        html += "<ul>";

        heat.forEach(p=>{

            html += `<li>${p.nama} (Level ${p.level})</li>`;

        });

        html += "</ul>";

        hasil.innerHTML += html;

    });

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









