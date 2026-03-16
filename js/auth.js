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


function logout(){

    localStorage.removeItem("sudahLogin");
    location.reload();

}