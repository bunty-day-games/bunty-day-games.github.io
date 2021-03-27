function ui_initCheckbox(checkbox, checked) {

    checkbox.checked = checked;
    checkbox.style.color = checkbox.checked ? "black" : "lightgrey";

}

function ui_toggleCheckbox(checkbox) {

    checkbox.checked = !checkbox.checked;
    checkbox.style.color = checkbox.checked ? "black" : "lightgrey";

}

function ui_modalInit() {

    let template = document.getElementById("modal-template")
        .content.cloneNode(true);

    let ui = {
        modal: template.querySelector("#modal"),
        title: template.querySelector(".title"),
        closeBtn: template.querySelector(".close"),
        content: template.querySelector(".content")
    }

    // let destroy = () => { this.ui_modalDestroy(ui.modal, ui.title, ui.content) }

    // ui.modal.onclick = (e) => {

    //     if (e.target.id == "modal") 
    //         destroy();

    // }

    // ui.closeBtn.onclick = () => {

    //     destroy();

    // }

    document.body.append(template);

}

function ui_modalDestroy(modal, title, content) {

    $(title).html("");
    $(content).html("");
    $(modal).hide();

}

function ui_confirm(title, text, options) {

    let modal = $("#modal");

    modal.find(".window").width("450px");
    modal.find(".title").text(title);

    let contentTemplate = document.getElementById("modal-confirm-template")
        .content.cloneNode(true);

    let ui = {
        text: contentTemplate.querySelector(".text"),
        options: contentTemplate.querySelector(".options")
    }

    ui.text.innerText = text;

    let destroy = () => { this.ui_modalDestroy(modal, modal.find(".title"), modal.find(".content")) }

    // modal.on("click", () => {

    //     ps.publish("confirm", false);
    //     destroy();

    // });

    modal.find(".close").on("click", () => {

        ps.publish("confirm", false);
        destroy();

    });

    let confirmBtn = document.createElement("div");
    confirmBtn.classList.add("button-general", "hover-shadow");
    confirmBtn.innerText = options[0];

    confirmBtn.onclick = () => { 

        ps.publish("confirm", true);
        destroy();

    }

    ui.options.append(confirmBtn);

    let cancelBtn = document.createElement("div");
    cancelBtn.classList.add("button-general", "hover-shadow");
    cancelBtn.innerText = options[1];

    cancelBtn.onclick = () => { 
        
        ps.publish("confirm", false);
        destroy();
    
    }

    ui.options.append(cancelBtn);

    modal.find(".content").append(contentTemplate);

    modal.show();

}

function ui_prompt(title, text, options) {

    let modal = $("#modal");

    modal.find(".window").width("450px");
    modal.find(".title").text(title);

    let contentTemplate = document.getElementById("modal-prompt-template")
        .content.cloneNode(true);

    let ui = {
        text: contentTemplate.querySelector(".text"),
        inputText: contentTemplate.querySelector(".input-text"),
        options: contentTemplate.querySelector(".options")
    }

    ui.text.innerText = text;

    let destroy = () => { this.ui_modalDestroy(modal, modal.find(".title"), modal.find(".content")) }

    // modal.on("click", () => {

    //     ps.publish("confirm", { confirmed: false });
    //     destroy();

    // });

    modal.find(".close").on("click", () => {

        ps.publish("confirm", { confirmed: false });
        destroy();

    });

    let confirmBtn = document.createElement("div");
    confirmBtn.classList.add("button-general", "hover-shadow");
    confirmBtn.innerText = options[0];

    confirmBtn.onclick = () => { 

        let inputText = ui.inputText.value;

        if (inputText == "")
            return;

        ps.publish("confirm", { confirmed: true, inputText: inputText });
        destroy();

    }

    ui.options.append(confirmBtn);

    let cancelBtn = document.createElement("div");
    cancelBtn.classList.add("button-general", "hover-shadow");
    cancelBtn.innerText = options[1];

    cancelBtn.onclick = () => { 
        
        ps.publish("confirm", { confirmed: false });
        destroy();
    
    }

    ui.options.append(cancelBtn);

    modal.find(".content").append(contentTemplate);

    modal.show();
    ui.inputText.focus();

}