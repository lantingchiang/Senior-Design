/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');
const QueryUtils = require('../../../digibank/contract/lib/queries.js');

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
        console.log('Instantiate the contract for raw materials');
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
        // Retrieve the target raw material using key fields provided
        let primaryKey = RawMaterial.makeKey([manufacturer, batchNumber]);
        let material = await ctx.materialList.getRawMaterial(primaryKey);

        // check if raw material exists
        if (material && material.length > 0) {
            throw new Error(`Raw material ${batchNumber} from ${manufacturer} already exists`);
        }

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

        // check if raw material exists
        if (!material || material.length == 0) {
            throw new Error(`Raw material ${batchNumber} from ${manufacturer} doesn't exist`);
        }

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

    
    // ==========================================================
    // =================== Query transactions ===================
    // ==========================================================

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
     * queryName: supply name of raw material to find list of raw materials with given name
     * @param {Context} ctx 
     * @param {String} name name of raw material
     */
    async queryName(ctx, name) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        let results = await query.queryByName(name);
        console.log("------ Result returned by query name -----\n", results,
            "-------------------------------\n");

        return results;
    }

    /**
    * queryPurchaser: supply purchaser of raw materialto find list of 
    * raw materials this purchaser purchased
    * @param {Context} ctx the transaction context
    * @param {String} purchaser raw material purchaser
    */
    async queryPurchaser(ctx, owner) {

        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        let results = await query.queryByPurchaser(owner);
        console.log("------ Result returned by query purchaser -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryDateMixedIn(ctx, dateMixedIn) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        let results = await query.queryByDateMixedIn(dateMixedIn);
        console.log("------ Result returned by query date mixed in -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryBatchNumber(ctx, batchNumber) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        let results = await query.queryByBatchNumber(batchNumber);
        console.log("------ Result returned by query batch number -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryManufacturer(ctx, manufacturer) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.rawmaterial');
        let results = await query.queryByManufacturer(manufacturer);
        console.log("------ Result returned by query manufacturer -----\n", results,
            "-------------------------------\n");

        return results;
    }


    /**
    * queryPartial: retrieves composite keys given a prefix of the key, e.g. given manufacturer name
    * @param {Context} ctx the transaction context
    * @param {String} prefix manufacturer name
    */
    async queryPartial(ctx, prefix) {

        let query = new QueryUtils(ctx, 'org.vaccine.rawmaterial');
        let partial_results = await query.queryKeyByPartial(prefix);
        console.log("------ Result returned by query partial -----\n", results,
            "-------------------------------\n");

        return partial_results;
    }

    /**
    * queryAdHoc raw material - supply a custom query for couch db
    * eg - as supplied as a param:     
    * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
    * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
    * 
    * @param {Context} ctx the transaction context
    * @param {String} queryString querystring
    */
    async queryAdhoc(ctx, queryString) {

        let query = new QueryUtils(ctx, 'org.vaccine.rawmaterial');
        let querySelector = JSON.parse(queryString);
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }

}

module.exports = RawMaterialContract;
