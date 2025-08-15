const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://192.168.1.4:3001');

const ws = new WebSocket('ws://192.168.1.4:3001');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  
  // Send admin subscription message
  ws.send(JSON.stringify({ type: 'ADMIN_SUBSCRIBE', data: {} }));
  
  // Send ping
  ws.send(JSON.stringify({ type: 'ping', data: {} }));
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket closed:', code, reason);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 10000);
