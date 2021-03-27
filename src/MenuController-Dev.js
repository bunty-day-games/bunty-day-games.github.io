class MenuControllerDev {

    constructor() {

        this.element = $("#menu-dev");
        this.startDevBtn = $(".start-dev");
        this.errorList = $("#menu-dev-error-list");
        this.errorItemTemplate = document.getElementById("menu-dev-error-item-template");

        this.startDevBtn.click(() => {

            this.devMode_init();

        });

    }

    devMode_init() {

        $.ajax({

            url: "/dev/state.json",
            method: "GET",
            dataType: "json",

            success: (data) => { 

                ps.publish("game-start", data);

            },

            error: (data) => { 

                ps.publish("error", {
                    level: eh.levels.PAINFUL,
                    info: "can't access dev assets",
                    detail: data
                });

            }

        });

    }

    error_log(errorId, level, info, detail) {

        let text = "[" + errorId + "] " + eh.getLevelText(level) + " error:\n[" + info + "]";

        let errorItem = this.errorItemTemplate.content.cloneNode(true);

        let errorItemInfo = errorItem.querySelector(".menu-dev-error-item .info");
        errorItemInfo.innerText = text;

        let errorItemDetail = errorItem.querySelector(".menu-dev-error-item .detail");
        errorItemDetail.innerText = detail == null ? "no further detail" : detail;
        errorItemDetail.style.display = "none";

        errorItemInfo.onclick = () => {

            errorItemDetail.style.display = errorItemDetail.style.display == "none" ? "block" : "none";

        }

        this.errorList.append(errorItem);

    }

}