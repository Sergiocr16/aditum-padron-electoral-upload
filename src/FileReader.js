import React, {useState, useEffect} from 'react';

var serverUrlDev = "http://localhost:4000";
var serverUrlProd = "https://us-central1-aditum-padron-electoral-server.cloudfunctions.net/padronElectoral";
var server = serverUrlDev;
// var server = serverUrlProd;
function FileReader() {

  const handleSubmit = (event) => {
    event.preventDefault();
    fetch(server+"/parseFile")
      .then(response => response.json())
      .catch(error => console.error(error));
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit">Comenzar</button>
      </form>
    </div>
  );
}

export default FileReader;
