const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);

//http.maxConnections = 2;

let players = [];
let names = {};

let scores = {};
let temp_scores = {};
let predictions = {};

let deck = [];
deck.push('2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH');
deck.push('2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC');
deck.push('2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD');
deck.push('2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS');

let temp_deck = [...deck];

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

let suits = ["Spades", "Diamonds", "Clubs", "Hearts", "None"];

let trump = 0;
let round = 0;
let hands = 0;
let current_number = 10;
let starting_number = 10;
let current_player = 0;

let current_weights = [];

function reset_weights() {
    for (var i=0; i<52; i++) {
        current_weights[i] = i;
    }
    if (trump%5 != 4) {
        for (var i=39-(13*(trump%5)); i<52-(13*(trump%5)); i++) {
            current_weights[i] = current_weights[i] + 200;
        }
    }
}

reset_weights();

let current_hand = {};

function deal() {
    temp_deck = shuffle(temp_deck);
    var startN = 0;
    var endN = current_number;
    var i;
    for (i=0; i<players.length; i++) {
        io.to(players[i]).emit('dealCards', temp_deck.slice(startN, endN), suits[trump%5]);
        startN = endN;
        endN = endN + current_number;
    }
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    players.push(socket.id);
    scores[socket.id] = 0;
    temp_scores[socket.id] = 0;

    starting_number = Number(52 / players.length); 
    if (starting_number > 10) {
        starting_number = 2;
    }
    current_number = starting_number;

    if (players.length === 1) {
    	console.log('Player A assigned to ' + socket.id);
        io.emit('isPlayerA');
    };

    socket.on('name', function (name) {
    	names[socket.id] = name;
    	io.emit('names', Object.values(names));
    });

    socket.on('startgame', function () {
    	deal();
    });

    socket.on('prediction', function (prediction) {
    	predictions[socket.id] = prediction;
        if (Object.keys(predictions).length == players.length) {
            io.emit('play');
            io.to(players[current_player%players.length]).emit('yourturn');
        }
    });

    socket.on('cardPlayed', function (gameObject, sid) {
        io.emit('cardPlayed', gameObject, sid);
        current_hand[gameObject.textureKey] = socket.id;
        if (Object.keys(current_hand).length == 1) {
            var group = Math.floor(deck.indexOf(gameObject.textureKey) / 13);
            for (var i=group*13; i<(group*13)+13; i++) {
                current_weights[i] = current_weights[i] + 100;
            }
        }
        if (Object.keys(current_hand).length == players.length) {
            var maxVal = 0;
            var cw,ct;
            var winner;
            for (var i=0; i<players.length; i++) {
                ct = Object.keys(current_hand)[i];
                cw = current_weights[deck.indexOf(ct)];
                if (cw > maxVal) {
                    maxVal = cw;
                    winner = current_hand[ct];
                }
            }
            current_player = players.indexOf(winner);
            temp_scores[winner] = temp_scores[winner] + 1;
            current_hand = {};
            reset_weights();
            hands = hands + 1;
            io.emit('clearZone', names[winner]);
            if (hands == current_number) {
                hands = 0;
                trump = trump + 1;
                round = round + 1;
                for (var i=0; i<players.length; i++) {
                    if (temp_scores[players[i]] == predictions[players[i]]) {
                        scores[players[i]] = scores[players[i]] + temp_scores[players[i]] + 10;
                    }
                }
                temp_scores = {};
                for (var i=0; i<players.length; i++) {
                    temp_scores[players[i]] = 0;
                }
                predictions = {};
                io.emit('scores', scores);
                if (round == ((starting_number-1)*2)+1) {
                    var winnerName;
                    var maxScore = 0;
                    for (var i=0; i<players.length; i++) {
                        if (scores[players[i]] > maxScore) {
                            winnerName = names[players[i]];
                            maxScore = scores[players[i]];
                        }
                    }
                    io.emit('endgame', winnerName);
                } else {
                    if (round >= starting_number) {
                        current_number = current_number + 1;
                    } else {
                        current_number = current_number - 1;
                    }
                    deal();
                }
            } else {
                io.to(players[current_player%players.length]).emit('yourturn');
            }
        } else {
            current_player = current_player + 1;
            io.to(players[current_player%players.length]).emit('yourturn');
        }
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