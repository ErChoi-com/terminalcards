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
const terminal = document.getElementById("terminal");

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

            incomingConn.on("data", (data) => {
                // Don't allow any messages before intro
                if (data.type !== "intro" && !usernames[peerId]) {
                    return;
                }
                if (data.type === "intro") {
                    // Check for duplicate username when user tries to join
                    for (let id in usernames) {
                        if (data.username === usernames[id]) {
                            incomingConn.send({
                                type: "error",
                                text: "User has identical username, connection terminated"
                            });
                            setTimeout(() => {
                                delete connections[peerId];
                                delete usernames[peerId];
                                incomingConn.close();
                            }, 100);
                            attachMessage("User has identical username. Terminated");
                            return;
                        }
                    }
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

            conn.on("data", (data) => {
                if (typeof data === "object" && data !== null) {
                    if (data.type === "message") {
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

// Terminal message input
terminal.addEventListener("keydown", (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const text = terminal.textContent.trim();

        if (!text) return;

        const formattedText = `TerminalCards/${savedRoom}/${savedUser}: ${text}`;
        const msgObj = {
            type: "message",
            text: formattedText,
            username: savedUser
        };
        attachMessage(formattedText);

        const gamelogicResult = gamelogic(text);
        if (gamelogicResult != null) {
            attachMessage(gamelogicResult);
        }

        if (hostOrUser === 'user' && conn && conn.open) {
            conn.send(msgObj);
        } else if (hostOrUser === 'host') {
            broadcast('host', msgObj);
        }
        terminal.textContent = '';
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
    terminal.contentEditable = true;
    terminal.focus();
}

// Display message in chat
function attachMessage(msg) {
    const actualText = document.createElement("div");
    actualText.textContent = msg;
    body.appendChild(actualText);
}
