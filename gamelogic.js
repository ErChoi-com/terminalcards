// attachable card game logic
const suits = ['Hearts', 'Spades', 'Diamonds', 'Clubs'];
const ranks = ['Ace', 'King', 'Queen', 'Jack', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const playerCardMap = new Map();
let hand = [];
let pile = []; // basically the cards that aren't in the deck
let deckCount = 0;
let startingHandCount = 7;
let gameInitialized = false;
let displayAll = false;
let currentTurn = null; // stores the ID of the player whose turn it is
let playerOrder = []; // array to store the order of players
let turnIndex = 0; // keeps track of whose turn it is in the playerOrder

// pls work?
function startGame(startingHandCount, gameMode) {
    if (gameInitialized) {
        attachMessage("Game has already been started.");
        return -1;
    }

    else if (hostOrUser === 'user') {
        attachMessage("Can't start game, has to be host.");
    }

    // Initialize turn system
    playerOrder = Object.keys(usernames);
    turnIndex = 0;
    currentTurn = playerOrder[turnIndex];
    
    // Deal cards to players
    for (let id in usernames) {
        const tempHand = [];
        for (let i = 0; i < startingHandCount; i++) {
            tempHand.push(drawCard());
        }
        playerCardMap.set(id, tempHand);
    }

    // Announce game start and first turn
    attachMessage(`Game started! It's ${usernames[currentTurn]}'s turn.`);

    switch(gameMode) {
        case("poker"):
            pokerRules();
            break;
        case("demo"):
            simplestDemoRules();
            break;
    }
}

function gamelogic(text) {
    text = text.trim().toLowerCase().split(" ");
    input(text);
    return null;
}

function input(text) {
    // Get player ID based on whether they're host or user
    const playerId = hostOrUser === 'host' ? roomCode.value : peer.id;
    
    if (text[0] === "draw") {
        if (!validateTurn(playerId, 'draw')) return;
        const drawnCard = drawCard();
        attachMessage(`You drew a ${drawnCard.rank} of ${drawnCard.suit}`);
        nextTurn(); // Move to next player after drawing
        return;
    }

    if (text[0] === "play") {
        if (!validateTurn(playerId, 'play')) return;
        const result = playCard(text);
        if (result === 0) {
            nextTurn(); // Move to next player after playing
        }
        return;
    }

    if (text[0] === "display") {
        const displayHand = hand.map(card => `${card.rank} of ${card.suit}`).join(", "); 
        //difficult line, essentially internal function runs and new array is printed through use of line, then joined line through use of ","                                                                                    
        if (displayAll) {
            playerCardMap.forEach((id, cards) => {
                attachMessage(`${id}: ${cards.map(card => `${card.rank} of ${card.suit}`).join(", ")}`); // Display all players' hands
            });
        }
        else {
            attachMessage(`Your hand: ${displayHand}`);
        }
        return;
    }

    if (text[0] === "start") {
        startGame(text[1], text[2]);
        return;
    }

    if (text[0] === "end") {
        endGame();
        return;
    }
}

function drawCard() {
    if (pile.length === 52) {
        pile = [];
        deckCount++;
    }

    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const card = {suit, rank};

    if (pileSearch(card)) {
        return drawCard();
    }

    hand.push(card);
    pile.push(card);
    return card;
}

function playCard(text) {
    if (handSearch(text)) {
        hand = hand.filter(card => card.rank !== cardFormat.rank && card.suit !== cardFormat.suit);
        return 0;
    }
    else {
        attachMessage("Card doesn't exist in your hand.");
        return -1;
    }
}

// the start of the search for cards thing in hand
function handSearch(text) {
    const card = text.split(" ");
    // format should be "play 10 of suits" or something like that
    const cardFormat = {suit: card[1], rank: card[3]};
    return hand.find(card => card.rank === cardFormat.rank && card.suit === cardFormat.suit);
}

function handSearch({suit, rank}) {
    return hand.find(card => card.rank === rank && card.suit === suit);
}
// end of it

//start of the search for cards thing in pile
function pileSearch(text) {
    const card = text.split(" ");
    // format should be "play 10 of suits" or something like that
    const cardFormat = {suit: card[1], rank: card[3]};
    return pile.find(card => card.rank === cardFormat.rank && card.suit === cardFormat.suit);
}

function pileSearch({suit, rank}) {
    return pile.find(card => card.rank === rank && card.suit === suit);
}
//the end of searching for it

function nextTurn() {
    turnIndex = (turnIndex + 1) % playerOrder.length;
    currentTurn = playerOrder[turnIndex];
    attachMessage(`It's ${usernames[currentTurn]}'s turn.`);
    
    // Broadcast turn change to all players
    if (hostOrUser === 'host') {
        broadcast('system', {
            type: "info",
            text: `It's ${usernames[currentTurn]}'s turn.`,
            username: "System"
        });
    }
}

function isPlayerTurn(playerId) {
    return currentTurn === playerId;
}

function validateTurn(playerId, action) {
    if (!isPlayerTurn(playerId)) {
        attachMessage("It's not your turn!");
        return false;
    }
    return true;
}

function pokerRules() {

}

// Game state variables
let currentCard = null; // The current card on top of the play pile
let gameWinner = null;

function simplestDemoRules() {
    gameInitialized = true;
    
    // Draw and set the first card
    currentCard = drawCard();
    pile.pop(); // Remove from player's hand since it's the starting card
    hand.pop();

    attachMessage("=== Simple Demo Game Started ===");
    attachMessage("Rules:");
    attachMessage("1. Each player starts with 7 cards");
    attachMessage("2. Play cards that match either the suit OR rank of the top card");
    attachMessage("3. Commands:");
    attachMessage("   - Type 'draw' to draw a card");
    attachMessage("   - Type 'play [rank] of [suit]' to play a card");
    attachMessage("   - Type 'display' to see your hand");
    attachMessage("4. First player to play all their cards wins!");
    attachMessage(`\nStarting card is: ${currentCard.rank} of ${currentCard.suit}`);
    
    return "Game started!";
}

// Check if a card can be legally played
function isValidPlay(card) {
    if (!currentCard) return false;
    return card.suit === currentCard.suit || card.rank === currentCard.rank;
}

// Override the playCard function to include game rules
function playCard(text) {
    const card = text.split(" ");
    const cardToPlay = {suit: card[3], rank: card[1]};
    
    // Check if player has this card
    if (!handSearch(cardToPlay)) {
        attachMessage("Card doesn't exist in your hand.");
        return -1;
    }

    // Check if it's a valid play
    if (!isValidPlay(cardToPlay)) {
        attachMessage(`Invalid play! You must play a ${currentCard.rank} or a ${currentCard.suit}`);
        return -1;
    }

    // Remove card from hand
    hand = hand.filter(c => !(c.rank === cardToPlay.rank && c.suit === cardToPlay.suit));
    
    // Update current card
    currentCard = cardToPlay;
    
    // Check for win condition
    if (hand.length === 0) {
        gameWinner = savedUser;
        attachMessage(`🎉 ${gameWinner} wins the game! 🎉`);
        return 1;
    }

    attachMessage(`Played ${cardToPlay.rank} of ${cardToPlay.suit}`);
    return 0;
}

// Override drawCard to include game rules
function drawCard() {
    if (pile.length === 52) {
        pile = [];
        deckCount++;
    }

    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const card = {suit, rank};

    if (pileSearch(card)) {
        return drawCard();
    }

    hand.push(card);
    pile.push(card);
    
    // Announce what was drawn
    attachMessage(`Drew a ${card.rank} of ${card.suit}`);
    
    return card;
}