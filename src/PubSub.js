class PubSub {

    constructor() {

        this.events = [];

    }

    subscribe(eventName, callback, id) {

        if (!Array.isArray(this.events[eventName]))
            this.events[eventName] = [];

        this.events[eventName].push({ callback: callback, id: id});

    }

    unsubscribe(eventName, id) {

        if (!Array.isArray(this.events[eventName]))
            return;

        this.events[eventName] = this.events[eventName].filter((cb) => {
            return cb.id != id;
        });

    }

    publish(eventName, eventData) {

        if (!this.events[eventName])
            return;

        for (let callback of this.events[eventName])
            callback.callback(eventData);

    }

}