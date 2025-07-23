// Declare global variables for the PeerJS instance and the active connection
let peer;
let conn;

// Grab references to HTML elements
const nameForm = document.getElementById("set-name-form");
const callForm = document.getElementById("make-call-form");
const messageForm = document.getElementById("message-form");
const disconnectBtn = document.getElementById("disconnect");

// Input fields and UI spans
const nameInput = document.getElementById("my-name");
const peerToCallInput = document.getElementById("peer-id-to-call");
const yourIdSpan = document.getElementById("your-id");
const connectedPeerIdSpan = document.getElementById("connected-peer-id");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");

// Step 1: Handle name form submission (create your own PeerJS ID)
nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userName = nameInput.value.trim();
  if (!userName) return;

  // Create PeerJS instance with user's name as their ID
  peer = new Peer(userName);

  // Display the user's ID in the UI
  yourIdSpan.textContent = userName;

  // Show the next screen: the call form
  document.getElementById("name-form").style.display = "none";
  document.getElementById("call-form").style.display = "block";

  // Handle incoming connection from other peers
  peer.on("connection", (incomingConn) => {
    conn = incomingConn;
    setupConnection();
  });
});

// Step 2: Handle call form submission (connect to another peer)
callForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const peerId = peerToCallInput.value.trim();
  if (!peerId) return;

  // Initiate connection to the other peer
  conn = peer.connect(peerId);
  setupConnection(); // Proceed to chat
});

// Step 3: Handle chat message submission
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;

  // Send the message over the PeerJS data connection
  conn.send(msg);

  // Append message to the chat UI
  appendMessage(`You: ${msg}`);
  messageInput.value = ""; // Clear the input
});

// Step 4: Disconnect button logic
disconnectBtn.addEventListener("click", () => {
  if (conn) {
    conn.close(); // Gracefully close connection
    conn = null;
  }

  // Reset UI
  document.getElementById("chat-area").style.display = "none";
  document.getElementById("call-form").style.display = "block";
});

// Helper: Sets up event listeners and UI after a connection is made
function setupConnection() {
  document.getElementById("call-form").style.display = "none";
  document.getElementById("chat-area").style.display = "block";

  // Show the name of the connected peer
  connectedPeerIdSpan.textContent = conn.peer;

  // Listen for messages from the connected peer
  conn.on("data", (data) => {
    appendMessage(`${conn.peer}: ${data}`);
  });

  // Handle the connection being closed by the other peer
  conn.on("close", () => {
    alert("Connection closed");
    document.getElementById("chat-area").style.display = "none";
    document.getElementById("call-form").style.display = "block";
  });
}

// Helper: Appends a message to the chat window
function appendMessage(msg) {
  const msgElem = document.createElement("div");
  msgElem.textContent = msg;
  messagesDiv.appendChild(msgElem);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll
}
