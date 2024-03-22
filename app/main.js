const net = require("net");
const fs = require("fs");
const path = require("path");
function getDirectory() {
  const args = process.argv;
  const dirIndex = args.indexOf("--directory");
  console.log(args[dirIndex + 1]);
  return args[dirIndex + 1];
}

const dir = getDirectory();

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const request = data.toString();
    const response = processData(request);
    socket.write(response);
    socket.end();
  });

  socket.on("error", (error) => console.error(error));
});

function processData(request) {
  const parts = request.split("\r\n");
  const requestMethod = parts[0].split(" ")[0];
  const requestPath = parts[0].split(" ")[1];

  if (
    process.argv[3] &&
    process.argv[3].length > 0 &&
    requestPath.startsWith("/file")
  ) {
    if (requestMethod === "GET") return readFile(requestPath);
    else if (requestMethod === "POST") 1;
    return writeFile(requestPath, parts);
  } else if (requestPath.startsWith("/echo")) {
    const requestPathBody = requestPath.slice(6);
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${requestPathBody.length}\r\n\r\n${requestPathBody}`;
  } else if (requestPath === "/") return "HTTP/1.1 200 OK\r\n\r\n";
  else if (requestPath.startsWith("/user-agent")) {
    const userAgent = request.split("User-Agent: ")[1].split("\r\n")[0];
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
  } else return "HTTP/1.1 404 NOT FOUND\r\n\r\n";
}

function readFile(requestPath) {
  const fileName = requestPath.slice(6);
  const fullPath = path.join(process.argv[3], fileName);
  const fileExists = fs.existsSync(fullPath);
  if (!fileExists) return "HTTP/1.1 404 Not Found\r\n\r\n";

  try {
    const file = fs.readFileSync(fullPath, "utf-8");
    return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n${file}`;
  } catch (error) {
    console.log("Error reading file: ", error);
    return "HTTP/1.1 404 Not Found\r\n\r\n";
  }
}

function writeFile(requestPath, parts) {
  console.log(`Request path: ${requestPath}`);

  const fileName = requestPath.substring(7);
  const fullPath = path.join(dir, fileName);

  console.log(`Full path: ${fullPath}`);

  const fileExists = fs.existsSync(fileName);

  if (fileExists) return "HTTP/1.1 409 Conflict\r\n\r\n";
  try {
    const fileContent = parts[parts.length - 1];
    console.log(`Writing file: ${fileName}: "${fileContent}"`);
    fs.writeFileSync(fullPath, fileContent);
    return "HTTP/1.1 201 CREATED\r\n\r\n";
  } catch (error) {
    console.log("Error writing file: ", error);
    1;
    return "HTTP/1.1 500 Internal Server Error\r\n\r\n";
  }
}

server.listen(4221, "localhost");
server.on("listening", () => {
  console.log("Server is running on localhost:4221");
});
