import './App.css';
import React, {useState,useEffect} from "react";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import "firebase/compat/database";
import "firebase/compat/storage";
import FileReader from "./FileReader";

function App() {

  const firebaseConfig = {
    apiKey: "AIzaSyC72bE53igXS39tKAZXUsWAsLimMiKnEEs",
    authDomain: "padron-electoral-lh.firebaseapp.com",
    databaseURL: "https://padron-electoral-lh.firebaseio.com",
    projectId: "padron-electoral-lh",
    storageBucket: "padron-electoral-lh.appspot.com",
    messagingSenderId: "720753236578",
    appId: "1:720753236578:web:29dea776a24e713f108f3b"
  };
  firebase.initializeApp(firebaseConfig);
  const databaseRef = firebase.database().ref('padron-electoral/');

  const [identificationNumber, setIdentificationNumber] = useState('');
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState("");


  const getData = () => {
    const databaseRef = firebase.database().ref('/padron-electoral/');
    databaseRef.orderByChild("identificationNumber").equalTo(identificationNumber).on('value', (snapshot) => {
      const data = snapshot.val();
      setData(data);
    });
  };


  useEffect(() => {
    // Escuchar cambios en la referencia "status"
    const statusRef = firebase.database().ref("/padron-electoral/status");
    statusRef.on("value", snapshot => {
      setProgress(snapshot.val());
    });
    // Limpiar el listener cuando el componente se desmonta
    return () => {
      statusRef.off("value");
    };
  }, [])

  return (
    <div>
      <h3>ADITUM ACTUALIZAR PADRON ELECTORAL</h3>
      <p>Se leerá el archivo del proyecto de firebase llamada aditum-storage en la ruta aditum/padron.txt , deberá tener ese nombre "padron.txt" al darle iniciar empezará el proceso. Verificar que el archivo tenga
        <a href="https://firebasestorage.googleapis.com/v0/b/aditum-storage.appspot.com/o/aditum%2Fpadron.txt?alt=media&token=119b4b8a-bc50-4a96-8da3-11c2130c3671"> este formato.</a></p>
      <FileReader></FileReader>
      <h2><p>Progreso: {progress}</p></h2>
      <div>
        <h5>Consultar cédula</h5>
        <label>Identificación:</label>
        <input type="text" value={identificationNumber} onChange={(e) => setIdentificationNumber(e.target.value)}/>
        <button onClick={getData}>Consultar</button>
        {data && (
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
