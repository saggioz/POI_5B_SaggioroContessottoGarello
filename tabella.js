import { SETTABELLA, GETTABELLA, removeMarker, cleanHTML } from './progetto.js';

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
            removeMarker(titolo); // Rimuovi il marker dalla mappa
            data.splice(index, 1);
            this.render();

            // Aggiorna la cache dopo aver rimosso la riga
            SETTABELLA(data).catch((err) => {
                console.error("Errore durante il salvataggio della tabella nella cache:", err);
            });
        },
        filter: function (cerca) {
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
            GETTABELLA()
              .then((cachedData) => {
                console.log("Dati recuperati dalla cache:", cachedData);
          
                if (!cachedData || cachedData.length === 0) {
                  console.warn("Nessun dato trovato nella cache.");
                  return;
                }
          
                // Trasformazione e normalizzazione dei dati
                const uniqueData = new Map(); // Usa una mappa per rimuovere duplicati
                cachedData.forEach((item) => {
                  if (Array.isArray(item)) {
                    uniqueData.set(item[0], item);
                  } else {
                    const cleanedName = cleanHTML(item.name || "N/A");
                    if (!uniqueData.has(cleanedName)) {
                      uniqueData.set(cleanedName, [
                        cleanedName,
                        item.startDate || "N/A",
                        item.endDate || "N/A",
                        cleanHTML(item.event || "N/A"),
                      ]);
                    }
                  }
                });
          
                // Popola i dati originali e li visualizza nella tabella
                originale = Array.from(uniqueData.values()).filter(row => row[0] !== "N/A");
                data = [...originale];
                console.log("Dati originali sincronizzati:", originale);
                this.render();
              })
              .catch((err) => {
                console.error("Errore durante il caricamento dei dati dalla cache:", err);
              });
          }
    };
};

// Seleziona l'elemento della tabella e inizializza
const table = createTable(document.querySelector("#table"));
table.build([["LUOGO", "DATA INIZIO", "DATA FINE", "EVENTO"]]);
table.load();

export { table };