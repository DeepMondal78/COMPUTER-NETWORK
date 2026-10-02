const net = require('net');

const server = net.createServer((socket) => {
    console.log('Client connected!');

    socket.on('data', (data) => {
        const requestString = data.toString();
        
        // রিকোয়েস্টের প্রথম লাইন থেকে Method এবং Path আলাদা করা (যেমন: GET / HTTP/1.1)
        const firstLine = requestString.split('\r\n')[0];
        const [method, path] = firstLine.split(' ');

        console.log(`Received ${method} request for path: ${path}`);

        let body = '';
        let statusCode = '200 OK';
        let contentType = 'text/html';

        // বেসিক রাউটিং লজিক
        if (path === '/') {
            body = "<h1>Welcome to my Custom HTTP Server from Scratch!</h1><p>Built using Node.js TCP Sockets.</p>";
        } else if (path === '/about') {
            body = "<h1>About Page</h1><p>This is a raw HTTP server built to master computer networking concepts.</p>";
        } else if (path === '/api/data') {
            statusCode = '200 OK';
            contentType = 'application/json';
            body = JSON.stringify({ message: "Hello from custom API endpoint!", status: "success" });
        } else {
            statusCode = '404 Not Found';
            body = "<h1>404 Not Found</h1><p>The requested page does not exist on this server.</p>";
        }

        // সঠিক HTTP প্রোটোকল ফরম্যাটে রেসপন্স তৈরি করা
        const response = 
            `HTTP/1.1 ${statusCode}\r\n` +
            `Content-Type: ${contentType}\r\n` +
            `Content-Length: ${Buffer.byteLength(body)}\r\n` +
            `Connection: close\r\n` +
            `\r\n` + 
            body;

        socket.write(response);
        socket.end();
    });

    socket.on('end', () => {
        console.log('Client disconnected.');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

server.listen(8080, () => {
    console.log('Custom HTTP Server is listening on port 8080');
});