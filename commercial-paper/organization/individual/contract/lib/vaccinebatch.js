'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate vaccine batch state values
const vaccineState = {
    SHIPPED: 1,
    ARRIVED: 2,
    ISSUED: 3,
    WAREHOUSED: 4
};

/**
 * VaccineBatch class extends State class
 * Class will be used by application and smart contract to define a vaccine batch
 */

class VaccineBatch extends State {

    /**
     * @param obj: JS set with the following object:
     *             vaccineName, batchNumber, quantity, manufacturer, manufactureDate, 
     *             rawMaterialBatchSet (batchNumbers of all raw materials in vaccine batch)
     */
    constructor(obj) {
        // primary key - batch number and manufacturer 
        super(VaccineBatch.getClass(), [obj.batchNumber, obj.manufacturer]);
        Object.assign(this, obj);

        // initialize unknowns to null
        this.purchaser = null;
        this.purchaseDate = null;
        this.currentState = null;
        this.approver = null;
        this.shippingProvider = null;
        this.shipmentUUID = null;
        this.temperature = null;
        this.timestamp = null;
        this.entityAllocated = null;
    }

    /**
     * Basic getters and setters
    */

    getName() {
        return this.vaccineName;
    }

    getBatchNumber() {
        return this.batchNumber;
    }

    getQuantity() {
        return this.quantity;
    }

    getManufacturer() {
        return this.manufacturer;
    }

    getManufactureDate() {
        return this.manufactureDate;
    }

    setPurchaser(newPurchaser) {
        this.purchaser = newPurchaser;
    }

    getPurchaser() {
        return this.purchaser;
    }

    setPurchaseDate(newPurchaseDate) {
        this.purchaseDate = newPurchaseDate;
    }

    getPurchaseDate() {
        return this.purchaseDate;
    }

    setPrice(newPrice) {
        this.price = newPrice;
    }

    getPrice() {
        return this.price;
    }

    setShipped() {
        this.currentState = vaccineState.SHIPPED;
    }

    setArrived() {
        this.currentState = vaccineState.ARRIVED;
    }

    setIssued() {
        this.currentState = vaccineState.ISSUED;
    }

    setWarehoused() {
        this.currentState = vaccineState.WAREHOUSED;
    }

    isShipped() {
        return this.currentState === vaccineState.SHIPPED;
    }

    isArrived() {
        return this.currentState === vaccineState.ARRIVED;
    }

    isIssued() {
        return this.currentState === vaccineState.ISSUED;
    }

    isWarehoused() {
        return this.currentState === vaccineState.WAREHOUSED;
    }

    setApprover(newApprover) {
        this.approver = newApprover;
    }

    getApprover() {
        return this.approver;
    }

    setShippingProvider(newShippingProvider) {
        this.shippingProvider = newShippingProvider;
    }

    getShippingProvider() {
        return this.shippingProvider;
    }

    setShipmentUUID(newShipmentUUID) {
        this.shipmentUUID = newShipmentUUID;
    }

    getShipmentUUID() {
        return this.shipmentUUID;
    }

    setTemperature(newTemperature, newTemperatureTimestamp) {
        this.temperature = newTemperature;
        this.timestamp = newTemperatureTimestamp;
    }

    getTemperature() {
        return [this.timestamp, this.temperature];
    }

    setEntityAllocatedTo(newEntity) {
        this.entityAllocated = newEntity;
    }

    getEntityAllocated() {
        return this.entityAllocated;
    }

    // Included methods
    setOwnerMSP(mspid) {
        this.mspid = mspid;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    static fromBuffer(buffer) {
        return VaccineBatch.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, VaccineBatch);
    }

    /**
     * Factory method to create a commercial vaccine batch object
     */
    static createInstance(vaccineName, batchNumber, quantity, manufacturer, manufactureDate, rawMaterialBatchSet) {
        return new VaccineBatch({ vaccineName, batchNumber, quantity, manufacturer, manufactureDate, rawMaterialBatchSet});
    }

    static getClass() {
        return 'org.vaccine.vaccineBatch';
    }
}

module.exports = VaccineBatch;
