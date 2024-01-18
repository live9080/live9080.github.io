console.log('Started worker2');

self.postMessage('Hello2');

self.onmessage = (e) => {
  self.postMessage(`relayed from worker2: ${e.data}`);
};
