window.onload = function(){

    loadDataFromSheet();

    const loginStatus = localStorage.getItem("sudahLogin");

    if(loginStatus === "true"){

        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");

    }

};