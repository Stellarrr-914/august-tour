// ======= DATA =======
const admin = { username: "admin", password: "1234" };
const databaseAnak = [];
const databaseLomba = {};

// ======= LOGIN =======
function login(){
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    if(u === admin.username && p === admin.password){
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");
    } else {
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

// ======= DATABASE ANAK =======
function tambahAnak(){
    const nama = document.getElementById("namaAnak").value.trim();
    if(!nama) return;

    const ada = databaseAnak.find(a => a.nama.toLowerCase() === nama.toLowerCase());
    if(ada){ alert(nama + " sudah ada di database!"); return; }

    const kategori = parseInt(prompt("Kategori anak (1-4)?"));
    if(!kategori || kategori<1 || kategori>4){ alert("Kategori harus 1-4"); return; }

    const validLevel = ["A+","A","A-","B+","B","B-","C+","C"];
    const level = prompt("Level anak (A+, A, A-, B+, B, B-, C+, C)?").toUpperCase();
    if(!validLevel.includes(level)){ alert("Level tidak valid"); return; }

    databaseAnak.push({nama,kategori,level});
    document.getElementById("namaAnak").value = "";
    tampilAnak();
}

function tampilAnak(){
    const tabel = document.getElementById("tabelAnak");
    tabel.innerHTML = "";
    databaseAnak.forEach((anak,i)=>{
        tabel.innerHTML += `<tr>
        <td>${i+1}</td>
        <td>${anak.nama}</td>
        <td>${anak.kategori}</td>
        <td>${anak.level}</td>
        <td>edit / hapus</td>
        </tr>`;
    });
}

// ======= DATABASE LOMBA =======
function tambahLomba(){
    const nama = document.getElementById("namaLomba").value.trim();
    if(!nama) return;
    if(databaseLomba[nama]){ alert("Lomba sudah ada"); return; }
    databaseLomba[nama] = [];
    document.getElementById("namaLomba").value = "";
    tampilLomba();
}

function tampilLomba(){
    const tabel = document.getElementById("tabelLomba");
    tabel.innerHTML = "";
    let i=1;
    for(const lomba in databaseLomba){
        tabel.innerHTML += `<tr>
        <td>${i}</td>
        <td>${lomba}</td>
        <td>edit / hapus</td>
        </tr>`;
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

// tampil peserta sesuai kategori
function tampilkanPesertaBracket(){
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    const div = document.getElementById("pesertaLomba");
    div.innerHTML = "";

    if(!lomba) return alert("Pilih lomba dulu brok!");

    // filter peserta sesuai kategori (jika ada)
    let list = databaseAnak;
    if(kategori) list = list.filter(p => p.kategori == parseInt(kategori));

    if(list.length === 0){ div.innerHTML = "Belum ada peserta"; return; }

    // tampilkan dengan checkbox ikut
    const html = list.map((p,i)=>{
        return `<input type="checkbox" id="ikut${i}" data-index="${i}" checked> ${p.nama} (${p.level})<br>`;
    }).join("");
    div.innerHTML = html;
}

// generate heat pakai yang dicentang
function generateBracket(){
    const lomba = document.getElementById("lombaSelect").value;
    const kategori = document.getElementById("kategoriSelect").value;
    if(!lomba) return alert("Pilih lomba dulu brok!");

    let list = databaseAnak;
    if(kategori) list = list.filter(p => p.kategori == parseInt(kategori));

    // ambil yang dicentang
    const pesertaDipakai = [];
    list.forEach((p,i)=>{
        const cb = document.getElementById(`ikut${i}`);
        if(cb && cb.checked) pesertaDipakai.push(p);
    });

    if(pesertaDipakai.length === 0) return alert("Tidak ada peserta yang ikut brok!");

    // ranking
    const ranking = { "A+":8,"A":7,"A-":6, "B+":5,"B":4,"B-":3, "C+":2,"C":1 };
    
    // urut level rendah ke tinggi biar heat awal = lemah
    pesertaDipakai.sort((a,b)=> ranking[a.level] - ranking[b.level]);

    const hasil = document.getElementById("hasilBracket");
    hasil.innerHTML = "";


    // buat heat prioritas 4, 3–5 peserta
    const heats = buatHeatPrioritas4(pesertaDipakai);

    heats.forEach((heat,index)=>{
        hasil.innerHTML += `<b>Heat ${index+1}</b><br>`;
        heat.forEach(p=>{
            hasil.innerHTML += `${p.nama} (${p.level})<br>`;
        });
        hasil.innerHTML += "<br>";
    });
}

// fungsi heat prioritas 4
function buatHeatPrioritas4(pesertaList){
    const total = pesertaList.length;
    const heats = [];
    let index = 0;

    while(index < total){
        let sisa = total - index;
        let size = 4; // prioritas 4

        if(sisa === 3 || sisa === 5) size = sisa; // sisa 3 atau 5 jadi satu heat
        else if(sisa < 3 && heats.length > 0){
            // gabung sisa <3 ke heat sebelumnya
            heats[heats.length-1] = heats[heats.length-1].concat(pesertaList.slice(index,total));
            break;
        }

        heats.push(pesertaList.slice(index, index + size));
        index += size;
    }

    return heats;

}
