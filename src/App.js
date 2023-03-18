import './App.css';
import {useState} from "react";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import "firebase/compat/database";
import "firebase/compat/storage";

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
  const [totalItems, setTotalItems] = useState(0);
  const [itemsSaved, setItemsSaved] = useState(0);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      const lines = fileContent.split('\n');
      const utf8Encoder = new TextEncoder();
      const utf8Decoder = new TextDecoder('utf-8');
      setTotalItems(lines.length);
      lines.map(line => {
        const values = line.split(',');
        const person = {
          identificationNumber: values[0] ? utf8Decoder.decode(utf8Encoder.encode(values[0].trim())) : undefined,
          nombre: values[5] && values[6] && values[7] ? utf8Decoder.decode(utf8Encoder.encode(values[5].trim() + ',' + values[6].trim() + ',' + values[7].trim())) : undefined,
        };
        saveDataToFirebase(person)
      });
    };
    reader.readAsText(file);
  };


  function saveDataToFirebase(data) {
    const id = data.identificationNumber;
    databaseRef.child(id).set(data, (error) => {
      if (error) {
        console.log('Error saving data:', error);
      } else {
        console.log(`Data saved successfully for ID ${id}`);
        setItemsSaved(x => x + 1);
      }
    });
  }


  const getData = () => {
    const databaseRef = firebase.database().ref('/padron-electoral/');
    databaseRef.orderByChild("identificationNumber").equalTo(identificationNumber).on('value', (snapshot) => {
      const data = snapshot.val();
      setData(data);
    });
  };
  return (
    <div>
      <h3>ADITUM ACTUALIZAR PADRON ELECTORAL</h3>
      <input type="file" accept=".txt" onChange={handleFileUpload}/>
      <p>Al subir el archivo se comenzará a actualizar toda la base de datos, verificar que tenga el formato por defecto al descargar de la página del padrón, debe de verse
        <a href="https://firebasestorage.googleapis.com/v0/b/aditum-storage.appspot.com/o/aditum%2Fpadron.txt?alt=media&token=119b4b8a-bc50-4a96-8da3-11c2130c3671"> con este formato.</a></p>
      <h4>
        Total items: {`${itemsSaved}/${totalItems}`}
      </h4>
      <br/>
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
