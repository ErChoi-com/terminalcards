let peer;
let conn;
let savedUser;
let savedRoom;
let hostOrUser = '';
let inRoom = false;

// For hosts only: connections and usernames
const connections = {}; // key: peer ID => conn
const usernames = {};   // key: peer ID => username

// UI references
const username = document.getElementById("username");
const roomCode = document.getElementById("roomCode");
const make = document.getElementById("make");
const join = document.getElementById("join");
const disconnect = document.getElementById("disconnect");
const body = document.getElementById("body");
const terminalInput = document.getElementById("terminal-input");

//just a rewrite so git commit takes this
// HOST: Create room
make.addEventListener("click", () => {
    if (!inRoom) {
        peer = new Peer(roomCode.value);

        peer.on("open", () => {
            attachMessage("Room created. Waiting for peers...");
            inRoom = true;
            hostOrUser = 'host';
            savedUser = username.value;
            savedRoom = roomCode.value;
            configureInput(); // host can send too
        });

        peer.on("connection", (incomingConn) => {
            const peerId = incomingConn.peer;
            connections[peerId] = incomingConn;

            incomingConn.on("error", (err) => {
                attachMessage(`Connection error with ${usernames[peerId] || peerId}: ${err.message}`);
            });

            incomingConn.on("data", (data) => {
                if (data.type === "intro") {
                    // Save username from the peer
                    usernames[peerId] = data.username;
                    attachMessage(`${data.username} joined the room.`);
                    // Optionally notify others
                    broadcast(peerId, {
                        type: "info",
                        text: `${data.username} has joined.`,
                        username: "System"
                    });
                } else if (data.type === "message") {
                    const user = usernames[peerId] || "Unknown";
                    attachMessage(data.text);
                    broadcast(peerId, {
                        type: "message",
                        text: data.text,
                        username: user
                    });
                }
            });

            incomingConn.on("close", () => {
                const user = usernames[peerId] || peerId;
                attachMessage(`${user} disconnected.`);
                broadcast(peerId, {
                    type: "info",
                    text: `${user} has left.`,
                    username: "System"
                });
                delete connections[peerId];
                delete usernames[peerId];
            });
        });
    } else {
        attachMessage("Please leave the current room first.");
    }
});

// USER: Join room
join.addEventListener("click", () => {
    if (!inRoom) {
        peer = new Peer();

        peer.on("open", () => {
            conn = peer.connect(roomCode.value); // connect to host

            conn.on("open", () => {
                attachMessage("Connected to host.");
                conn.send({
                    type: "intro",
                    username: username.value
                });

                configureInput();
                inRoom = true;
                hostOrUser = 'user';
                savedUser = username.value;
                savedRoom = roomCode.value;
            });

            conn.on("error", (err) => {
                attachMessage(`Connection error: ${err.message}`);
            });

            conn.on("data", (data) => {
                if (typeof data === "object" && data !== null) {
                    if (data.type === "gameState") {
                        attachMessage(data.text);
                        if (data.currentCard) currentCard = data.currentCard;
                        if (data.currentTurn) currentTurn = data.currentTurn;
                    } else if (data.type === "message") {
                        attachMessage(data.text);
                    } else if (data.type === "info") {
                        attachMessage(data.text);
                    } else if (data.type === "error") {
                        attachMessage(`Error: ${data.text}`);
                    }
                } else {
                    attachMessage(String(data));
                }
            });
        });
    } else {
        attachMessage("You're already in a room.");
    }
});

// Disconnect logic
disconnect.addEventListener("click", () => {
    if (conn) {
        conn.close();
        conn = null;
    }

    if (hostOrUser === 'host') {
        for (let id in connections) {
            connections[id].close();
        }
    }

    attachMessage("Disconnected.");
    inRoom = false;
});

computer.addEventListener("click", () => {
    attachMessage("Bot added...");
})

// Terminal message input
terminalInput.addEventListener("keydown", (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const text = terminalInput.textContent.trim();

        if (text === "-keygen" && !inRoom) {
            // const key = Math.random().toString(36).substring(2, Math.random()*15+12);
            // no symbols for this implementation
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
            let key = "";
            for (let i = 0; i < Math.random()*12+14; i++) {
                key+=chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attachMessage(`Generated key: ${key}`);
            terminalInput.innerHTML = '<br>';
            return;
        }

        else if (!text || (savedUser == null)) return;

        const formattedText = `TerminalCards/${savedRoom}/${savedUser}: ${text}`;
        const msgObj = {
            type: "message",
            text: formattedText,
            username: savedUser
        };
        attachMessage(formattedText);

        // Process game logic first
        const gamelogicResult = gamelogic(text);
        if (gamelogicResult != null) {
            attachMessage(gamelogicResult);
            // Broadcast game state to all players
            const stateMsg = {
                type: "gameState",
                text: gamelogicResult,
                currentCard: currentCard,
                currentTurn: currentTurn
            };
            if (hostOrUser === 'host') {
                broadcast(roomCode.value, stateMsg);
            } else if (conn && conn.open) {
                conn.send(stateMsg);
            }
        }

        // Send message to other players
        if (hostOrUser === 'user' && conn && conn.open) {
            conn.send(msgObj);
        } else if (hostOrUser === 'host') {
            broadcast(roomCode.value, msgObj);
        }
        terminalInput.innerHTML = '<br>';
    }
});

// Broadcast to all peers (host only)
function broadcast(senderId, message) {
    for (let id in connections) {
        if (id !== senderId) {
            connections[id].send(message);
        }
    }
}

// Enable typing
function configureInput() {
    terminalInput.contentEditable = true;
    terminalInput.focus();
}

// Display message in chat
function attachMessage(msg) {
    const actualText = document.createElement("div");
    actualText.textContent = msg;
    body.appendChild(actualText);
}