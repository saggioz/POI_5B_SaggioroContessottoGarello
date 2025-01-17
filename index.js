import { createNavigator } from "./navigator.js";

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