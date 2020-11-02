import io from 'socket.io-client';

export default class Landing extends Phaser.Scene {
	constructor() {
        super({
            key: 'Landing'
        });
    }

    preload() {
    	this.load.html("form", "src/form.html");
    	this.load.image("title", "src/assets/judgement_title.png");
    	this.load.image("button_create_game_up", "src/assets/button_create_game_up.png");
    	this.load.image("button_create_game_down", "src/assets/button_create_game_down.png");
    	this.load.image("button_join_game_up", "src/assets/button_join_game_up.png");
    	this.load.image("button_join_game_down", "src/assets/button_join_game_down.png");
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

		this.title = this.add.sprite(screenCenterX+45, 100, "title");

		this.createGame = this.add.sprite(screenCenterX-250, screenCenterY+150, "button_create_game_up").setInteractive();

        this.joinGame = this.add.sprite(screenCenterX+250, screenCenterY+150, "button_join_game_up").setInteractive();

        this.formInput = this.add.dom(screenCenterX, screenCenterY-50).createFromCache("form");

        this.invalidInput = this.add.text(screenCenterX+50, screenCenterY-150, ['INVALID CODE']).setFontSize(20).setFontFamily('Trebuchet MS').setColor('#ff0000').disableInteractive();
        self.invalidInput.visible = false;

        this.createGame.on('pointerdown', function () {
        	self.name = self.formInput.getChildByName("name");
            self.socket.emit('createGame');
        })
        this.createGame.on('pointerover', function () {
            self.createGame.setTexture("button_create_game_down");
        })
        this.createGame.on('pointerout', function () {
            self.createGame.setTexture("button_create_game_up");
        })

        this.joinGame.on('pointerdown', function () {
        	self.name = self.formInput.getChildByName("name");
        	self.code = self.formInput.getChildByName("code");
            self.socket.emit('joinGame', self.code.value);
        })
        this.joinGame.on('pointerover', function () {
            self.joinGame.setTexture("button_join_game_down");
        })
        this.joinGame.on('pointerout', function () {
            self.joinGame.setTexture("button_join_game_up");
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

		this.title.setPosition(screenCenterX+45, 100);
        this.createGame.setPosition(screenCenterX-250, screenCenterY+150);
        this.joinGame.setPosition(screenCenterX+250, screenCenterY+150);
        this.formInput.setPosition(screenCenterX, screenCenterY-50);
        this.invalidInput.setPosition(screenCenterX+50, screenCenterY-150);
    }
}