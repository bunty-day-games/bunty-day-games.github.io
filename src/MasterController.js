class MasterController {

    constructor() {

        this.tryGet_config(this.init);

    }

    tryGet_config(callback) {

        $.ajax({

            url: "/config.json",
            method: "GET",
            dataType: "json",

            success: (data) => { 

                let obj = this;
                callback(obj, data);

            },

            error: (data) => { 

                eh.raise(eh.levels.CATASTROPHIC, "no config found");

            }

        });

    }

    init(obj, config) {

        ps.subscribe("error", (args) => {

            let errorId = eh.raise(args.level, args.info, args.detail);

            if (config.debug)
                mcDev.error_log(errorId, args.level, args.info, args.detail);

        });

        ui_modalInit();

        let gcGame = new GameController();

        let mcDev = new MenuControllerDev();
        let mcGame = new MenuControllerGame();
        let mcTokens = new MenuControllerTokens();

        let menuItems = [ mcGame, mcTokens, mcDev ];

        ps.subscribe("game-start", (data) => { 

            mcTokens.gameStart(data);
            gcGame.gameStart(data);
            
            obj.menuItem_show(mcTokens, menuItems);

        });

        let btnGame = $("#menu-buttons-game");
        btnGame.click(() => { obj.menuItem_show(mcGame, menuItems) });

        let btnTokens = $("#menu-buttons-tokens");
        btnTokens.click(() => { obj.menuItem_show(mcTokens, menuItems) });

        let btnDev = $("#menu-buttons-dev");
        btnDev.click(() => { obj.menuItem_show(mcDev, menuItems) });
        
        obj.menuItem_show(mcGame, menuItems);

    }

    menuItem_show(menuItem, menuItems) {

        for (let menuItem of menuItems) 
            menuItem.element.hide();

        menuItem.element.show();

    }

}