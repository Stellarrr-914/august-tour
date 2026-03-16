function login(){

    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    if(u === admin.username && p === admin.password){

        localStorage.setItem("sudahLogin","true");

        // pindah ke halaman menu
        window.location.href = "menu.html";

    }else{

        alert("Username / Password salah!");

    }

}


function logout(){

    localStorage.removeItem("sudahLogin");

    window.location.href = "index.html";

}
