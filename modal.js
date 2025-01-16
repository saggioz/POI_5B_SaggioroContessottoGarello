import { table } from './tabella.js';
import { AddMAP } from './progetto.js';
import { GETMAPPA, SETDATI, map, zoom } from './progetto.js';

/* Funzione per creare e gestire un form all'interno di una modale */
const createForm = () => {
    let data = [];
    let callback = null;

    const modal = document.getElementById("modal");
    modal.style.display = "none";

    const closeModal = () => {
        modal.style.display = "none";
    };

    const openModal = () => {
        modal.style.display = "block";
    };

    const renderModalContent = () => {
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button" id="closeButton">&times;</span>
                <div id="formContent"></div>
                <div id="Message"></div>
                <button type="button" class="btn btn-primary" id="submit">AGGIUNGI</button>
                <button type="button" class="btn btn-secondary" id="cancel">ANNULLA</button>
            </div>
        `;

        document.getElementById("closeButton").onclick = closeModal;
        document.getElementById("cancel").onclick = closeModal;

        const submitButton = document.getElementById("submit");
        submitButton.onclick = () => {
            const result = {};
            let isValid = true;

            data.forEach(([fieldId]) => {
                const value = document.getElementById(fieldId).value;
                if (!value) isValid = false;
                result[fieldId] = value;
            });

            console.log("Dati inviati: ", result);

            if (callback) {
                callback(result);
            }

            closeModal();
        };
    };

    return {
        setlabels: (labels) => { data = labels; },
        submit: (callbackInput) => { callback = callbackInput; },
        render: () => {
            renderModalContent();
            const formContent = document.getElementById("formContent");

            formContent.innerHTML = data.map(([label, type, options]) => {
                if (type === "dropdown") {
                    return `
                        <div class="form-group">
                            <label>${label}</label>
                            <select id="${label}" class="form-control">
                                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
                            </select>
                        </div>`;
                }
                return `
                    <div class="form-group">
                        <label>${label}</label>
                        <input type="${type}" id="${label}" class="form-control"/>
                    </div>`;
            }).join("\n");

            openModal();
        },
    };
};

const form = createForm();
form.setlabels([
    ["Indirizzo", "text"],
    ["Targa1", "text"],
    ["Targa2", "text"],
    ["Targa3", "text"],
    ["Data", "date"],
    ["Orario", "time"],
    ["Numero feriti", "number"],
    ["Numero morti", "number"]
]);

// Callback per l'inserimento nella tabella
form.submit((formData) => {
    console.log("Dati inviati:", formData);

    const campiObbligatori = ["Indirizzo", "Data", "Orario", "Numero feriti", "Numero morti"];
    let isValid = true;

    // Controllo dei campi obbligatori
    campiObbligatori.forEach((fieldId) => {
        const value = formData[fieldId];
        if (!value) {
            isValid = false;
        }
    });

    if (!isValid) {
        document.getElementById("Message").innerText = "Compilare tutti i campi obbligatori!";
        return;
    }

    const dataInserita = new Date(formData["Data"]).getTime();
    const oggi = Date.now();

    if (dataInserita < oggi) {
        console.error("La data non può essere precedente a oggi!");
        return;
    }

    const targhe = [
    formData["Targa1"],
    formData["Targa2"],
    formData["Targa3"]
    ].filter((targa) => targa);

    const nuovaRiga = [
        formData["Indirizzo"],
        targhe.join(", "),
        formData["Data"],
        formData["Orario"],
        formData["Numero feriti"],
        formData["Numero morti"]
    ];
    table.addRow(nuovaRiga);

    const indirizzo = formData["Indirizzo"];
    const data = formData["Data"];
    const orario = formData["Orario"];
    const numeroFeriti = formData["Numero feriti"];
    const numeroMorti = formData["Numero morti"];
    const titolo = `
        <b>Incidente</b><br/>
        Data: ${data}<br/>
        Orario: ${orario}<br/>
        Numero feriti: ${numeroFeriti}<br/>
        Numero morti: ${numeroMorti}
    `;

    AddMAP(indirizzo, titolo, GETMAPPA, SETDATI, map, zoom);
});
table.load();

// Bottone per aprire la modale
document.getElementById("openModalButton").onclick = () => {
    form.render();
};