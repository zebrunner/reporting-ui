export default class observerService {
    constructor() {
        this._subscribers = {};
    }

    /**
     * Subscribes listeners
     * @param {String} name - type of event
     * @param {Function} fn - callback which will be executed on appropriate event emission
     * @returns {function(): *} - unsubscribe function
     */
    on(name, fn) {
        console.log(name);
        this._subscribers[name] = this._subscribers[name] || [];
        this._subscribers[name].push(fn);

        return () => this._subscribers[name] = this._subscribers[name].filter(_fn => _fn !== fn);
    }

    /**
     * Emits event
     * @param {String} name - type of event
     * @param {*} [data] - emitted data
     * @returns {boolean} - emission operation status
     */
    emit(name, data) {
        console.log(name, this._subscribers);
        if (!this._subscribers[name] || !this._subscribers[name].length) {
            return false;
        }

        this._subscribers[name].forEach(fn => typeof fn === 'function' && fn(data));

        return true;
    }
}
