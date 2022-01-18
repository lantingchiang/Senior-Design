/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const RawMaterial = require('./rawmaterial.js');
const RawMaterialList = require('./rawmateriallist.js');
const RawMaterialQueryUtils = require('./rawmaterialquery.js');

/**
 * A custom context provides easy access to list of all raw materials
 */
class RawMaterialContext extends Context {
    constructor() {
        super();
        // All raw materials are held in a list of raw materials
        // subsequent transactions operate on this list
        this.materialList = new RawMaterialList(this);
    }
}

/**
 * Define raw material smart contract by extending Fabric Contract class
 */
class RawMaterialContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.vaccine.rawmaterial');
    }

    /**
     * Define a custom context for raw material
    */
    createContext() {
        return new RawMaterialContext();
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
     * Create raw material
     * @param {*} ctx 
     * @param {string} materialName name of raw material
     * @param {string} batchNumber batch number of raw material
     * @param {int} quantity quantity of raw material
     * @param {string} manufacturer manufacturer of raw material
     * @param {string} manufactureDate date of manufacture of raw material
     * @return instance of created raw material
     */
    async createMaterial(ctx, materialName, batchNumber, quantity, manufacturer, manufactureDate) {

        // create an instance of the raw material
        let material = RawMaterial.createInstance(materialName, batchNumber, quantity, manufacturer, manufactureDate);

        // save the creator's MSP 
        let mspid = ctx.clientIdentity.getMSPID();
        material.setOwnerMSP(mspid);

        // Add the raw material to the list of all raw materials in the ledger world state
        await ctx.materialList.addRawMaterial(material);

        // Must return a raw material to caller of smart contract
        return material;
    }

    /**
     * Buy raw material
     * @param {*} ctx 
     * @param {string} manufacturer part of primary key to retrieve raw material instance with
     * @param {string} batchNumber part of primary key to retrieve raw material instance with
     * @param {string} purchaser 
     * @param {int} price 
     * @param {string} purchaseDateTime 
     * @returns 
     */
    async purchaseMaterial(ctx, manufacturer, batchNumber, purchaser, price, purchaseDateTime) {

        // Retrieve the target raw material using key fields provided
        let primaryKey = RawMaterial.makeKey([manufacturer, batchNumber]);
        let material = await ctx.materialList.getRawMaterial(primaryKey);

        // Validate raw material isn't already purchased
        if (material.getPurchaser() != null) {
            throw new Error('\nRaw material ' + material.getMaterialName() + ' with batch number '
                + batchNumber + ' manufactured by ' + manufacturer + ' is already purchased');
        }

        // set purchaser, purchase date, price of raw material
        material.setPurchaser(purchaser);
        material.setPurchaseDate(purchaseDateTime);
        material.setPrice(price);

        // save the purchaser's MSP 
        let mspid = ctx.clientIdentity.getMSPID();
        material.setOwnerMSP(mspid);

        // Update the raw material
        await ctx.materialList.updateRawMaterial(material);
        return material;
    }

    /**
     * Sets the dateMixedIn field of raw material; vaccine batch that it's mixed into is kept track of 
     * on the vaccine batch side
     * @param {*} ctx 
     * @param {string} manufacturer part of primary key to retrieve raw material instance with
     * @param {string} batchNumber part of primary key to retrieve raw material instance with
     * @param {string} dateTimeAdded
     * @returns 
     */
    async addMaterial(ctx, manufacturer, batchNumber, dateTimeAdded) {

        // Retrieve the target raw material using key fields provided
        let primaryKey = RawMaterial.makeKey([manufacturer, batchNumber]);
        let material = await ctx.materialList.getRawMaterial(primaryKey);

        // Validate raw material isn't already mixed in
        if (material.getDateMixedIn() != null) {
            throw new Error('\nRaw material ' + material.getMaterialName() + ' with batch number '
                + batchNumber + ' manufactured by ' + manufacturer + ' is already used');
        }

        // set dateMixedIn
        material.setDateMixedIn(dateTimeAdded);

        // Update the raw material
        await ctx.materialList.updateRawMaterial(material);
        return material;
    }

    

    // Query transactions

    /**
     * Query history of a raw material
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer of raw material
     * @param {String} batchNumber of raw material
    */
    async queryHistory(ctx, batchNumber, manufacturer) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        // pass in primary key composed of batch number and manufacturer
        let results = await query.getAssetHistory(batchNumber, manufacturer);
        return results;
    }

    /**
    * queryOwner commercial paper: supply name of owning org, to find list of papers based on owner field
    * @param {Context} ctx the transaction context
    * @param {String} owner commercial paper owner
    */
    async queryOwner(ctx, owner) {

        let query = new QueryUtils(ctx, 'org.papernet.paper');
        let owner_results = await query.queryKeyByOwner(owner);

        return owner_results;
    }

    /**
    * queryPartial commercial paper - provide a prefix eg. "DigiBank" will list all papers _issued_ by DigiBank etc etc
    * @param {Context} ctx the transaction context
    * @param {String} prefix asset class prefix (added to paperlist namespace) eg. org.papernet.paperMagnetoCorp asset listing: papers issued by MagnetoCorp.
    */
    async queryPartial(ctx, prefix) {

        let query = new QueryUtils(ctx, 'org.papernet.paper');
        let partial_results = await query.queryKeyByPartial(prefix);

        return partial_results;
    }

    /**
    * queryAdHoc commercial paper - supply a custom mango query
    * eg - as supplied as a param:     
    * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
    * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
    * 
    * @param {Context} ctx the transaction context
    * @param {String} queryString querystring
    */
    async queryAdhoc(ctx, queryString) {

        let query = new QueryUtils(ctx, 'org.papernet.paper');
        let querySelector = JSON.parse(queryString);
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }


    /**
     * queryNamed - supply named query - 'case' statement chooses selector to build (pre-canned for demo purposes)
     * @param {Context} ctx the transaction context
     * @param {String} queryname the 'named' query (built here) - or - the adHoc query string, provided as a parameter
     */
    async queryNamed(ctx, queryname) {
        let querySelector = {};
        switch (queryname) {
            case "redeemed":
                querySelector = { "selector": { "currentState": 4 } };  // 4 = redeemd state
                break;
            case "trading":
                querySelector = { "selector": { "currentState": 3 } };  // 3 = trading state
                break;
            case "value":
                // may change to provide as a param - fixed value for now in this sample
                querySelector = { "selector": { "faceValue": { "$gt": 4000000 } } };  // to test, issue CommPapers with faceValue <= or => this figure.
                break;
            default: // else, unknown named query
                throw new Error('invalid named query supplied: ' + queryname + '- please try again ');
        }

        let query = new QueryUtils(ctx, 'org.papernet.paper');
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }

}

module.exports = RawMaterialContract;
