class ErrorHandler {

    constructor() {

        this.levels = {

            CATASTROPHIC: 0,
            PAINFUL: 1,
            IDIOTIC: 2

        };

        this.errors = [];

    }

    getLevelText(level) {

        switch(level) {
            case this.levels.CATASTROPHIC: return "CATASTROPHIC";
            case this.levels.PAINFUL: return "PAINFUL";
            case this.levels.IDIOTIC: return "IDIOTIC";
        }

    }

    raise(level, info, detail) {

        let errorId = this.errors.length;

        this.errors.push({
            id: errorId,
            level: level,
            info: info,
            detail: detail
        });

        console.log("{ BuntyQuest } " + this.getLevelText(level) + " error: [" + info + "]");

        if (detail != null)
            console.log("{ BuntyQuest } -> " + detail);

        if (level == this.levels.CATASTROPHIC) {

            alert("BuntyQuest is currently unavailable. Sorry :(");

        }

        return errorId;

    }

}