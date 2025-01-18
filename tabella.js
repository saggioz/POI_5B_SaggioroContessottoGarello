import { SETTABELLA, GETTABELLA } from './progetto.js';
import { removeMarker } from './progetto.js';

const createTable = (parentElement) => {
    let data = [];
    let headers = [];
    let originale = [];
    return {
        build: (dataInput) => {
            headers = dataInput[0];
            data = dataInput;
            originale = dataInput;
        },
        render: () => {
            let htmlTable = "<table class='table table-bordered'>";
            htmlTable += "<thead><tr>" + headers.map((header) => `<th>${header}</th>`).join("") + "</tr></thead>";
            htmlTable += "<tbody>" + 
                data.map((row, index) => 
                    `<tr data-index="${index}">
                        ${row.map((col) => `<td>${col}</td>`).join("")}
                    </tr>`
                ).join("") + 
            "</tbody>";
            htmlTable += "</table>";
            parentElement.innerHTML = htmlTable;
        },
        addRow: function (newRow) {
            data.push(newRow);
            this.render();
            SETTABELLA(data).catch((err) => {
                console.error("Errore durante il salvataggio della tabella nella cache:", err);
            });
        },
        editRow: function (index, newRow) {
            data[index] = newRow;
            this.render();
            SETTABELLA(data).catch((err) => {
                console.error("Errore durante il salvataggio della tabella nella cache:", err);
            });
        },
        deleteRow: function (index) {
            const titolo = data[index][0].trim(); // Rimuove spazi all'inizio e alla fine
            console.log(`Rimozione del marker con titolo: ${titolo}`); // Log per verifica
            removeMarker(titolo);
            data.splice(index, 1);
            this.render();
            SETTABELLA(data).catch((err) => {
                console.error("Errore durante il salvataggio della tabella nella cache:", err);
            });
        },
   
        filter: function(cerca) {
            if (cerca === "") {
                data = originale;
            } else {
                data = originale.filter(row => 
                    row[0].toLowerCase().includes(cerca.toLowerCase())
                );
            }
            this.render();
        },
        load: function () {
            GETTABELLA().then((cachedData) => {
                originale = cachedData;
                data = cachedData;
                this.render();
            }).catch((err) => {
                console.error("Errore durante il caricamento dei dati dalla cache:", err);
            });
        },
    };
};

const table = createTable(document.querySelector("#table"));
table.build([["LUOGO", "DATA INIZIO", "DATA FINE", "EVENTO"]]);
table.load();

document.getElementById("bottoneRicerca").onclick = () => {
    const cerca = document.getElementById("ricerca").value;
    table.filter(cerca);
};

export { table };