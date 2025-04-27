const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000; // You can choose any available port

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory task queue
const taskQueue = [];
let taskIdCounter = 1; // Counter for generating unique task IDs

//middleware to log requests
function logRequest(req, res, next) {
  console.log(`Incoming request: ${req.method} ${req.url}, Body: ${JSON.stringify(req.body)}`);
  // Schedule the next fetch
  next();
}
app.use(logRequest);
// Simple GET endpoint
app.get('/api/data', (req, res) => {
  console.log('Received GET request at /api/data');
  res.json({ message: 'Hello from the API!' });
});

// Simple POST endpoint example (can be expanded later)
app.post('/api/save', (req, res) => {
  console.log('Received POST request at /api/save with data:', req.body);
  // In a real application, you would save req.body data here
  res.json({ status: 'success', receivedData: req.body });
});

// Endpoint to add a task to the queue
app.post('/api/tasks/add', (req, res) => {
  const task = req.body.task;
  if (task) {
    const newTask = { id: taskIdCounter++, description: task };
    taskQueue.push(newTask);
    console.log('Task added:', newTask, 'Queue size:', taskQueue.length);
    res.json({ status: 'success', message: 'Task added to queue.', taskId: newTask.id });
  } else {
    res.status(400).json({ status: 'error', message: 'No task provided.' });
  }
});

// Endpoint to get the next task from the queue
app.get('/api/tasks/next', (req, res) => {
  if (taskQueue.length > 0) {
    const nextTask = taskQueue.shift(); // Get and remove the oldest task
    console.log('Task fetched:', nextTask, 'Queue size:', taskQueue.length);
    // Return the full task object including its ID
    res.json({ status: 'success', task: nextTask });
  } else {
    console.log('No tasks in queue.');
    res.json({ status: 'empty', message: 'No tasks available.' });
  }
});

// Endpoint to receive feedback about a task
app.post('/api/tasks/feedback', (req, res) => {
  const { taskId, status, details } = req.body;
  if (taskId && status) {
    console.log(`Feedback received for task ${taskId}: Status - ${status}, Details - ${details || 'N/A'}`);
    // In a real application, you might update a database record here
    res.json({ status: 'success', message: 'Feedback received.' });
  } else {
    res.status(400).json({ status: 'error', message: 'Missing taskId or status in feedback.' });
  }
});

/*
POST /v1/api/show, Body: {"name":"deepseek-r1:latest"}

*/
function getOllmaToken(token){
  /*{"id":"chatcmpl-233","object":"chat.completion.chunk","created":1745751817,"model":"qwen2.5-coder:1.5b","system_fingerprint":"fp_ollama","choices":[{"index":0,"delta":{"role":"assistant","content":" offers"},"finish_reason":null}]}
  */

  const ollmaToken = {
    id: "chatcmpl-233",
    object: "chat.completion.chunk",
    created: 1745751817,
    model: "qwen2.5-coder:1.5b",
    system_fingerprint: "fp_ollama",
    choices: [
      {
        index: 0,
        delta: { role: "assistant", content: token },
        finish_reason: null
      }
    ]
  };
  return ollmaToken;
}

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});