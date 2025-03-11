import React, { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [systemComment, setSystemComment] = useState('');
  const [rating, setRating] = useState('');

  const handleChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNewQuestion('');
    setRating('');
    setSystemComment('');
    
    try {
      console.log(prompt) 
      const data = {
        "prompt": prompt,
        "use_validation_system_prompt": true,
      };
      const response = await fetch('http://127.0.0.1:8000/generate-question/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let current_key = "";
      let is_key = true;
      let current_str = "";
      let new_question_doesnt_required = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        current_str = decoder.decode(value, { stream: true });
        if (current_str[0] === "{")
            current_str = current_str.slice(1);
        if (current_str.includes("<|im_end|>"))
            current_str = current_str.slice(0, current_str.indexOf("<|im_end|>"))
        if (current_str[current_str.length - 1] === "}")
            current_str = current_str.slice(0, current_str.length - 1);

        const parts = current_str.split(/\s+/);
        for (let i = 0; i < parts.length; i++) {
            let cur = parts[i].trim();
            if (cur === "" || cur === "\n")
                continue
            console.log(cur)
            if (cur.includes("\"Новый") || cur.includes("\"Комментарий") || cur.includes("\"Оценка")) {
                is_key = true;
                cur = cur.slice(1); // remove " at the beginning, check whether key is a single word
                const index = cur.indexOf("\":");
                if (index !== -1) {
                    current_key = cur.slice(0, index);
                    is_key = false;
                }
                else
                    current_key = cur + " ";
            }
            else if (cur.includes("\":")) {
                let idx = cur.indexOf("\":");
                let remain_key = cur.slice(0, idx);
                current_key += remain_key; // remove ": at the end of key
                is_key = false;
            }
            else {
                cur = cur.replace(/"/g, "");
                if (is_key)
                    current_key += cur + " ";
                else {
                    current_key = current_key.trim();
                    if (cur[cur.length - 1] === ",")
                    cur = cur.slice(0, cur.length - 1);        
                    if (current_key === "Новый вопрос" && !new_question_doesnt_required)
                        setNewQuestion((prev) => prev + cur + " ");
                    else if (current_key === "Комментарий проверяющей системы")
                        setSystemComment(cur);
                    else if (current_key === "Оценка") {
                        setRating(parseFloat(cur));
                        if (parseFloat(cur) >= 8) {
                          new_question_doesnt_required = true;
                        }
                    }
                }
            }
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Enter your prompt here"
          rows="4"
          cols="50"
        />
        <br />
        <button type="submit">Submit</button>
      </form>
      <div>
        <h2 style={headerStyles}>Streamed Response:</h2>
        <pre style={headerStyles}>
          {newQuestion}
        </pre>
      </div>
    </div>
  );

}

export default App;