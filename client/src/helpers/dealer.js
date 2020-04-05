import Card from './card';

export default class Dealer {
    constructor(scene) {
        this.dealCards = (myCards) => {
            //let opponentSprite = 'red_back';
            for (let i = 0; i < myCards.length; i++) {
                let playerCard = new Card(scene);
                playerCard.render(275 + (i * 100), 650, myCards[i]);

                //let opponentCard = new Card(scene);
                //scene.opponentCards.push(opponentCard.render(275 + (i * 100), 125, opponentSprite).disableInteractive());
            }
        }
    }
}