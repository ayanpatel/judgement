import Card from './card';

export default class Dealer {
    constructor(scene) {
        this.dealCards = (starting_number) => {
            let playerSprite;
            let opponentSprite;
            if (scene.isPlayerA) {
                playerSprite = '2C';
                opponentSprite = 'red_back';
            } else {
                playerSprite = '2D';
                opponentSprite = 'red_back';
            };
            for (let i = 0; i < 5; i++) {
                let playerCard = new Card(scene);
                playerCard.render(475 + (i * 100), 650, playerSprite);

                let opponentCard = new Card(scene);
                scene.opponentCards.push(opponentCard.render(475 + (i * 100), 125, opponentSprite).disableInteractive());
            }
        }
    }
}