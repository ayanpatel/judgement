import io from 'socket.io-client';

export default class Landing extends Phaser.Scene {
	constructor() {
        super({
            key: 'Landing'
        });
    }

    preload() {
    	this.load.html("form", "src/form.html");
    }

    create() {

    	let self = this;

    	this.scale.on('resize', this.resize, this);

    	//this.socket = io('http://localhost:3000');
        this.socket = io('http://192.168.86.30:3000');

        this.socket.on('connect', function () {
            console.log('Connected!');
            if ('guid' in localStorage) {
            	self.guid = localStorage.getItem('guid');
            } else {
            	self.socket.emit('createGUID');
            }
        });

        this.socket.on('GUID', function (Guid) {
        	self.guid = Guid;
        	localStorage.setItem('guid', Guid);
        });

        const screenCenterX = this.cameras.main.width / 2;
		const screenCenterY = this.cameras.main.height / 2;

		this.title = this.add.text(screenCenterX-200, 100, ['JUDGEMENT CARD GAME']).setFontSize(32).setFontFamily('Trebuchet MS').setColor('#ff69b4').disableInteractive();

        this.createGame = this.add.text(screenCenterX-200, screenCenterY+50, ['CREATE GAME']).setFontSize(20).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        this.joinGame = this.add.text(screenCenterX+100, screenCenterY+50, ['JOIN GAME']).setFontSize(20).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        this.formInput = this.add.dom(screenCenterX, screenCenterY-50).createFromCache("form");

        this.invalidInput = this.add.text(screenCenterX+50, screenCenterY-150, ['INVALID CODE']).setFontSize(20).setFontFamily('Trebuchet MS').setColor('#ff0000').disableInteractive();
        self.invalidInput.visible = false;

        this.createGame.on('pointerdown', function () {
        	self.name = self.formInput.getChildByName("name");
            self.socket.emit('createGame');
        })
        this.createGame.on('pointerover', function () {
            self.createGame.setColor('#ff69b4');
        })
        this.createGame.on('pointerout', function () {
            self.createGame.setColor('#00ffff');
        })

        this.joinGame.on('pointerdown', function () {
        	self.name = self.formInput.getChildByName("name");
        	self.code = self.formInput.getChildByName("code");
            self.socket.emit('joinGame', self.code.value);
        })
        this.joinGame.on('pointerover', function () {
            self.joinGame.setColor('#ff69b4');
        })
        this.joinGame.on('pointerout', function () {
            self.joinGame.setColor('#00ffff');
        })

        this.socket.on('gameId', function(gId) {
        	self.scene.start('Game', {gId: gId, name: self.name.value, sock: self.socket, guid: self.guid});
        })

        this.socket.on('invalidCode', function() {
        	self.invalidInput.visible = true;
        })
    }

    update() {

    }

    resize(gameSize, baseSize, displaySize, resolution) {
        let width = gameSize.width;
        let height = gameSize.height;

        this.cameras.resize(width, height);

        const screenCenterX = width / 2;
		const screenCenterY = height / 2;

		this.title.setPosition(screenCenterX-200, 100);
        this.createGame.setPosition(screenCenterX-200, screenCenterY+50);
        this.joinGame.setPosition(screenCenterX+100, screenCenterY+50);
        this.formInput.setPosition(screenCenterX, screenCenterY-50);
        this.invalidInput.setPosition(screenCenterX+50, screenCenterY-150);
    }
}