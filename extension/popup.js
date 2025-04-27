document.addEventListener('DOMContentLoaded', function() {
  const getDataBtn = document.getElementById('getDataBtn');
  const responseDiv = document.getElementById('response');
  const apiUrl = 'http://localhost:3000/api/data'; // Make sure this matches your API server address

  getDataBtn.addEventListener('click', function() {
    responseDiv.textContent = 'Fetching data...'; // Provide feedback

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors (e.g., 404, 500)
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the JSON response
      })
      .then(data => {
        // Display the received data
        responseDiv.textContent = `Success:\n${JSON.stringify(data, null, 2)}`;
        console.log('Data received from API:', data);
      })
      .catch(error => {
        // Handle network errors or errors during fetch/parsing
        responseDiv.textContent = `Error fetching data: ${error.message}`;
        console.error('Error fetching data:', error);
      });
  });
});