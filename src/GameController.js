class GameController {

    constructor() {

        this.state = null;

        ps.subscribe("master-scale-change", (scale) => {

            this.state.masterScale = scale;
            GameState.tokens_masterScale(scale);

        });

        ps.subscribe("token-scale-change", (data) => {

            this.state.tokenGroups[data.groupIndex].tokens[data.tokenIndex].scale = data.scale;

            GameState.token_scale(data.groupIndex, data.tokenIndex, data.scale);
            GameState.token_masterScale(data.groupIndex, data.tokenIndex, this.state.masterScale);

        });

        ps.subscribe("token-visibility-toggle", (data) => {

            let token = this.state.tokenGroups[data.groupIndex].tokens[data.tokenIndex];
            token.visible = data.value;

            let group = this.state.tokenGroups[data.groupIndex];

            GameState.token_toggleVisibility(data.groupIndex, data.tokenIndex, token.visible && group.visible);

        });

        ps.subscribe("group-visibility-toggle", (data) => {

            let group = this.state.tokenGroups[data.groupIndex];
            group.visible = data.value;

            for (let tokenIndex = 0; tokenIndex < group.tokens.length; tokenIndex++)
                GameState.token_toggleVisibility(data.groupIndex, tokenIndex, group.visible && group.tokens[tokenIndex].visible);

        });

        ps.subscribe("token-dead-toggle", (data) => {

            let token = this.state.tokenGroups[data.groupIndex].tokens[data.tokenIndex];
            token.dead = data.value;

            GameState.token_toggleDead(data.groupIndex, data.tokenIndex, token.dead);

        });

        ps.subscribe("request-save-game", (data) => {

            if (this.state == null) {
                alert("No game to save :(");
                return;
            }

            this.updateState();
            ps.publish("save-game", { state: this.state, fileName: data.fileName });

        });

    }

    gameStart(state) {

        this.state = state;

        this.setGameVariables(state);

        if (game != null)
            game.destroy();

        game = new Phaser.Game(g_gameSize.w, g_gameSize.h, Phaser.AUTO, "game");
	    game.state.add("GameState", GameState);
	    game.state.start("GameState", true, true);

    }

    setGameVariables(state) {

        g_gameSize = {
            w: 1000,
            h: 800
        }

        g_gameState = state;

        g_mapSprite = null;
        g_tokenSprites = [];

        g_mapLastClickedPos = {
            x: null,
            y: null
        }

        g_mapDragging = false;

        g_currentScale = 1; 
        g_scaleIncrement = 0.05; 
        g_minScale = 0.1;
        g_maxScale = 2;
        g_mapScaling = false;

    }

    updateState() {

        for (let groupIndex = 0; groupIndex < this.state.tokenGroups.length; groupIndex++) {

            let tokenGroup = this.state.tokenGroups[groupIndex];
            let tokenSpriteGroup = g_tokenSprites[groupIndex];

            // tokenGroup.expanded = 

            for (let tokenIndex = 0; tokenIndex < tokenGroup.tokens.length; tokenIndex++) {

                let token = tokenGroup.tokens[tokenIndex];
                let tokenSprite = tokenSpriteGroup[tokenIndex];

                token.x = tokenSprite.x;
                token.y = tokenSprite.y;

            }

        }

    }

}