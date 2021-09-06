const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const port = 1412;

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    console.log("on GET /");

    res.writeHead(200, { "Content-Type": "text/html" });

    const files = fs.readFileSync("./static/index.html");

    res.write(files);

    res.end();
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });

    res.end(`
        <h1>WELCOME CHAT APP</h1>
        <a href="/">Go to index page.</a>
        `);
  }
});

server.on("upgrade", function (req, socket) {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  console.log("socket : ", socket)
  // Read the websocket key provided by the client:
  const acceptKey = req.headers["sec-websocket-key"];
  // Generate the response value to use in the response:
  const hash = generateAcceptValue(acceptKey);
  // Write the HTTP response into an array of response lines:
  const responseHeaders = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${hash}`,
  ];

  // Read the subprotocol from the client request headers:
  const protocol = req.headers["sec-websocket-protocol"];
  // If provided, they'll be formatted as a comma-delimited string of protocol
  // names that the client supports; we'll need to parse the header value, if
  // provided, and see what options the client is offering:
  const protocols = !protocol ? [] : protocol.split(",").map((s) => s.trim());
  // To keep it simple, we'll just see if JSON was an option, and if so, include
  // it in the HTTP response:
  if (protocols.includes("json")) {
    // Tell the client that we agree to communicate with JSON data
    responseHeaders.push(`Sec-WebSocket-Protocol: json`);
  }

//   socket.on('data', (data) => {
//     console.log(data);
//     socket.end();
//   });

  socket.on('data', (buffer) => {
    console.log("socket on data : ", socket)
    const message = parseMessage(buffer);
    console.log("buffer : ", buffer)
    console.log(buffer.toString('utf8'))
    console.log(new TextDecoder().decode(buffer))
    if (message) {
    // For our convenience, so we can see what the client sent
    console.log("message : ", message);
    const str = new TextDecoder().decode(message)
    console.log("decoder message : ", str)
    // We'll just send a hardcoded message in this example 
    socket.write(constructReply({ message: 'Hello from the server!' })); 
    } else if (message === null) { 
        console.log('WebSocket connection closed by the client.'); 
    }
  });

  function constructReply(data) {
    // TODO: Construct a WebSocket frame Node.js socket buffer
  }
  function parseMessage(buffer) {
    // TODO: Parse the WebSocket frame from the Node.js socket buffer
  }

  // Write the response back to the client socket, being sure to append two
  // additional newlines so that the browser recognises the end of the response
  // header and doesn't continue to wait for more header data:
  console.log(responseHeaders.join("\r\n") + "\r\n\r\n");
  socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");
});

function generateAcceptValue(acceptKey) {
  return crypto
    .createHash("sha1")
    .update(acceptKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "binary")
    .digest("base64");
}

server.listen(port, () => {
  console.log("listen on port : ", port);
});
