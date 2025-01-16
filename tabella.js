import { SETTABELLA, GETTABELLA } from './progetto.js';
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
            htmlTable += "<tr>" + data[0].map((col) => `<td>${col}</td>`).join("") + "</tr>";
            htmlTable += "<tbody>" + 
                data.slice(1).map((row) => 
                    "<tr>" + row.map((col) => 
                        `<td>${col}</td>`
                    ).join("") + "</tr>"
                ).join("") + "</tbody>";
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
table.build([["INDIRIZZO", "TARGHE COINVOLTE", "DATA", "ORA", "NUMERO FERITI", "NUMERO MORTI"]]);
table.load();

document.getElementById("bottoneRicerca").onclick = () => {
    const cerca = document.getElementById("ricerca").value;
    table.filter(cerca);
};

export { table };