// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// https://developer.mozilla.org/en-US/docs/Web/API/Blob
// 
// * "file" is a blob
// * fr.readDataAsURL(file) generates a URL representing the file's data
// * fr.result returns a URL representing the file as a base64 encoded string, which can then be passed to Phaser's game.load.image(name, path) function
// * fr.readAsText(file) would work for reading a JSON file into a string which can then be parsed with JSON.parse()
//
// // https://betterprogramming.pub/create-a-sortable-list-with-draggable-items-using-javascript-9ef38f96b258
//
// * Drag to reorder groups/tokens

class MenuControllerGame {

    constructor() {

        this.element = $("#menu-game");
        
        let btnStartNew = $(this.element).find(".start-new");
        btnStartNew.click(() => { this.startNew_show() })
        this.startNew_init();

        let btnLoadExisting = $(this.element).find(".load-existing");
        btnLoadExisting.click(() => { this.loadExisting_show() })
        this.loadExisting_init();

        let btnSave = $(this.element).find(".save");
        btnSave.click(() => { 

            let saveConfirmed = (data) => { 

                if (!data.confirmed)
                    return;

                ps.publish("request-save-game", { fileName: data.inputText });
                ps.unsubscribe("confirm", "confirm-save");

            }

            ps.subscribe("confirm", saveConfirmed, "confirm-save");
            ui_prompt("Save Game", "Name", [ "Save", "Cancel" ]);

        });

        ps.subscribe("save-game", this.save);

    }

    modalStartLoad_init(modalId) {

        let template = document.getElementById("menu-game-start-load-template")
            .content.cloneNode(true);

        let ui = {
            modal: template.querySelector(".modal"),
            filePicker: template.querySelector(".file-picker"),
            title: template.querySelector(".title"),
            id: template.querySelector(".id"),
            idDisplay: template.querySelector(".id-display"),
            masterScale: template.querySelector(".master-scale"),
            mapPicker: template.querySelector(".map-picker"),
            mapDisplay: template.querySelector(".map-display"),
            mapUrl: template.querySelector(".map-url"),
            closeBtn: template.querySelector(".close"),
            tokenGroupList: template.querySelector(".token-groups"),
            addGroupBtn: template.querySelector(".add-group"),
            imageMultiBtn: template.querySelector(".image-multiselect"),
            cancelBtn: template.querySelector(".cancel"),
            startBtn: template.querySelector(".start")
        }

        ui.modal.id = modalId;

        function modalStartLoad_destroy() {

            $(ui.modal).find("*").removeClass("error");
            $(ui.id).val("");
            $(ui.idDisplay).text("");
            $(ui.mapDisplay).text("");
            $(ui.tokenGroupList).html("");

            $(ui.modal).hide();

        }

        ui.modal.onclick = (e) => {

            if (e.target.id == modalId)
                modalStartLoad_destroy();

        }

        ui.closeBtn.onclick = () => {

            modalStartLoad_destroy();

        }

        ui.cancelBtn.onclick = () => {

            modalStartLoad_destroy();

        };

        ui.mapPicker.onchange = (e) => {

            let file = e.target.files[0];

            if (!file)
                return;

            let fr = new FileReader();

            fr.addEventListener("load", () => {

                ui.mapDisplay.innerText = file.name;
                ui.mapUrl.innerText = fr.result;

            }, false);

            fr.readAsDataURL(file);

        }

        ui.addGroupBtn.onclick = () => {

            let focus = this.startLoad_addTokenGroup(null, ui.tokenGroupList);
            focus.focus();

        };

        ui.imageMultiBtn.onchange = (e) => {

            if (e.target.files.length == 0)
                return;

            let images = [];
            let obj = this;

            function readFile(file, callback) {

                let fr = new FileReader();

                fr.addEventListener("load", () => {

                    images.push({
                        fileName: file.name,
                        data: fr.result
                    });

                    if (images.length == e.target.files.length)
                        callback(images, obj);

                }, false);

                fr.readAsDataURL(file);

            }

            for (let file of e.target.files)
                readFile(file, this.loadExisting_imageMultiSelect);

        }

        ui.startBtn.onclick = () => {

            let map = this.startLoad_getStateUIMap(modalId);
            let errors = this.startLoad_handleErrors(modalId, map);

            if (errors)
                return;

            ps.publish("game-start", map.data);
            modalStartLoad_destroy();

        };

        document.body.append(template);

        return ui;

    }

    startNew_init() {

        let ui = this.modalStartLoad_init("modal-start-new-game");

        ui.title.innerText = "Start New Game";
        ui.masterScale.innerText = "1";

        $(ui.modal).find(".hide-new").each((i, e) => {
            $(e).hide();
        });

    }

    startNew_show() {

        let modalStartNew = $("#modal-start-new-game");
        modalStartNew.show();

        let idField = $(modalStartNew).find(".id");
        idField.focus();

    }

    loadExisting_init() {

        let ui = this.modalStartLoad_init("modal-load-existing-game");

        ui.title.innerText = "Load Existing Game";

        ui.filePicker.onchange = (e) => {

            $(ui.tokenGroupList).html("");

            let file = e.target.files[0];

            if (!file)
                return;

            let fr = new FileReader();

            fr.addEventListener("load", () => {

                let id = file.name.slice(0, -5);

                ui.id.value = id;
                ui.idDisplay.innerText = id;

                let json = null;

                try {

                    json = JSON.parse(fr.result);

                } catch (err) {

                    ps.publish("error", { 
                        level: eh.levels.IDIOTIC, 
                        info: "load existing game - can't parse selected JSON file", 
                        detail: "JSON: " + fr.result.toString() 
                    });

                }

                if (json != null)
                    this.loadExisting_load(json, ui);

            }, false);

            fr.readAsText(file);

        }

        $(ui.modal).find(".hide-load").each((i, e) => {
            $(e).hide();
        });

    }

    loadExisting_show() {

        let modalLoadExisting = $("#modal-load-existing-game");
        modalLoadExisting.show();

    }

    loadExisting_load(state, ui) {

        ui.masterScale.innerText = state.masterScale;
        ui.mapDisplay.innerText = state.map.assetFile;

        for (let tokenGroup of state.tokenGroups) {

            let tokenList = this.startLoad_addTokenGroup(tokenGroup, ui.tokenGroupList);

            for (let token of tokenGroup.tokens) {

                this.startLoad_addToken(token, tokenList);

            }

        }

    }

    loadExisting_imageMultiSelect(images, obj) {

        let map = obj.startLoad_getStateUIMap("modal-load-existing-game");
        
        for (let tg = 0; tg < map.data.tokenGroups.length; tg++) {

            let tokenGroup = map.data.tokenGroups[tg];

            for (let t = 0; t < tokenGroup.tokens.length; t++) {

                let token = tokenGroup.tokens[t];

                let matchingImage = images.find(img => img.fileName == token.assetFile);
                
                if (matchingImage != undefined)
                    map.ui.tokenGroups[tg].tokens[t].asset.text(matchingImage.data);

            }

        }

        map = obj.startLoad_getStateUIMap("modal-load-existing-game");
        obj.startLoad_handleErrors("modal-load-existing-game", map);

    }

    startLoad_addTokenGroup(tokenGroup, tokenGroupList) {

        let template = document.getElementById("menu-game-start-new-token-group-template")
            .content.cloneNode(true);

        let ui = {
            groupListItem: template.querySelector(".modal-start-new-game-group"),
            groupIdText: template.querySelector(".modal-start-new-game-group .id"),
            addTokenBtn: template.querySelector(".modal-start-new-game-group .add-token"),
            deleteGroupBtn: template.querySelector(".modal-start-new-game-group .delete"),
            toggleGroupBtn: template.querySelector(".modal-start-new-game-group .toggle"),
            visibleCheck: template.querySelector(".modal-start-new-game-group .visible"),
            tokenList: template.querySelector(".modal-start-new-game-group .tokens"),
        }

        ui.toggleGroupBtn.onclick = () => {

            if (ui.tokenList.style.display == "none") {

                ui.tokenList.style.display = "block";
                ui.toggleGroupBtn.innerText = "-";

            } else {

                ui.tokenList.style.display = "none";
                ui.toggleGroupBtn.innerText = "+";

            }

        };

        ui.deleteGroupBtn.onclick = () => {

            let tokenCount = $(".modal-start-new-game-group .tokens").children("li").length;

            if (tokenCount > 0) {

                let confirmed = confirm("Are you sure you want to delete this group?");
                if (!confirmed)
                    return;

            }

            ui.groupListItem.remove();

        };

        ui.addTokenBtn.onclick = () => {

            let focus = this.startLoad_addToken(null, ui.tokenList);
            focus.focus();

        };

        ui_initCheckbox(ui.visibleCheck, true);

        ui.visibleCheck.onclick = () => {

            ui_toggleCheckbox(ui.visibleCheck);

        }

        tokenGroupList.append(template);

        if (tokenGroup == null)
            return ui.groupIdText;

        ui.groupIdText.value = tokenGroup.id;
        ui_initCheckbox(ui.visibleCheck, tokenGroup.visible);

        return ui.tokenList;

    }

    startLoad_addToken(token, tokenList) {

        let template = document.getElementById("menu-game-start-new-token-template")
            .content.cloneNode(true);

        let ui = {
            tokenListItem: template.querySelector(".modal-start-new-game-token"),
            tokenIdText: template.querySelector(".modal-start-new-game-token .id"),
            imagePicker: template.querySelector(".modal-start-new-game-token .image"),
            imageUrl: template.querySelector(".modal-start-new-game-token .image-url"),
            imageFileName: template.querySelector(".modal-start-new-game-token .image-filename"),
            xNumber: template.querySelector(".modal-start-new-game-token .x"),
            yNumber: template.querySelector(".modal-start-new-game-token .y"),
            visibleCheck: template.querySelector(".modal-start-new-game-token .visible"),
            deleteTokenButton: template.querySelector(".modal-start-new-game-token .delete"),
            scale: template.querySelector(".modal-start-new-game-token .scale"),
            dead: template.querySelector(".modal-start-new-game-token .dead"),
        }

        ui.imagePicker.onchange = (e) => {

            let file = e.target.files[0];

            if (!file)
                return;

            let fr = new FileReader();

            fr.addEventListener("load", () => {

                ui.imageFileName.innerText = file.name;
                ui.imageUrl.innerText = fr.result;
                

            }, false);

            fr.readAsDataURL(file);

        }

        ui_initCheckbox(ui.visibleCheck, true);

        ui.visibleCheck.onclick = () => {

            ui_toggleCheckbox(ui.visibleCheck);

        }

        ui.deleteTokenButton.onclick = () => {

            let confirmed = confirm("Are you sure you want to delete this token?");
            if (!confirmed)
                return;

            ui.tokenListItem.remove();

        };

        ui.scale.innerText = 1;
        ui.dead.innerText = 0;

        tokenList.append(template);

        if (token == null)
            return ui.tokenIdText;

        ui.tokenIdText.value = token.id;
        ui.imageFileName.innerText = token.assetFile;
        ui_initCheckbox(ui.visibleCheck, token.visible);
        ui.xNumber.value = token.x;
        ui.yNumber.value = token.y;
        ui.scale.innerText = token.scale;
        ui.dead.innerText = token.dead ? 1 : 0;

    }

    startLoad_getStateUIMap(modalId) {

        let errors = [];

        let modal = $("#" + modalId);

        let uiId = $(modal).find(".id"); // this is getting ALL .id classes below the modal (a lot). presumably the .val() function is getting the value from ths first one which is why no error is thrown.

        let uiMasterScale = $(modal).find(".master-scale");

        let mapFile = $(modal).find(".map-display");
        let mapUrl = $(modal).find(".map-url");

        let data = {
            id: uiId.val(),
            masterScale: parseFloat(uiMasterScale.text()),
            map: {
                assetFile: mapFile.text(),
                asset: mapUrl[0].textContent
            },
            tokenGroups: []
        }

        let ui = {
            tokenGroups: []
        }

        this.startLoad_generateError(uiId, data.id, errors, "Game does not have a name.");
        this.startLoad_generateError($(modal).find(".map-picker-label"), data.map.asset, errors, "Game does not have a map.");

        let tokenGroups = $(modal).find(".token-groups > li");

        tokenGroups.each((i, tg) => {

            let tokenGroup = {
                id: "",
                expanded: true,
                visible: true,
                tokens: []
            }

            let tokenGroupUI = {
                id: $(tg).find(".id"),
                expanded: null,
                visible: $(tg).find(".visible"),
                tokens: []
            }

            tokenGroup.id = tokenGroupUI.id.val();
            this.startLoad_generateError(tokenGroupUI.id, tokenGroup.id, errors, "Token group [" + (i + 1) + "] does not have a name");

            tokenGroup.visible = tokenGroupUI.visible[0].checked;

            let tokens = $(tg).find(".tokens > li");

            tokens.each((j, t) => {

                let token = {

                    id: "",
                    assetFile: "",
                    asset: "",
                    x: "",
                    y: "",
                    visible: false,
                    scale: 1,
                    dead: false

                }

                let tokenUI = {
                    id: $(t).find(".id"),
                    assetFile: $(t).find(".image-filename"),
                    asset: $(t).find(".image-url"),
                    assetButton: $(t).find(".image-button"),
                    x: $(t).find(".x"),
                    y: $(t).find(".y"),
                    visible: $(t).find(".visible"),
                    scale: $(t).find(".scale"),
                    dead: $(t).find(".dead")
                }

                token.id = tokenUI.id.val();
                this.startLoad_generateError(tokenUI.id, token.id, errors, "Token [" + (j + 1) + "] in group [" + (i + 1) + "] does not have a name");

                token.asset = tokenUI.asset.text();
                this.startLoad_generateError(tokenUI.assetButton, token.asset, errors, "Token [" + (j + 1) + "] in group [" + (i + 1) + "] does not have an asset image");

                token.assetFile = tokenUI.assetFile.text();

                token.x = tokenUI.x.val();
                this.startLoad_generateError(tokenUI.x, token.x, errors, "Token [" + (j + 1) + "] in group [" + (i + 1) + "] does not have an x value");

                token.y = tokenUI.y.val();
                this.startLoad_generateError(tokenUI.y, token.y, errors, "Token [" + (j + 1) + "] in group [" + (i + 1) + "] does not have a y value");

                token.visible = tokenUI.visible[0].checked;

                token.scale = parseFloat(tokenUI.scale.text());
                token.dead = tokenUI.dead.text() == "0" ? false : true;

                tokenGroup.tokens.push(token);
                tokenGroupUI.tokens.push(tokenUI);

            });

            data.tokenGroups.push(tokenGroup);
            ui.tokenGroups.push(tokenGroupUI);

        });

        let tokenGroupCount = data.tokenGroups.length;

        let tokenCount = 0;
        for (let tokenGroup of data.tokenGroups)
            tokenCount += tokenGroup.tokens.length;

        let noTokens = tokenGroupCount == 0 || tokenCount == 0;

        if (noTokens) {

            errors.push({ 
                type: 0,
                element: null,
                text: "Game must have at least one token group containing a single token"
            });

        }

        return { data: data, ui: ui, errors: errors };

    }

    startLoad_generateError(element, value, errors, errorText) {

        let error = value == "";

        if (!error)
            return;

        errors.push({ 
            type: 1,
            element: element, 
            text: errorText
        });

    }

    startLoad_handleErrors(modalId, stateUIMap) {

        $("#" + modalId).find("*").removeClass("error");

        let errorString = "";

        for (let error of stateUIMap.errors) {

            if (error.element != null)
                error.element.addClass("error");
                
            errorString += error.text + "\n";

        }

        if (stateUIMap.errors.length == 0)
            return false;

        if (stateUIMap.errors.some(err => err.type == 0)) {

            ps.publish("error", {
                level: eh.levels.IDIOTIC,
                info: "start/load game - no tokens created",
                detail: "JSON: " + JSON.stringify(stateUIMap.data)
            });

            alert("You need at least one token group containing one token!");

            return true;

        }

        if (stateUIMap.errors.some(err => err.type == 1)) {

            ps.publish("error", {
                level: eh.levels.IDIOTIC,
                info: "start/load game - errors in token list",
                detail: "Errors:\n" + errorString
            });

            alert("There are errors! Whack.");

            return true;

        }

    }

    save(data) {

        let json = JSON.stringify(data.state, null, "\t");
        let file = new Blob([json], { type: "text/plain" });

        let a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = data.fileName + ".json";
        a.click();

    }

}