const chiave = "mappa";
const token = "3819207b-2545-44f5-9bce-560b484b2f0f";
const chiaveTabella = "tableData";

const markerMap = new Map(); // Mappa per tenere traccia dei marker

// Funzione per ottenere coordinate da un indirizzo
const GETMAPPA = (indirizzo) => {
  return new Promise((resolve, reject) => {
    fetch(
      "https://us1.locationiq.com/v1/search?key=pk.869b0a986abed22e19f8fca6de24a2cb&q=" +
        indirizzo +
        "&format=json&"
    )
      .then((r) => r.json())
      .then((r) => {
        resolve(r);
      })
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
        return JSON.parse(result.result) || [];
      } catch {
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

      SETDATI(titolo, indirizzo, lat, lon, dataInizio, dataFine, evento)
        .then(() => {
          const marker = L.marker([lat, lon]).addTo(map);
          marker.bindPopup(`<b>${indirizzo}</b><br/>${titolo}<br/>${evento}`);
          map.setView([lat, lon], zoom);
          markerMap.set(titolo, marker);
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
  return GETTABELLA()
    .then((vecchiDati) => {
      const esiste = vecchiDati.some((posto) => posto.name === titolo);
      if (esiste) {
        console.warn(`Il luogo "${titolo}" esiste già nella cache.`);
        return Promise.resolve();
      }

      const nuoviDati = [
        ...vecchiDati,
        {
          name: titolo,
          address: indirizzo,
          coords: [lat, lon],
          startDate: dataInizio || "N/A",
          endDate: dataFine || "N/A",
          event: evento || "N/A",
        },
      ];
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

  // Pulisce la tabella e i marker sulla mappa
  tableBody.innerHTML = "";
  markerMap.forEach((marker) => map.removeLayer(marker));
  markerMap.clear();

  // Recupera i dati dalla cache
  GETTABELLA()
    .then((posti) => {
      console.log("Dati dalla cache:", posti);

      posti.forEach((posto) => {
        // Verifica che le coordinate siano valide
        if (posto.coords && posto.coords.length === 2) {
          const marker = L.marker(posto.coords).addTo(map);
          marker.bindPopup(`<b>${posto.address}</b><br/>${posto.name}<br/>${posto.event}`);
          markerMap.set(posto.name, marker);
        } else {
          console.warn(`Coordinate non valide per il posto: ${posto.name}`);
        }
      });
    })
    .catch((err) => {
      console.error("Errore durante il recupero dei dati:", err);
    });
}

// Funzione per rimuovere un singolo marker
const removeMarker = (titolo) => {
  const marker = markerMap.get(titolo);

  if (marker) {
    map.removeLayer(marker);
    markerMap.delete(titolo);

    GETTABELLA()
      .then((posti) => {
        const nuoviDati = posti.filter((posto) => posto.name !== titolo);
        return SETTABELLA(nuoviDati);
      })
      .then(() => {
        console.log(`Marker "${titolo}" rimosso.`);
        render();
      })
      .catch((err) => {
        console.error("Errore durante la rimozione:", err);
      });
  } else {
    console.error(`Marker "${titolo}" non trovato.`);
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

export { AddMAP, removeMarker, GETMAPPA, SETDATI, map, zoom, SETTABELLA, GETTABELLA };
