const API_NEXT_TASK_URL = 'http://localhost:3000/api/tasks/next';
const API_FEEDBACK_URL = 'http://localhost:3000/api/tasks/feedback';
const POLLING_INTERVAL = 5000; // 5 seconds
let isProcessing = false; // Flag to prevent concurrent processing (optional but good practice)
let pollTimeoutId = null; // To potentially clear the timeout if needed

async function sendFeedback(taskId, status, details = '') {
  console.log(`Sending feedback for task ${taskId}: ${status}`);
  try {
    const response = await fetch(API_FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, status, details }),
    });
    if (!response.ok) {
      console.error(`HTTP error sending feedback! status: ${response.status}`);
    } else {
      const result = await response.json();
      console.log('Feedback API response:', result);
    }
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
}

async function processTask(task) {
  // Simulate task processing (e.g., display notification)
  console.log(`Processing task ${task.id}: ${task.description}`);

  // Show a notification
  chrome.notifications.create(`task-${task.id}`, {
    type: 'basic',
    iconUrl: 'images/icon128.png', // Make sure you have this image or update path
    title: 'Task Received',
    message: `Processing: ${task.description}`,
    priority: 2
  });

  // Simulate work being done
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

  console.log(`Finished processing task ${task.id}`);
  // Send feedback after processing
  await sendFeedback(task.id, 'completed', 'Task processed successfully by extension.');
}


async function fetchAndProcessLoop() {
  // Clear previous timeout just in case this function is called unexpectedly
  if (pollTimeoutId) clearTimeout(pollTimeoutId);
  pollTimeoutId = null; // Reset timeout ID

  if (isProcessing) {
    console.log('Already processing a task. Skipping fetch cycle.');
    // Schedule next check even if skipped, otherwise polling might stop
    pollTimeoutId = setTimeout(fetchAndProcessLoop, POLLING_INTERVAL);
    return;
  }

  isProcessing = true; // Mark as processing
  console.log('Checking for tasks...');

  try {
    const response = await fetch(API_NEXT_TASK_URL);
    if (!response.ok) {
      if (response.status === 404 || response.status === 503) {
         console.warn(`API endpoint not available (${response.status}). Retrying later.`);
      } else {
         console.error(`HTTP error fetching task! status: ${response.status}`);
      }
      // Don't process, just go to finally block to reschedule
    } else {
        const data = await response.json();

        if (data.status === 'success' && data.task && data.task.id) {
          console.log('Task received:', data.task);
          try {
            // *** Wait for processing and feedback to complete ***
            await processTask(data.task);
          } catch (processingError) {
            console.error(`Error processing task ${data.task.id}:`, processingError);
            // Attempt to send 'failed' feedback even if processing fails
            await sendFeedback(data.task.id, 'failed', processingError.message || 'Unknown processing error');
          }
        } else if (data.status === 'empty') {
          console.log('No tasks in queue.');
        } else {
          console.log('Unexpected response or missing task ID:', data);
        }
    }
  } catch (fetchError) {
    console.log('Error fetching task:', fetchError);
    // Handle potential network errors (e.g., API server completely down)
  } finally {
    isProcessing = false; // Mark processing as finished
    // *** Schedule the next fetch regardless of success or failure ***
    console.log(`Scheduling next check in ${POLLING_INTERVAL / 1000} seconds.`);
    pollTimeoutId = setTimeout(fetchAndProcessLoop, POLLING_INTERVAL);
  }
}

// Add listener for notification clicks (optional)
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log(`Notification clicked: ${notificationId}`);
  // You could potentially open a relevant page or perform an action
  chrome.notifications.clear(notificationId); // Clear the notification
});

console.log('Background script started. Initiating task polling loop.');
// Start the first fetch cycle
fetchAndProcessLoop();