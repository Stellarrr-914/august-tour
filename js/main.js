window.onload = function() {
    if (typeof loadDataFromSheet === "function") {
        loadDataFromSheet();
    const loginStatus = localStorage.getItem("sudahLogin");

    const loginPage = document.getElementById("loginPage");
    const mainMenu = document.getElementById("mainMenu");

    if(loginStatus === "true"){

        if(loginPage) loginPage.classList.add("hidden");
        if(mainMenu) mainMenu.classList.remove("hidden");

    }

};
