const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);

let players = [];
let names = {};

let scores = {};
let predictions = {};

let deck = [];
deck.push('2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH');
deck.push('2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC');
deck.push('2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD');
deck.push('2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS');

let suits = ["Spades", "Diamonds", "Clubs", "Hearts", "None"];

let trump = 0;
let round = 0;
let max_number = 10;
let current_player = 0;

let current_weights = [];

for (var i=0; i<52; i++) {
	current_weights[i] = i;
}

let current_hand = {};

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    players.push(socket.id);
    scores[socket.id] = 0;

    if (players.length === 1) {
    	console.log('Player A assigned to ' + socket.id);
        io.emit('isPlayerA');
    };

    socket.on('name', function (name) {
    	names[socket.id] = name;
    	io.emit('names', Object.values(names));
    })

    socket.on('startgame', function (starting_number) {
    	max_number = Number(starting_number);
    	io.emit('dealCards', starting_number, suits[trump]);
    })

    socket.on('dealCards', function (starting_number) {
    	max_number = Number(starting_number);
        io.emit('dealCards', starting_number, suits[trump]);
    });

    socket.on('prediction', function (prediction) {
    	predictions[socket.id] = prediction;
    })

    socket.on('cardPlayed', function (gameObject, isPlayerA) {
        io.emit('cardPlayed', gameObject, isPlayerA);
        current_hand[gameObject.textureKey] = socket.id;
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        players = players.filter(player => player !== socket.id);
        delete names[socket.id];
        io.emit('names', Object.values(names));
    });
});

http.listen(3000, function () {
    console.log('Server started!');
});