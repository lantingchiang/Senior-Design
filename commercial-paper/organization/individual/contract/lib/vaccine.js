/*
 * An object representing a single vaccine dose.
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

// Enumerate vaccine state values
const vaccineState = {
    READY: 1,
    ISSUED: 2,
    EXPIRED: 3
};

/**
 * Vaccine class extends State class
 * Class will be used by application and smart contract to define a vaccine dose
 */
class Vaccine extends State {

    constructor(obj) {
        super(Vaccine.getClass(), [obj.vaccineUUID]);
        Object.assign(this, obj);
        this.issueDateTime = null;
        this.currentState = null;
        this.issuer = null;
        this.recipient = null;
    }

    /**
     * Basic getters and setters
    */
    getVaccineUUID() {
        return this.vaccineUUID;
    }

    setVaccineUUID(newVaccineUUID) {
        this.vaccineUUID = newVaccineUUID;
    }

    getBatchNum() {
        return this.batchNum;
    }

    setBatchNum(newBatchNum) {
        this.batchNum = newBatchNum;
    }

    getExpirationDateTime() {
        return this.expirationDateTime;
    }

    setExpirationDateTime(newExpirationDateTime) {
        this.expirationDateTime = newExpirationDateTime;
    }

    getManufacturer() {
        return this.manufacturer;
    }

    setManufacturer(newManufacturer) {
        this.manufacturer = newManufacturer;
    }

    getIssuer() {
        return this.issuer;
    }

    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }

    getRecipient() {
        return this.recipient;
    }

    setRecipient(newRecipient) {
        this.recipient = newRecipient;
    }

    // Included methods
    setOwnerMSP(mspid) {
        this.mspid = mspid;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    /**
     * Useful methods to encapsulate vaccine states
     */
    setReady() {
        this.currentState = vaccineState.READY;
    }

    setIssued() {
        this.currentState = vaccineState.ISSUED;
    }

    setExpired() {
        this.currentState = vaccineState.EXPIRED;
    }

    isReady() {
        return this.currentState === vaccineState.READY;
    }

    isIssued() {
        return this.currentState === vaccineState.ISSUED;
    }

    isExpired() {
        return this.currentState === vaccineState.EXPIRED;
    }

    static fromBuffer(buffer) {
        return Vaccine.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to vaccine
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Vaccine);
    }

    /**
     * Factory method to create a vaccine dose object
     */
    static createInstance(vaccineUUID, batchNum, expirationDateTime, manufacturer) {
        return new Vaccine({ vaccineUUID, batchNum, expirationDateTime, manufacturer});
    }

    static getClass() {
        return 'org.vaccine.vaccine';
    }
}

module.exports = Vaccine;
