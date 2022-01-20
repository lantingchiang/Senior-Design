/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

// Enumerate commercial paper state values
const shipmentState = {
    LEFTSOURCE: 1,
    ARRIVEDDEST: 2
};

/**
 * Shipment class extends State class
 * Class will be used by application and smart contract to define a shipment
 */
class Shipment extends State {

    constructor(obj) {
        super(Shipment.getClass(), [obj.shipmentUUID]);
        Object.assign(this, obj);

        this.vehicleUUID = null;
        this.vehicleOperator = null;
        this.currentLocation = null;
        this.currentTemp = null;
        this.timestamp = null;
        this.shipDateTime = null;
        this.arrivalDateTime = null;
        this.mspid = null; //creator's mspid
    }

    /**
     * Basic getters and setters
    */
    getShipmentUUID() {
        return this.shipmentUUID;
    }

    getShipmentProvider() {
        return this.shipmentProvider;
    }

    getSource() {
        return this.source;
    }

    getDestination() {
        return this.destination;
    }

    setVehicleUUID(newVehicleUUID) {
        this.vehicleUUID = newVehicleUUID;
    }

    getVehicleUUID() {
        return this.vehicleUUID;
    }

    setVehicleOperator(newVehicleOperator) {
        this.vehicleOperator = newVehicleOperator;
    }

    getVehicleOperator() {
        return this.vehicleOperator;
    }

    setCurrentLocation(newCurrentLocation) {
        this.currentLocation = newCurrentLocation;
    }

    getCurrentLocation() {
        return this.currentLocation;
    }

    setCurrentTemp(newCurrentTemp) {
        this.currentTemp = newCurrentTemp;
    }

    getCurrentTemp() {
        return this.currentTemp;
    }

    setTimestamp(newTimestamp) {
        this.timestamp = newTimestamp;
    }

    getTimestamp() {
        return this.timestamp;
    }

    setShipDateTime(newShipDateTime) {
        this.shipDateTime = newShipDateTime;
    }

    getShipDateTime() {
        return this.shipDateTime;
    }

    setArrivalDateTime(newArrivalDateTime) {
        this.arrivalDateTime = newArrivalDateTime;
    }

    getArrivalDateTime() {
        return this.arrivalDateTime;
    }

    setOwnerMSP(mspid) {
        this.mspid = mspid;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    /**
     * Useful methods to encapsulate commercial paper states
     */
    setLeftSource() {
        this.currentState = shipmentState.LEFTSOURCE;
    }

    setArrivedDest() {
        this.currentState = shipmentState.ARRIVEDDEST;
    }

    isShipped() {
        return this.currentState === shipmentState.LEFTSOURCE;
    }

    isArrived() {
        return this.currentState === shipmentState.ARRIVEDDEST;
    }

    static fromBuffer(buffer) {
        return Shipment.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to shipment
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Shipment);
    }

    /**
     * Factory method to create a shipment object
     */
    static createInstance(shipmentUUID, shipmentProvider, source, destination) {
        return new Shipment({ shipmentUUID, shipmentProvider, source, destination });
    }

    static getClass() {
        return 'org.vaccine.shipment';
    }
}

module.exports = Shipment;
