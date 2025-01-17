import { table } from './tabella.js';
import { AddMAP } from './progetto.js';
import { GETMAPPA, SETDATI, map, zoom } from './progetto.js';

const ModifyButton = document.getElementById("modifyButton");
const DeleteButton = document.getElementById("deleteButton");

/* Funzione per creare e gestire un form all'interno di una modale */
const createForm = () => {
    let data = [];
    let callback = null;

    const modal = document.getElementById("modal");
    if (!modal) {
        console.error("Elemento modale non trovato!");
        return;
    }
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
        render: (selectedElement = null) => {
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

            if (selectedElement) {
                // Popola il form con i dati dell'elemento selezionato
                data.forEach(([fieldId]) => {
                    const cell = selectedElement.querySelector(`[data-field="${fieldId}"]`);
                    if (cell) {
                        document.getElementById(fieldId).value = cell.innerText;
                    }
                });
            }

            openModal();
        },
    };
};

const form = createForm();
form.setlabels([
    ["Luogo", "text"],
    ["Data Inizio", "date"],
    ["Data Fine", "date"],
    ["Evento", "text"]
]);

// Callback per l'inserimento nella tabella
form.submit((formData) => {
    console.log("Dati inviati:", formData);

    const campiObbligatori = ["Luogo", "Data Inizio", "Data Fine", "Evento"];
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

    const dataInserita = new Date(formData["Data Inizio"]).getTime();
    const oggi = Date.now();

    if (dataInserita < oggi) {
        console.error("La data non può essere precedente a oggi!");
        return;
    }

    const nuovaRiga = [
        formData["Luogo"],
        formData["Data Inizio"],
        formData["Data Fine"],
        formData["Evento"]
    ];
    table.addRow(nuovaRiga);

    const luogo = formData["Luogo"];
    const data_inizio = formData["Data Inizio"];
    const data_fine = formData["Data Fine"];
    const event = formData["Evento"];
    const titolo = `
        <b>${luogo}</b><br/>
        Data Inizio: ${data_inizio}<br/>
        Data Fine: ${data_fine}<br/>
        Evento: ${event}<br/>
    `;

    AddMAP(luogo, titolo, GETMAPPA, SETDATI, map, zoom);
});
table.load();

const createPromptModal = (title, callback) => {
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" id="closePromptButton">&times;</span>
            <h2>${title}</h2>
            <div class="form-group">
                <label for="promptInput">Luogo</label>
                <input type="text" id="promptInput" class="form-control"/>
            </div>
            <div id="promptMessage"></div>
            <button type="button" class="btn btn-primary" id="promptSubmit">OK</button>
            <button type="button" class="btn btn-secondary" id="promptCancel">Annulla</button>
        </div>
    `;

    document.body.appendChild(modal);

    const closePromptModal = () => {
        modal.style.display = "none";
        document.body.removeChild(modal);
    };

    document.getElementById("closePromptButton").onclick = closePromptModal;
    document.getElementById("promptCancel").onclick = closePromptModal;

    document.getElementById("promptSubmit").onclick = () => {
        const luogo = document.getElementById("promptInput").value;
        if (luogo) {
            callback(luogo);
            closePromptModal();
        } else {
            document.getElementById("promptMessage").innerText = "Inserisci un nome valido.";
        }
    };

    modal.style.display = "block";
};

ModifyButton.onclick = () => {
    createPromptModal("Modifica Luogo", (luogo) => {
        const selectedElement = getElementByLuogo(luogo);
        if (selectedElement) {
            form.render(selectedElement);
        } else {
            alert("Luogo non trovato.");
        }
    });
};

DeleteButton.onclick = () => {
    createPromptModal("Elimina Luogo", (luogo) => {
        const selectedElement = getElementByLuogo(luogo);
        if (selectedElement) {
            if (confirm("Sei sicuro di voler eliminare questo elemento?")) {
                const index = getElementIndex(selectedElement);
                table.deleteRow(index);
            }
        } else {
            alert("Luogo non trovato.");
        }
    });
};

const getSelectedElement = () => {
    return document.querySelector(".selected");
};

const getElementByLuogo = (luogo) => {
    const rows = document.querySelectorAll("#table tbody tr");
    for (let row of rows) {
        const cell = row.querySelector('[data-field="LUOGO"]');
        if (cell && cell.innerText === luogo) {
            return row;
        }
    }
    return null;
};

const getElementIndex = (element) => {
    return Array.from(element.parentNode.children).indexOf(element);
};

// Bottone per aprire la modale
document.getElementById("openModalButton").onclick = () => {
    form.render();
};