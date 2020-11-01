const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);

//http.maxConnections = 2;

let games = {};

let deck = [];
deck.push('2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH');
deck.push('2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC');
deck.push('2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD');
deck.push('2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS');

let suits = ["Spades", "Diamonds", "Clubs", "Hearts", "None"];

function newGame(gId) {
    games[gId] = {
        code: gId,
        players: {},
        names: {},
        scores: {},
        temp_scores: {},
        predictions: {},
        temp_deck: [...deck],
        trump: 0,
        round: 0,
        hands: 0,
        current_number: 0,
        starting_number: 0,
        current_player: 0,
        current_weights: [],
        current_hand: {}
    };
}

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

function reset_weights(gId) {
    for (var i=0; i<52; i++) {
        games[gId].current_weights[i] = i;
    }
    if (games[gId].trump%5 != 4) {
        for (var i=39-(13*(games[gId].trump%5)); i<52-(13*(games[gId].trump%5)); i++) {
            games[gId].current_weights[i] = games[gId].current_weights[i] + 200;
        }
    }
}

function deal(gId) {
    games[gId].temp_deck = shuffle(games[gId].temp_deck);
    var startN = 0;
    var endN = games[gId].current_number;
    var i;
    for (i=0; i<Object.keys(games[gId].players).length; i++) {
        io.to(Object.values(games[gId].players)[i]).emit('dealCards', games[gId].temp_deck.slice(startN, endN), suits[games[gId].trump%5]);
        startN = endN;
        endN = endN + games[gId].current_number;
    }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    socket.on('createGUID', function() {
        io.to(socket.id).emit('GUID', uuidv4());
    });

    socket.on('createGame', function () {
        var thisGameNum = ( Math.random() * 100000 ) | 0;
        var thisGameId = thisGameNum.toString();
        socket.join(thisGameId);
        newGame(thisGameId);
        reset_weights(thisGameId);
        io.to(socket.id).emit('gameId', thisGameId);
    });

    socket.on('joinGame', function (code) {
        if (code in games) {
            socket.join(code);
            io.to(socket.id).emit('gameId', code);
        } else {
            io.to(socket.id).emit('invalidCode');
        }
    });

    socket.on('name', function (gId, name, guid) {
        if (guid in games[gId].players) {
            games[gId].players[guid] = socket.id;
            io.to(socket.id).emit('scores', games[gId].scores);
            //update player on current game
        } else {
            games[gId].players[guid] = socket.id;
            games[gId].scores[guid] = 0;
            games[gId].temp_scores[guid] = 0;
            games[gId].names[guid] = name;
            games[gId].starting_number = Number(52 / Object.keys(games[gId].players).length);
            if (games[gId].starting_number > 10) {
                games[gId].starting_number = 3;
            }
            games[gId].current_number = games[gId].starting_number;
        }
        io.to(gId).emit('names', Object.values(games[gId].names));
        if (Object.keys(games[gId].players).length === 1) {
            io.to(socket.id).emit('isPlayerA');
        }
    });

    socket.on('startgame', function (gId) {
    	deal(gId);
    });

    socket.on('prediction', function (gId, guid, prediction) {
    	games[gId].predictions[guid] = prediction;
        io.to(gId).emit('predictions', games[gId].predictions, games[gId].names);
        if (Object.keys(games[gId].predictions).length == Object.keys(games[gId].players).length) {
            io.to(gId).emit('play');
            io.to(Object.values(games[gId].players)[games[gId].current_player % Object.keys(games[gId].players).length]).emit('yourturn');
        }
    });

    socket.on('cardPlayed', function (gId, guid, gameObject) {
        io.to(gId).emit('cardPlayed', gameObject, guid);
        games[gId].current_hand[gameObject.textureKey] = guid;
        if (Object.keys(games[gId].current_hand).length == 1) {
            var group = Math.floor(deck.indexOf(gameObject.textureKey) / 13);
            for (var i=group*13; i<(group*13)+13; i++) {
                games[gId].current_weights[i] = games[gId].current_weights[i] + 100;
            }
        }
        if (Object.keys(games[gId].current_hand).length == Object.keys(games[gId].players).length) {
            var maxVal = 0;
            var cw,ct;
            var winner;
            for (var i=0; i<Object.keys(games[gId].players).length; i++) {
                ct = Object.keys(games[gId].current_hand)[i];
                cw = games[gId].current_weights[deck.indexOf(ct)];
                if (cw > maxVal) {
                    maxVal = cw;
                    winner = games[gId].current_hand[ct];
                }
            }
            games[gId].current_player = Object.keys(games[gId].players).indexOf(winner);
            games[gId].temp_scores[winner] = games[gId].temp_scores[winner] + 1;
            games[gId].current_hand = {};
            reset_weights(gId);
            games[gId].hands = games[gId].hands + 1;
            io.to(gId).emit('clearZone', games[gId].names[winner]);
            if (games[gId].hands == games[gId].current_number) {
                games[gId].hands = 0;
                games[gId].trump = games[gId].trump + 1;
                games[gId].round = games[gId].round + 1;
                for (var i=0; i<Object.keys(games[gId].players).length; i++) {
                    if (games[gId].temp_scores[Object.keys(games[gId].players)[i]] == games[gId].predictions[Object.keys(games[gId].players)[i]]) {
                        games[gId].scores[Object.keys(games[gId].players)[i]] = games[gId].scores[Object.keys(games[gId].players)[i]] + games[gId].temp_scores[Object.keys(games[gId].players)[i]] + 10;
                    }
                }
                games[gId].temp_scores = {};
                for (var i=0; i<Object.keys(games[gId].players).length; i++) {
                    games[gId].temp_scores[Object.keys(games[gId].players)[i]] = 0;
                }
                games[gId].predictions = {};
                io.to(gId).emit('scores', games[gId].scores);
                if (games[gId].round == ((games[gId].starting_number-1)*2)+1) {
                    var winnerName;
                    var maxScore = 0;
                    for (var i=0; i<Object.keys(games[gId].players).length; i++) {
                        if (games[gId].scores[Object.keys(games[gId].players)[i]] > maxScore) {
                            winnerName = games[gId].names[Object.keys(games[gId].players)[i]];
                            maxScore = games[gId].scores[Object.keys(games[gId].players)[i]];
                        }
                    }
                    io.to(gId).emit('endgame', winnerName);
                } else {
                    if (games[gId].round >= games[gId].starting_number) {
                        games[gId].current_number = games[gId].current_number + 1;
                    } else {
                        games[gId].current_number = games[gId].current_number - 1;
                    }
                    deal(gId);
                }
            } else {
                io.to(Object.values(games[gId].players)[games[gId].current_player % Object.keys(games[gId].players).length]).emit('yourturn');
            }
        } else {
            games[gId].current_player = games[gId].current_player + 1;
            io.to(Object.values(games[gId].players)[games[gId].current_player % Object.keys(games[gId].players).length]).emit('yourturn');
        }
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        //players = players.filter(player => player !== socket.id);
        //delete names[socket.id];
        //io.emit('names', Object.values(names));
    });
});

http.listen(3000, function () {
    console.log('Server started!');
});