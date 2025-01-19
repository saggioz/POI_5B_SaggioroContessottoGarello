const chiave = "mappa";
const token = "3819207b-2545-44f5-9bce-560b484b2f0f";
const chiaveTabella = "tableData";

const markerMap = new Map(); // Mappa per tracciare i marker

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
      `https://us1.locationiq.com/v1/search?key=pk.869b0a986abed22e19f8fca6de24a2cb&q=${indirizzo}&format=json`
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
        return data;
      } catch {
        return [];
      }
    })
    .catch((error) => {
      console.error("Errore durante il recupero della tabella dalla cache:", error);
      return [];
    });
};

// Funzione per aggiungere un marker alla mappa
const AddMAP = (indirizzo, titolo, dataInizio, dataFine, evento, GETMAPPA, SETDATI, map, zoom) => {
  GETMAPPA(indirizzo)
    .then((result) => {
      if (result.length === 0) {
        console.error("Indirizzo non trovato!");
        return;
      }
      const luogo = result[0];
      const lat = luogo.lat || luogo.latitude;
      const lon = luogo.lon || luogo.longitude;

      if (!lat || !lon) {
        console.error("Coordinate non trovate!");
        return;
      }

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
          render();
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
      const normalizedTitle = cleanHTML(titolo);

      const esiste = vecchiDati.some((posto) => cleanHTML(posto.name) === normalizedTitle);
      if (esiste) {
        console.warn(`Il luogo "${normalizedTitle}" esiste già nella cache.`);
        return Promise.resolve();
      }

      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        console.error(`Dati non validi per il luogo "${normalizedTitle}": lat/lon non validi.`);
        return Promise.reject(new Error("Dati non validi: lat/lon non numerici."));
      }

      const nuoviDati = [
        ...vecchiDati,
        {
          name: normalizedTitle,
          address: indirizzo,
          coords: [parsedLat, parsedLon],
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
      .catch((err) => {
        console.error("Errore durante la rimozione:", err);
      });
  } else {
    console.error(`Marker "${normalizedTitle}" non trovato.`);
  }
};

// Funzione per visualizzare i dati e aggiungere i marker salvati nella mappa
const render = () => {
  GETTABELLA()
    .then((dati) => {
      if (!dati || dati.length === 0) {
        console.log("Nessun dato trovato nella cache.");
        return;
      }

      // Rimuovi tutti i marker esistenti
      markerMap.forEach((marker) => {
        map.removeLayer(marker);
      });
      markerMap.clear();

      dati.forEach((posto, index) => {
        const { name, address, coords, event } = posto;

        if (!name || !Array.isArray(coords) || coords.length !== 2 || coords.some(isNaN)) {
          console.error(`Dati non validi per il luogo "${name || `indice ${index}`}": coords non valido.`);
          return;
        }

        const [lat, lon] = coords;

        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup(`<b>${address}</b><br/>${name}<br/>${event}`);
        markerMap.set(name, marker);
      });
    })
    .catch((error) => {
      console.error("Errore durante il rendering dei dati:", error);
    });
};

// Configurazione della mappa
let zoom = 6;
let maxZoom = 19;
let map = L.map("map").setView([39.5, -3.0], zoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: maxZoom,
  attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Assicura il rendering al caricamento del DOM
document.addEventListener("DOMContentLoaded", () => {
  render();
});

export { AddMAP, removeMarker, GETMAPPA, SETDATI, map, zoom, SETTABELLA, GETTABELLA, cleanHTML, render };