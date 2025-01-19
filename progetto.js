const chiave = "mappa";
const token = "3819207b-2545-44f5-9bce-560b484b2f0f";
const chiaveTabella = "tableData";

const markerMap = new Map(); // Mappa per tenere traccia dei marker

// Funzione per rimuovere HTML e spazi indesiderati dai dati
const cleanHTML = (input) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = input;
  return tempDiv.textContent || tempDiv.innerText || "";
};

// Funzione per ottenere coordinate da un indirizzo
const GETMAPPA = (indirizzo) => {
  return new Promise((resolve, reject) => {
    fetch(
      "https://us1.locationiq.com/v1/search?key=pk.869b0a986abed22e19f8fca6de24a2cb&q=" +
        indirizzo +
        "&format=json&"
    )
      .then((r) => r.json())
      .then((r) => resolve(r))
      .catch((error) => reject(error));
  });
};

// Salvataggio della tabella nella cache
const SETTABELLA = (data) => {
  return fetch("https://ws.cipiaceinfo.it/cache/set", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      key: token,
    },
    body: JSON.stringify({
      key: chiaveTabella,
      value: JSON.stringify(data),
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Errore durante il salvataggio della tabella nella cache:", error);
    });
};

// Recupero della tabella dalla cache
const GETTABELLA = () => {
  return fetch("https://ws.cipiaceinfo.it/cache/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      key: token,
    },
    body: JSON.stringify({
      key: chiaveTabella,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      try {
        const data = JSON.parse(result.result) || [];
        console.log("Dati recuperati dalla cache:", data); // Log dettagliato
        return data;
      } catch {
        console.warn("Cache vuota o dati non validi.");
        return [];
      }
    })
    .catch((error) => {
      console.error("Errore durante il recupero della tabella dalla cache:", error);
      return [];
    });
};

// Funzione per aggiungere un marker alla mappa e salvare nella cache
const AddMAP = (indirizzo, titolo, dataInizio, dataFine, evento, GETMAPPA, SETDATI, map, zoom) => {
  GETMAPPA(indirizzo)
    .then((result) => {
      if (result.length === 0) {
        console.error("Indirizzo non trovato!");
        return;
      }
      const luogo = result[0];
      const lat = luogo.lat;
      const lon = luogo.lon;

      const normalizedTitle = cleanHTML(titolo);
      if (markerMap.has(normalizedTitle)) {
        console.warn(`Il marker "${normalizedTitle}" esiste già.`);
        return;
      }

      SETDATI(normalizedTitle, indirizzo, lat, lon, dataInizio, dataFine, evento)
        .then(() => {
          const marker = L.marker([lat, lon]).addTo(map);
          marker.bindPopup(`<b>${indirizzo}</b><br/>${normalizedTitle}<br/>${evento}`);
          map.setView([lat, lon], zoom);
          markerMap.set(normalizedTitle, marker);
        })
        .catch((err) => {
          console.error("Errore durante il salvataggio dei dati:", err);
        });
    })
    .catch((err) => {
      console.error("Errore durante la ricerca dell'indirizzo:", err);
    });
};

// Funzione per salvare i dati nella cache evitando duplicati
const SETDATI = (titolo, indirizzo, lat, lon, dataInizio, dataFine, evento) => {
  return GETTABELLA() // Recupera i dati esistenti
    .then((vecchiDati) => {
      const normalizedTitle = cleanHTML(titolo);

      // Controlla se il titolo esiste già nella cache
      const esiste = vecchiDati.some((posto) => cleanHTML(posto.name) === normalizedTitle);
      if (esiste) {
        console.warn(`Il luogo "${normalizedTitle}" esiste già nella cache.`);
        return Promise.resolve();
      }

      // Accumula i nuovi dati
      const nuoviDati = [
        ...vecchiDati, // Mantieni i dati esistenti
        {
          name: normalizedTitle,
          address: indirizzo,
          coords: [lat, lon],
          startDate: dataInizio || "N/A",
          endDate: dataFine || "N/A",
          event: evento || "N/A",
        },
      ];

      // Salva i dati aggiornati
      return SETTABELLA(nuoviDati);
    })
    .catch((error) => {
      console.error("Errore durante il salvataggio dei dati:", error);
    });
};

// Funzione per visualizzare tutti i marker dalla cache
function render() {
  const tableBody = document.querySelector("#tableBody");
  if (!tableBody) {
    console.error("Elemento tableBody non trovato!");
    return;
  }
  // Recupera i dati dalla cache
  GETTABELLA()
    .then((posti) => {
      console.log("Dati dalla cache:", posti);
      posti.forEach((posto) => {
        const normalizedTitle = cleanHTML(posto.name);
        if (!markerMap.has(normalizedTitle) && posto.coords && posto.coords.length === 2) {
          markerMap.set(normalizedTitle, posto);
        }
      });
      markerMap.forEach((posto) => {
        const marker = L.marker(posto.coords).addTo(map);
        marker.bindPopup(`
          <b>${posto.address}</b><br/>
          <a href="#detail_${posto.name}" class="marker-link">${posto.name}</a><br/>
          ${posto.event}
        `);
        markerMap.set(cleanHTML(posto.name), marker);
      });
    })
    .catch((err) => {
      console.error("Errore durante il recupero dei dati:", err);
    });
}

// Funzione per rimuovere un singolo marker
const removeMarker = (titolo) => {
  const normalizedTitle = cleanHTML(titolo);
  const marker = markerMap.get(normalizedTitle);

  if (marker) {
    map.removeLayer(marker);
    markerMap.delete(normalizedTitle);

    GETTABELLA()
      .then((posti) => {
        const nuoviDati = posti.filter((posto) => cleanHTML(posto.name) !== normalizedTitle);
        return SETTABELLA(nuoviDati);
      })
      .then(() => {
        console.log(`Marker "${normalizedTitle}" rimosso.`);
        render();
      })
      .catch((err) => {
        console.error("Errore durante la rimozione:", err);
      });
  } else {
    console.error(`Marker "${normalizedTitle}" non trovato.`);
  }
};

// Configurazione della mappa
let zoom = 6;
let maxZoom = 19;
let map = L.map("map").setView([39.5, -3.0], zoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: maxZoom,
  attribution:
    '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Assicura il rendering al caricamento del DOM
document.addEventListener("DOMContentLoaded", () => {
  render();
});

export { AddMAP, removeMarker, GETMAPPA, SETDATI, map, zoom, SETTABELLA, GETTABELLA, cleanHTML };