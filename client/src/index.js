import Phaser from "phaser";
import Game from "./scenes/game";
import Landing from "./scenes/landing";

const config = {
    type: Phaser.CANVAS,
    scale: {
    	parent: "phaser-example",
    	mode: Phaser.Scale.RESIZE,
    	width: '100%',
    	height: '100%'
    },
    //parent: "phaser-example",
    //width: 1280,
    //width: window.innerWidth * window.devicePixelRatio,
    //width: window.innerWidth,
    //height: 780,
    //height: window.innerHeight * window.devicePixelRatio,
    //height: window.innerHeight,
    dom: {
        createContainer: true
    },
    scene: [
    	Landing,
        Game
    ]
};

const game = new Phaser.Game(config);