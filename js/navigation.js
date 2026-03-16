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