const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const functions = require("firebase-functions");
const app = express();
const iconv = require('iconv-lite');
let progress = "-";

app.use(cors({
  origin: "*",
}));

const port = 4000;
var admin = require("firebase-admin");
let serviceAccount = require("./serviceAccountKey.json");
// Iniciar el servidor
const server = app.listen(port, () => {
  console.log(`Servidor de padron electoral de ADITUM corriendo en el puerto ${port}`);
});



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://padron-electoral-lh.firebaseio.com"
},"padron");

var serviceAccountStorage = require("./aditum-storage.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountStorage),
  databaseURL: "https://aditum-storage.firebaseio.com",
},"storage");

const database = admin.app("padron").database();
const databaseRef = database.ref("/padron-electoral")
// Configurar el body-parser para que pueda leer el cuerpo de las solicitudes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta que recibe la URL del archivo y crea un objeto "person" por cada línea del archivo

//server es el objeto de servidor HTTP creado en Node.js
app.get("/", (request, response) => {
  response.send("Servidor de padron electoral de ADITUM");
})
app.get("/progress", (request, response) => {
  response.send(progress);
})
app.get("/parseFile", (req, res) => {
  res.send("Procesamiento del archivo iniciado en segundo plano");
  parseFileInBackground();
});

const parseFileInBackground = async () => {
  const bucket = admin.app("storage").storage().bucket("aditum-storage.appspot.com");
  const file = bucket.file("aditum/padron.txt");

  const fileStream = file.createReadStream();

  let lineCount = 0;
  let progress = "Iniciando";
  saveProgressToFirebase(progress);

  let chunks = [];
  const lineCountToSave = 1000; // número de líneas a procesar antes de guardar el progreso
  let linesProcessed = 0; // número de líneas procesadas desde la última vez que se guardó el progreso

  fileStream.on("data", (chunk) => {
    const buffer = iconv.encode(chunk.toString(), "latin1");
    chunks.push(buffer);
  });

  fileStream.on("end", async () => {
    const buffer = Buffer.concat(chunks);
    const totalLines = buffer.toString().split("\n").length;
    saveProgressToFirebase("formateando archivo");
    const lines = buffer.toString().split("\n");
    for (const line of lines) {
      const values = line.split(",");
      const person = {
        identificationNumber: values[0] ? values[0].trim().replace(/\?/g, 'Ñ') : undefined,
        nombre: values[4] && values[6] && values[7] ? values[5].trim().replace(/\?/g, 'Ñ') + "," + values[6].trim().replace(/\?/g, 'Ñ') + "," + values[7].trim().replace(/\?/g, 'Ñ') : undefined,
      };
      if (person.nombre && person.identificationNumber && person.identificationNumber.length > 5) {
        await saveDataToFirebase(person);
      }
      lineCount++;
      linesProcessed++;
      const progressPercentage = Math.round((lineCount / totalLines) * 100); // calcular el progreso en porcentaje
      progress = "En progreso " + lineCount + "/" + totalLines + ", " + progressPercentage + "%";
      saveProgressToFirebase(progress);
      linesProcessed = 0; // reiniciar el contador de líneas procesadas desde la última vez que se guardó el progreso
    }

    progress = "Finalizado";
    saveProgressToFirebase(progress);
  });

  fileStream.on("error", (error) => {
    progress = "Error al leer el archivo";
    saveProgressToFirebase(progress);
  });
}

async function saveDataToFirebase(person) {
  const id = person.identificationNumber;
  return new Promise((resolve, reject) => {
    databaseRef.child(id).set(person, (error) => {
      if (error) {
        console.log("Error saving data:", error);
        reject(error);
      } else {
        console.log(`Data saved successfully for ID ${id}`);
        resolve();
      }
    });
  });
}


function saveProgressToFirebase(progress) {
  const database = admin.app("padron").database();
  const statusRef = database.ref("/padron-electoral/status");
  statusRef.set(progress, (error) => {
    if (error) {
      console.log("Error saving progress:", error);
    } else {
      console.log(`Progress saved successfully: ${progress}`);
    }
  });
}
function saveDataToFirebase(person) {
  const id = person.identificationNumber;
  return new Promise((resolve, reject) => {
    databaseRef.child(id).set(person, (error) => {
      if (error) {
        console.log("Error saving data:", error);
        reject(error);
      } else {
        console.log(`Data saved successfully for ID ${id}`);
        resolve();
      }
    });
  });
}

exports.padronElectoral = functions.https.onRequest(app);

