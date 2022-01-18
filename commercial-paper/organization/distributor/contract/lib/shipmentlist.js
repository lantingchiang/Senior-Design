/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const Shipment = require('./shipment.js');

class ShipmentList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.vaccine.shipment');
        this.use(Shipment);
    }

    async addShipment(shipment) {
        return this.addState(shipment);
    }

    async getShipment(shipment) {
        return this.getState(shipment);
    }

    async updateShipment(shipment) {
        return this.updateState(shipment);
    }
}


module.exports = ShipmentList;
