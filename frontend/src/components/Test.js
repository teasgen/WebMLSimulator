import React, { useEffect, useState } from 'react';
import { getStatsLogsDB } from "../services/ApiService";

function App() {
  const [prompt1, setPrompt1] = useState('kek');
 
  useEffect(() => {
    const data = getStatsLogsDB({
        "userID": 5,
        "task_name": "recommendations",
    });
    console.log(data);
    setPrompt1(data);
  }, []);

  return (
    <div className="App">
      <h2 className="text">{prompt1}</h2>
    </div>
  );

}

export default App;