// ======================================================================
// MAP SCALING
// ======================================================================
//
// The map is scaled relative to its original size:
//  -- first zoom: 100 * 1.2 = 120
//  -- second zoom: 100 * 1.4 = 140
// The camera's position is scaled relative to its last position, as there's no such thing as an "original" position.
// Using the difference between the old map scale and the new map scale leads to an incorrect result:
//  -- first zoom: 10 * 1.2 = 12
//  -- second zoom: 12 * 1.2 = 14.4
// Using the difference between the new map size and the old map size leads to the correct result:
//  -- first zoom: 120 / 100 = 1.2 scale factor
//  -- second zoom: 140 / 120 = 1.67 scale factor
//
// ======================================================================

let g_gameState;
let g_gameSize;
let g_mapSprite, g_tokenSprites;
let g_mapLastClickedPos, g_mapDragging;
let g_currentScale, g_scaleIncrement, g_minScale, g_maxScale, g_mapScaling;

GameState = {

    preload: function() {

        game.stage.backgroundColor = "#FFFFFF";

        game.load.image("map", g_gameState.map.asset);

        for (let tokenGroup of g_gameState.tokenGroups) {

            for (let token of tokenGroup.tokens) {

                game.load.image(token.id, token.asset);

            }

        }

    },

    create: function() {

        // load map

        g_mapSprite = game.add.sprite(0, 0, "map");

        g_mapSprite.naturalSize = {
			w: g_mapSprite.width,
			h: g_mapSprite.height
		}

		g_mapSprite.minSize = {
			w: game.camera.width - 100,
			h: 0
        }
        
        // load and scale tokens

        for (let tokenGroup of g_gameState.tokenGroups) {

            let tokenSpriteGroup = [];

            for (let token of tokenGroup.tokens) {

                let sprite = g_mapSprite.addChild(game.make.sprite(
                    token.x, token.y, token.id));

                sprite.inputEnabled = true;
                sprite.input.enableDrag();
                sprite.visible = token.visible && tokenGroup.visible;

                sprite.naturalSize = {
                    w: sprite.width,
                    h: sprite.height
                }

                sprite.scaledSize = {
                    w: sprite.width,
                    h: sprite.height
                }

                tokenSpriteGroup.push(sprite);

            }

            g_tokenSprites.push(tokenSpriteGroup);

        }

        for (let groupIndex = 0; groupIndex < g_tokenSprites.length; groupIndex++) {

            for (let tokenIndex = 0; tokenIndex < g_tokenSprites[groupIndex].length; tokenIndex++) {

                let token = g_gameState.tokenGroups[groupIndex].tokens[tokenIndex];

                this.token_scale(groupIndex, tokenIndex, token.scale);
                this.token_masterScale(groupIndex, tokenIndex, g_gameState.masterScale);
                this.token_toggleDead(groupIndex, tokenIndex, token.dead);

            }

        }

        // camera drag

        game.camera.bounds = null;
        game.camera.focusOnXY(g_mapSprite.centerX, g_mapSprite.centerY);

        game.input.addMoveCallback((pointer, x, y, click) => {

            this.camera_drag(pointer, x, y, click, this.tokens_pointerOver);

        });

        game.input.onUp.add(this.camera_snapToMapBounds);

        // map scale

        document.getElementById("game").addEventListener("wheel", (event) => { 

            event.preventDefault();
            this.map_scale(event.deltaY < 0);

        });

    },

    camera_drag: function(pointer, x, y, click, pointerOverTokens) {

        if (click) {

            if (pointerOverTokens())
                return;

            g_mapLastClickedPos.x = x;
            g_mapLastClickedPos.y = y;

        }

        if (pointer.leftButton.isDown) {

            if (pointerOverTokens())
                return;

            game.camera.setPosition(
                game.camera.x + (g_mapLastClickedPos.x - x),
                game.camera.y + (g_mapLastClickedPos.y - y)
            );

            g_mapLastClickedPos.x = x;
            g_mapLastClickedPos.y = y;

            g_mapDragging = true;

        }

    },

    camera_snapToMapBounds: function() {

        if (!g_mapDragging && !g_mapScaling)
            return;

        let bounds = {
            w: g_mapSprite.width,
            h: g_mapSprite.height,
            cx: g_mapSprite.centerX,
            cy: g_mapSprite.centerY
        }

        if (game.camera.x < 0) {

			if (bounds.w > g_gameSize.w)
                game.camera.x = 0;
			else
                game.camera.x = bounds.cx - (game.camera.width / 2); 

		} else if (game.camera.x > (bounds.w - game.camera.width)) {

			if (bounds.w > g_gameSize.w)
                game.camera.x = bounds.w - game.camera.width;
			else
                game.camera.x = bounds.cx - (game.camera.width / 2); 

		}

		if (game.camera.y < 0) {

			if (bounds.h > g_gameSize.h)
                game.camera.y = 0;
			else
                game.camera.y = bounds.cy - (game.camera.height / 2); 

		} else if (game.camera.y > (bounds.h - game.camera.height)) {

			if (bounds.h > g_gameSize.h)
                game.camera.y = bounds.h - game.camera.height;
			else
                game.camera.y = bounds.cy - (game.camera.height / 2); 

        }
        
        g_mapDragging = false;

    },

    map_scale: function(scaleUp) {

        if (scaleUp) {

            if (g_currentScale >= g_maxScale)
                return;

            g_currentScale += g_scaleIncrement;

        } else {

            if (g_currentScale <= g_minScale)
                return;

            g_currentScale -= g_scaleIncrement;

        }

        let oldMapScaledSize = {
            w: g_mapSprite.width,
            h: g_mapSprite.height
        }

        game.scale.scaleSprite(g_mapSprite, 
            g_mapSprite.naturalSize.w * g_currentScale,
            g_mapSprite.naturalSize.h * g_currentScale);

        if (g_mapSprite.width < g_gameSize.w) {

            game.camera.focusOnXY(g_mapSprite.centerX, g_mapSprite.centerY);

        } else {

            let scaleDiffX = g_mapSprite.width / oldMapScaledSize.w;
            let scaleDiffY = g_mapSprite.height / oldMapScaledSize.h;

            game.camera.focusOnXY(
                game.camera.view.centerX * scaleDiffX,
                game.camera.view.centerY * scaleDiffY);

        }

        g_mapScaling = true;

        this.camera_snapToMapBounds();

        g_mapScaling = false;

    },

    tokens_pointerOver: function() {

        for (let tokenGroup of g_tokenSprites)
            for (let tokenSprite of tokenGroup)
                if (tokenSprite.input.pointerOver())
                    return true;

        return false;

    },

    token_toggleVisibility: function(groupIndex, tokenIndex, visible) {

        let tokenSprite = g_tokenSprites[groupIndex][tokenIndex];
        tokenSprite.visible = visible;

    },

    token_toggleDead: function(groupIndex, tokenIndex, dead) {

        let tokenSprite = g_tokenSprites[groupIndex][tokenIndex];

        tokenSprite.tint = dead ? 0xff0000 : 0xffffff;

        // let tokenSprite = g_tokenSprites[groupIndex][tokenIndex];

        // if (!dead) {

            // if (tokenSprite.deadSprite)
            //     tokenSprite.deadSprite.destroy();

            // return;

        // }
        
        // let graphics = game.add.graphics(0, 0);
        // graphics.beginFill(0xFF0000, 1);
        // graphics.drawCircle(tokenSprite.x, tokenSprite.y, tokenSprite.width);

        // let texture = graphics.generateTexture();
        // graphics.destroy();

        // tokenSprite.deadSprite = tokenSprite.addChild(game.make.sprite(
        //     0, 0, texture));

    },

    token_scale: function(groupIndex, tokenIndex, scale) {

        let tokenSprite = g_tokenSprites[groupIndex][tokenIndex];

        game.scale.scaleSprite(tokenSprite, 
            tokenSprite.naturalSize.w * scale,
            tokenSprite.naturalSize.h * scale);

        tokenSprite.scaledSize.w = tokenSprite.width;
        tokenSprite.scaledSize.h = tokenSprite.height;

    },

    token_masterScale: function(groupIndex, tokenIndex, scale) {

        let tokenSprite = g_tokenSprites[groupIndex][tokenIndex];

        game.scale.scaleSprite(tokenSprite, 
            tokenSprite.scaledSize.w * scale,
            tokenSprite.scaledSize.h * scale);

    },

    tokens_masterScale: function(scale) {

        for (let tokenGroup of g_tokenSprites) {
            
            for (let tokenSprite of tokenGroup) {

                game.scale.scaleSprite(tokenSprite, 
                    tokenSprite.scaledSize.w * scale,
                    tokenSprite.scaledSize.h * scale);

            }

        }

    },

}