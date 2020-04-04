import Card from '../helpers/card';
import Zone from '../helpers/zone';
import Dealer from '../helpers/dealer';

import io from 'socket.io-client';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {
        let deck = ['red_back'];
        deck.push('2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH');
        deck.push('2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC');
        deck.push('2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD');
        deck.push('2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS');

        for (var i=0; i<deck.length; i++) {
            this.load.image(deck[i], 'src/assets/' + deck[i] + '.png');
        }
    }

    create() {
       // this.add.plugin(PhaserInput.Plugin);

        //var input = this.add.inputField(10, 90);

        this.playerName = '';
        this.players = '';
        this.isPlayerA = false;
        this.opponentCards = [];

        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.outline = this.zone.renderOutline(this.dropZone);

        this.dealer = new Dealer(this);

        let self = this;

        this.socket = io('http://localhost:3000');

        this.socket.on('connect', function () {
            console.log('Connected!');
            var name = prompt("Please enter your name");
            self.playerName = name;
            self.socket.emit("name", name);
        });

        this.playerText = this.add.text(1000, 150, self.playerName).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').disableInteractive();

        this.trumpText = this.add.text(1000, 200, ['Trump:']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').disableInteractive();

        this.socket.on('names', function (names) {
            self.players = names.join();
            self.playerText.setText('Players: ' + self.players);
        })

        this.startText = this.add.text(75, 450, ['START GAME']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').disableInteractive();

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
            self.startText.setInteractive();
        })

        this.startText.on('pointerdown', function () {
           //var starting_number = prompt("Please enter the number of cards to start with", "10");
            self.socket.emit("startgame");
        })
        this.startText.on('pointerover', function () {
            self.startText.setColor('#ff69b4');
        })
        this.startText.on('pointerout', function () {
            self.startText.setColor('#00ffff');
        })

        this.socket.on('dealCards', function (myCards, trump) {
            self.dealer.dealCards(myCards);
            self.dealText.disableInteractive();
            self.trumpText.setText('Trump: ' + trump);
            //var prediction = prompt("Please enter your prediction", "0");
            //self.socket.emit('prediction', prediction);
        })

        this.socket.on('cardPlayed', function (gameObject, isPlayerA) {
            if (isPlayerA !== self.isPlayerA) {
                let sprite = gameObject.textureKey;
                self.opponentCards.shift().destroy();
                self.dropZone.data.values.cards++;
                let card = new Card(self);
                card.render(((self.dropZone.x - 350) + (self.dropZone.data.values.cards * 50)), (self.dropZone.y), sprite).disableInteractive();
            }
        })

        this.dealText = this.add.text(75, 350, ['DEAL CARDS']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        this.dealText.on('pointerdown', function () {
            var starting_number = prompt("Please enter the number of cards to start with", "10");
            self.socket.emit("dealCards", starting_number);
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
            self.socket.emit('cardPlayed', gameObject, self.isPlayerA);
        })
    }
    
    update() {
    
    }
}