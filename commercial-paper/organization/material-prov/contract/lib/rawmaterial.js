/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

/**
 * RawMaterial class extends State class
 * Class will be used by application and smart contract to define a raw material
 * Keys:
 *      Material name, batch #, quantity, manufacturer, manufacture date, 
 *      purchaser, purchase date, price, date/time mixed into vaccine
 */
class RawMaterial extends State {

    /**
     * 
     * @param obj JS object that has the following values:
     *            materialName, batchNumber, quantity, manufacturer, manufactureDate
     */
    constructor(obj) {
        // batchNumber and manufacturer together make the primary key of RawMaterial
        // NOTE: put manufacturer in front of batch number because fabric allows queries
        // by prefix of composite key, so if we want to query all raw materials by same manufacturer
        // we need the composite key in this order!
        super(RawMaterial.getClass(), [obj.manufacturer, obj.batchNumber]);
        Object.assign(this, obj);
        this.purchaser = null;
        this.purchaseDate = null;
        this.price = null;
        this.dateMixedIn = null;
        this.mspid = null; //creator's mspid
    }

    /**
     * Basic getters and setters
    */
    getMaterialName() {
        return this.materialName;
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

    getPurchaser() {
        return this.purchaser;
    }

    setPurchaser(purchaser) {
        this.purchaser = purchaser;
    }

    getPurchaseDate() {
        return this.purchaseDate;
    }

    setPurchaseDate(date) {
        this.purchaseDate = date;
    }

    getPrice() {
        return this.price;
    }

    setPrice(price) {
        this.price = price;
    }

    getDateMixedIn() {
        return this.dateMixedIn;
    }

    setDateMixedIn(dateMixedIn) {
        this.dateMixedIn = dateMixedIn;
    }

    setOwnerMSP(mspid) {
        this.mspid = mspid;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    /**
     * Useful methods to encapsulate raw material states
     */
    isSold() {
        return this.purchaseDate != null;
    }

    isUsed() {
        return this.dateMixedIn != null;
    }

    static fromBuffer(buffer) {
        return RawMaterial.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to raw material
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, RawMaterial);
    }

    /**
     * Factory method to create a raw material object
     */
    static createInstance(materialName, batchNumber, quantity, manufacturer, manufactureDate) {
        return new RawMaterial({ materialName, batchNumber, quantity, manufacturer, manufactureDate });
    }

    static getClass() {
        return 'org.vaccine.rawmaterial';
    }
}

module.exports = RawMaterial;
