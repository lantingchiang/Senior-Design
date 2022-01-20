/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// Shipment specific classes
const Shipment = require('./shipment.js');
const ShipmentList = require('./shipmentlist.js');
const ShipmentQueryUtils = require('./shipmentquery.js');

/**
 * A custom context provides easy access to list of all shipments
 */
class ShipmentContext extends Context {

    constructor() {
        super();
        // All shipments are held in a list of shipments
        this.shipmentList = new ShipmentList(this);
    }

}

/**
 * Define shipment smart contract by extending Fabric Contract class
 *
 */
class ShipmentContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.vaccine.shipment');
    }

    /**
     * Define a custom context for shipment
    */
    createContext() {
        return new ShipmentContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }

    /**
     * Order shipment
     *
     * @param {Context} ctx the transaction context
     * @param {Integer} shipmentUUID ship UUID
     * @param {String} shipmentProvider company taking care of the shipping
     * @param {String} source location from which the shipment is leaving
     * @param {String} destination location to which the shipment is being delivered

     * @return instance of initiated shipment
    */
    async orderShipment(ctx, shipmentUUID, shipmentProvider, source, destination) {

        // create an instance of the shipment
        let shipment = Shipment.createInstance(shipmentUUID, shipmentProvider, source, destination);


        // // save the creator's MSP  - is this necessary? Because everything has already been purchased
        // let mspid = ctx.clientIdentity.getMSPID();
        // shipment.setOwnerMSP(mspid);

        // Add the shipment to the list of all similar shipments in the ledger world state
        await ctx.shipmentList.addShipment(shipment);

        // Must return a shipment to caller of smart contract
        return shipment;
    }

    /**
     * ship Shipment
     *
     * @param {Context} ctx the transaction context
     * @param {Integer} shipmentUUID shipment identifier
     * @param {Integer} vehicleUUID vehicle identifier
     * @param {String} source current location of the shipment
     * @param {String} timestamp current datetime
     * @param {String} vehicleOperator name/id of the vehicle operator
     * @param {Integer} currentTemp temperature inside the vehicle at the current moment
     * @returns
    */
    async shipShipment(ctx, shipmentUUID, vehicleUUID, source, timestamp, vehicleOperator, currentTemp) {

        // Retrieve the current shipment using key fields provided
        let primaryKey = Shipment.makeKey([shipmentUUID]);
        let shipment = await ctx.shipmentList.getShipment(primaryKey);

        // Validate shipment hasn't already shipped
        if (shipment.getShipDateTime() != null) {
            throw new Error('\nShipment ' + shipmentUUID + ' has already been shipped.');
        }

        // First the shipment moves state from null to LEFTSOURCE
        shipment.setLeftSource();

        // Then set shipDateTime, vehicleUUID, vehicleOperator, currentLocation to the source, 
        // timestamp to shipDateTime, and currentTemp
        shipment.setShipDateTime(timestamp);
        shipment.setVehicleUUID(vehicleUUID);
        shipment.setVehicleOperator(vehicleOperator);
        shipment.setCurrentLocation(source);
        shipment.setCurrentTemp(currentTemp);
        shipment.setTimestamp(timestamp);


        // Update the shipment
        await ctx.shipmentList.updateShipment(shipment);
        return shipment;
    }

    /**
     *  Update current location and temperature
     * 
     * @param {Context} ctx the transaction context
     * @param {Integer} shipmentUUID shipment identifier
     * @param {String} timestamp current time
     * @param {String} currentLocation location at current moment
     * @param {Integer} currentTemp temperature inside the vehicle at the current moment
     * @returns            
     */
    async updateLocationTemp(ctx, shipmentUUID, timestamp, currentLocation, currentTemp) {
        

        // Retrieve the current shipment using key fields provided
        let primaryKey = Shipment.makeKey([shipmentUUID]);
        let shipment = await ctx.shipmentList.getShipment(primaryKey);

        shipment.setCurrentLocation(currentLocation);
        shipment.setCurrentTemp(currentTemp);
        shipment.setTimestamp(timestamp);

        // Update the shipment
        await ctx.shipmentList.updateShipment(shipment);
        return shipment;
    }

    /**
     * shipment Arrival
     *
     * @param {Context} ctx the transaction context
     * @param {Integer} shipmentUUID shipment identifier
     * @param {String} timestamp current datetime
    */
    async shipmentArrival(ctx, shipmentUUID, timestamp) {

        // Retrieve the current shipment using key fields provided
        let primaryKey = Shipment.makeKey([shipmentUUID]);
        let shipment = await ctx.shipmentList.getShipment(primaryKey);

        // Validate shipment hasn't already arrived
        if (shipment.getArrivalDateTime() != null) {
            throw new Error('\nShipment ' + shipmentUUID + ' has already arrived.');
        }

        // set status to ARRIVEDDEST
        shipment.setArrivedDest();
        
        // set arrivalDateTime
        shipment.setArrivalDateTime(timestamp);

        // Update the paper
        await ctx.shipmentList.updateShipment(shipment);
        return shipment;
    }

    // // Query transactions

    // /**
    //  * Query history of a shipment
    //  * @param {Context} ctx the transaction context
    //  * @param {Integer} shipmentUUID shipment unique identifier
    // */
    // async queryHistory(ctx, shipmentUUID) {

    //     // Get a key to be used for History query
    //     let query = new ShipmentQueryUtils(ctx, 'org.vaccine.shipment');
    //     let results = await query.getAssetHistory(shipmentUUID);
    //     return results;

    // }

    // /**
    // * queryOwner commercial paper: supply name of owning org, to find list of papers based on owner field
    // * @param {Context} ctx the transaction context
    // * @param {String} owner commercial paper owner
    // */
    // async queryOwner(ctx, owner) {

    //     let query = new ShipmentQueryUtils(ctx, 'org.vaccine.shipment');
    //     let owner_results = await query.queryKeyByOwner(owner);

    //     return owner_results;
    // }

    // /**
    // * queryPartial commercial paper - provide a prefix eg. "DigiBank" will list all papers _issued_ by DigiBank etc etc
    // * @param {Context} ctx the transaction context
    // * @param {String} prefix asset class prefix (added to paperlist namespace) eg. org.papernet.paperMagnetoCorp asset listing: papers issued by MagnetoCorp.
    // */
    // async queryPartial(ctx, prefix) {

    //     let query = new ShipmentQueryUtils(ctx, 'org.vaccine.shipment');
    //     let partial_results = await query.queryKeyByPartial(prefix);

    //     return partial_results;
    // }

    // /**
    // * queryAdHoc commercial paper - supply a custom mango query
    // * eg - as supplied as a param:     
    // * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
    // * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
    // * 
    // * @param {Context} ctx the transaction context
    // * @param {String} queryString querystring
    // */
    // async queryAdhoc(ctx, queryString) {

    //     let query = new ShipmentQueryUtils(ctx, 'org.vaccine.shipment');
    //     let querySelector = JSON.parse(queryString);
    //     let adhoc_results = await query.queryByAdhoc(querySelector);

    //     return adhoc_results;
    // }


    // /**
    //  * queryNamed - supply named query - 'case' statement chooses selector to build (pre-canned for demo purposes)
    //  * @param {Context} ctx the transaction context
    //  * @param {String} queryname the 'named' query (built here) - or - the adHoc query string, provided as a parameter
    //  */
    // async queryNamed(ctx, queryname) {
    //     let querySelector = {};
    //     switch (queryname) {
    //         case "redeemed":
    //             querySelector = { "selector": { "currentState": 4 } };  // 4 = redeemd state
    //             break;
    //         case "trading":
    //             querySelector = { "selector": { "currentState": 3 } };  // 3 = trading state
    //             break;
    //         case "value":
    //             // may change to provide as a param - fixed value for now in this sample
    //             querySelector = { "selector": { "faceValue": { "$gt": 4000000 } } };  // to test, issue CommPapers with faceValue <= or => this figure.
    //             break;
    //         default: // else, unknown named query
    //             throw new Error('invalid named query supplied: ' + queryname + '- please try again ');
    //     }

    //     let query = new ShipmentQueryUtils(ctx, 'org.vaccine.shipment');
    //     let adhoc_results = await query.queryByAdhoc(querySelector);

    //     return adhoc_results;
    // }

}

module.exports = ShipmentContract;
