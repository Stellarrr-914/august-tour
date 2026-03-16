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