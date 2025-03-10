export const getLLMResponse = async (prompt) => {
    const response = await fetch('http://127.0.0.1:8000/generate-question/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt)
    });

    return await response.body.getReader();
};

export const updateLogsDB = async (data) => {
    const response = await fetch("http://127.0.0.1:8000/update-logs-db/", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await response.json();
};
  