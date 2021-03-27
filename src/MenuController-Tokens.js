class MenuControllerTokens {

    constructor() {
        
        this.element = $("#menu-tokens");

        this.masterScale = this.element.find(".master-scale");
        this.masterScaleDisplay = this.element.find(".master-scale-display");

        this.masterScale.on("input", () => {

            let val = this.masterScale.val();
            ps.publish("master-scale-change", val);

            let display = (Math.floor(val * 100)).toString() + "%";
            this.masterScaleDisplay.text(display);

        });

    }

    gameStart(state) {

        this.masterScale.val(state.masterScale);
        this.masterScaleDisplay.text((Math.floor(state.masterScale * 100)).toString() + "%");

        this.clearState();

        let tokenGroupList = this.element.find("#menu-tokens-group-list").empty();

        for (let groupIndex = 0; groupIndex < state.tokenGroups.length; groupIndex++) {

            let tokenGroup = state.tokenGroups[groupIndex];
            let tokenList = this.tokenGroup_add(tokenGroupList, tokenGroup, groupIndex);

            for (let tokenIndex = 0; tokenIndex < tokenGroup.tokens.length; tokenIndex++) {

                let token = tokenGroup.tokens[tokenIndex];
                this.token_add(tokenList, token, groupIndex, tokenIndex);

            }   

        }

    }

    clearState() {

        this.element.find("#menu-tokens-group-list").empty();

    }

    tokenGroup_add(tokenGroupList, tokenGroup, groupIndex) {

        let template = document.getElementById("menu-tokens-group-template")
            .content.cloneNode(true);

        let ui = {
            visibleCheck: template.querySelector(".menu-tokens-group .visible"),
            id: template.querySelector(".menu-tokens-group .id"),
            expandBtn: template.querySelector(".menu-tokens-group .expand"),
            tokenList: template.querySelector(".menu-tokens-group .tokens")
        }

        ui_initCheckbox(ui.visibleCheck, tokenGroup.visible);

        ui.visibleCheck.onclick = () => {

            ui_toggleCheckbox(ui.visibleCheck);

            ps.publish("group-visibility-toggle", {
                groupIndex: groupIndex,
                value: ui.visibleCheck.checked
            });

        }

        ui.id.innerText = tokenGroup.id;

        ui.expandBtn.onclick = () => {

            if (ui.tokenList.style.display == "none") {

                ui.tokenList.style.display = "block";
                ui.expandBtn.innerText = "-";

            } else {

                ui.tokenList.style.display = "none";
                ui.expandBtn.innerText = "+";

            }

        };

        ui.expandBtn.innerText = "-";

        ui.tokenList.style.display = "block";

        tokenGroupList.append(template);

        return ui.tokenList;

    }

    token_add(tokenList, token, groupIndex, tokenIndex) {

        let template = document.getElementById("menu-tokens-token-template")
            .content.cloneNode(true);

        let ui = {
            listItem: template.querySelector(".menu-tokens-token"),
            visibleCheck: template.querySelector(".menu-tokens-token .visible"),
            id: template.querySelector(".menu-tokens-token .id"),
            options: template.querySelector(".menu-tokens-token .options")
        }

        ui.listItem.id = "group-" + groupIndex + "-token-" + tokenIndex;

        ui_initCheckbox(ui.visibleCheck, token.visible);

        ui.visibleCheck.onclick = () => {

            ui_toggleCheckbox(ui.visibleCheck);

            ps.publish("token-visibility-toggle", {
                groupIndex: groupIndex,
                tokenIndex: tokenIndex,
                value: ui.visibleCheck.checked
            });

        }

        ui.id.innerText = token.id;

        let optionsOpen = false;

        ui.options.onclick = () => {

            if (!optionsOpen) {

                let optionsTemplate = document.getElementById("menu-tokens-token-options-template")
                    .content.cloneNode(true);

                let optionsUI = {
                    scale: optionsTemplate.querySelector(".token-scale"),
                    scaleDisplay: optionsTemplate.querySelector(".token-scale-display"),
                    deadCheck: optionsTemplate.querySelector(".token-dead"),
                }

                optionsUI.scale.value = token.scale;
                optionsUI.scaleDisplay.innerText = (Math.floor(token.scale * 100)).toString() + "%";

                optionsUI.scale.oninput = () => {

                    let val = optionsUI.scale.value;
                    ps.publish("token-scale-change", { scale: val, groupIndex: groupIndex, tokenIndex: tokenIndex });
        
                    let display = (Math.floor(val * 100)).toString() + "%";
                    optionsUI.scaleDisplay.innerText = display;
        
                };

                ui_initCheckbox(optionsUI.deadCheck, token.dead);

                optionsUI.deadCheck.onclick = () => {

                    ui_toggleCheckbox(optionsUI.deadCheck);

                    ps.publish("token-dead-toggle", {
                        groupIndex: groupIndex,
                        tokenIndex: tokenIndex,
                        value: optionsUI.deadCheck.checked
                    });

                }

                document.getElementById(ui.listItem.id).append(optionsTemplate);

                optionsOpen = true;

            } else {

                document.getElementById(ui.listItem.id).getElementsByClassName("menu-tokens-token-options")[0].remove();

                optionsOpen = false;

            }

        }

        tokenList.append(template);

    }

}