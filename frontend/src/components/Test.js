import React, { useState } from 'react';
import { getLogsDB } from "../services/ApiService";

function App() {
  const [prompt1, setPrompt1] = useState('');
 
  const handleChange1 = (e) => {
    e.preventDefault();
    const data = getLogsDB({
        "userID": 0,
        "start_time": "2025-03-11 15:19:25.044000",
    });
    console.log(data);
    setPrompt1(data);
  };

  const headerStyles = {
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  };

  return (
    <div className="App">
      <h1 style={headerStyles}>Validate Answer</h1>
      <form onSubmit={handleChange1}>
        <textarea
          placeholder="Enter your prompt here"
          rows="4"
          cols="50"
        />
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );

}

export default App;