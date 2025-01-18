import { createNavigator } from "./navigator.js";
import { table } from "./tabella.js";

const navigator = createNavigator(document.querySelector("#app"));

document.getElementById("homeButton").onclick = () => {
    window.location.hash = "#home";
};

document.getElementById("adminButton").onclick = () => {
    window.location.hash = "#admin";
};

document.getElementById("detailButton").onclick = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
        const id = selectedElement.getAttribute("data-id");
        window.location.hash = `#detail_${id}`;
    } else {
        alert("Seleziona un elemento per vedere i dettagli.");
    }
};

const getSelectedElement = () => {
    return document.querySelector(".selected");
};

document.getElementById("home").querySelector("#bottoneRicerca").onclick = () => {
    const cerca = document.getElementById("home").querySelector("#ricerca").value;
    table.filter(cerca);
};

document.getElementById("admin").querySelector("#bottoneRicerca").onclick = () => {
    const cerca = document.getElementById("admin").querySelector("#ricerca").value;
    table.filter(cerca);
};