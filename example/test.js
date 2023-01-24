/**
 * @template T
 * @template {(keyof T)?} [Key=null] 
 */
export class Test {
    /** @type {Key} */ _key;
    
    /**
     * 
     * @param {Key?} key 
     */
    constructor(key=null) {
        this._key = key;
    }
}