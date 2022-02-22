'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const VaccineBatch = require('./vaccinebatch.js');
const VaccineBatchList = require('./vaccinebatchlist.js');
const VaccineBatchQueryUtils = require('./vaccinebatchquery.js');

/**
 * A custom context provides easy access to list of all vaccine batches
 */
class VaccineBatchContext extends Context {

    constructor() {
        super();
        // All vaccine batches are held in a list
        this.vaccineBatchList = new VaccineBatchList(this);
    }

}

/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class VaccineBatchContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.vaccine.vaccineBatch');
    }

    /**
     * Define a custom context 
    */
    createContext() {
        return new VaccineBatchContext();
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
     * Issue vaccine batch
     *
     * @param {Context} ctx the transaction context
     * @param {String} vaccineName name of vaccine
     * @param {Integer} batchNumber batch number for manufacturer
     * @param {Integer} quantity number of single vaccines in batch
     * @param {String} manufacturer 
     * TODO: change date to a better format
     * @param {String} manufactureDate date of completion for manufacturing 
    */
    async issue(ctx, vaccineName, batchNumber, quantity, manufacturer, manufactureDate) {

        // create an instance of the batch
        let currVaccineBatch = VaccineBatch.createInstance(vaccineName, batchNumber, quantity, manufacturer, manufactureDate); 

        // set batch to WAREHOUSED state 
        currVaccineBatch.setWarehoused();

        // save the owner's MSP 
        let mspid = ctx.clientIdentity.getMSPID();
        currVaccineBatch.setOwnerMSP(mspid);

        // Add the paper to the list of all similar vaccine batches in the ledger world state
        await ctx.vaccineBatchList.addVaccineBatch(currVaccineBatch);
      
        // Must return a serialized vaccine batch to caller of smart contract
        return currVaccineBatch;
    }

    /**
     * Buy vaccine batch 
     *
      * @param {Context} ctx the transaction context
      * @param {Integer} batchNumber 
      * @param {String} manufacturer 
      * @param {String} currentOwner
      * @param {String} newOwner
      * @param {Integer} price
      * @param {String} purchaseDateTime
    */
    async buy(ctx, batchNumber, manufacturer, currentOwner, newOwner, price, purchaseDateTime) {

        // Retrieve the current paper using key fields provided
        let vaccineBatchKey = VaccineBatch.makeKey([batchNumber, manufacturer]);
        let currVaccineBatch = await ctx.vaccineBatchList.getVaccineBatch(vaccineBatchKey);
      
        // Validate current owner
        if (currVaccineBatch.getPurchaser() !== currentOwner) {
            throw new Error('\Vaccine ' + issuer + batchNumber + ' is not owned by ' + currentOwner);
        }

        // Change purchaser and purchase price 
        currVaccineBatch.setPurchaser(newOwner);
        currVaccineBatch.setPurchaseDate(purchaseDateTime);
        currVaccineBatch.setPrice(price);

        // Update the vaccine batch
        await ctx.vaccineBatchList.updateVaccineBatch(currVaccineBatch);
        return currVaccineBatch;
    }

    /**
     * Ship the vaccine batch
     * 
     * @param {Context} ctx 
     * @param {Integer} batchNumber 
     * @param {String} manufacturer 
     * @param {String} shippingProvider 
     * @param {String} shipmentUUID 
     */
    async ship(ctx, batchNumber, manufacturer, shippingProvider, shipmentUUID) {
        // Retrieve the current paper using key fields provided
        let vaccineBatchKey = VaccineBatch.makeKey([batchNumber, manufacturer]);
        let currVaccineBatch = await ctx.vaccineBatchList.getVaccineBatch(vaccineBatchKey);
      
        // Update shipping location and shipping uuid. Set state to SHIPPED
        currVaccineBatch.setShippingProvider(shippingProvider);
        currVaccineBatch.setShipmentUUID(shipmentUUID);
        currVaccineBatch.setShipped();

        // Update the vaccine batch
        await ctx.vaccineBatchList.updateVaccineBatch(currVaccineBatch);
        return currVaccineBatch;
    }

    /**
     * Set vaccine as arrived to shipping location
     * 
     * @param {Context} ctx 
     * @param {Integer} batchNumber 
     * @param {String} manufacturer 
     * @param {String} arrivalDate // TODO
     */
    async arrived(ctx, batchNumber, manufacturer, arrivalDate) {
         // Retrieve the current paper using key fields provided
         let vaccineBatchKey = VaccineBatch.makeKey([batchNumber, manufacturer]);
         let currVaccineBatch = await ctx.vaccineBatchList.getVaccineBatch(vaccineBatchKey);
       
         // update arrival fields
         currVaccineBatch.setArrived();
 
         // Update the vaccine batch
         await ctx.vaccineBatchList.updateVaccineBatch(currVaccineBatch);
         return currVaccineBatch;
    }

    // Queries
    /**
     * Query history of a vaccine batch
     * @param {Context} ctx the transaction context
     * @param {String} vaccinebatchUUID unique id of a vaccine batch
    */
     async queryHistory(ctx, batchNumber, manufacturer) {
        let query = new VaccineBatchQueryUtils(ctx, 'org.vaccine.vaccineBatch');
        // pass in primary key composed of vaccineUUID
        let results = await query.getAssetHistory(batchNumber, manufacturer);
        return results;
    }

    async queryIssueDateTime(ctx, issueDateTime) {
        let query = new VaccineBatchQueryUtils(ctx, 'org.vaccine.vaccineBatch');
        let results = await query.queryByIssueDateTime(issueDateTime);
        console.log("------ Result returned by query issue date time -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryBatchNumber(ctx, batchNumber) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.vaccineBatch');
        let results = await query.queryByBatchNumber(batchNumber);
        console.log("------ Result returned by query batch number -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryManufacturer(ctx, manufacturer) {
        let query = new VaccineBatchQueryUtils(ctx, 'org.vaccine.vaccineBatch');
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

        let query = new QueryUtils(ctx, 'org.vaccine.vaccineBatch');
        let partial_results = await query.queryKeyByPartial(prefix);
        console.log("------ Result returned by query partial -----\n", results,
            "-------------------------------\n");

        return partial_results;
    }

    /**
    * queryAdHoc vaccine - supply a custom query for couch db
    * eg - as supplied as a param:     
    * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
    * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
    * 
    * @param {Context} ctx the transaction context
    * @param {String} queryString querystring
    */
    async queryAdhoc(ctx, queryString) {

        let query = new QueryUtils(ctx, 'org.vaccine.vaccineBatch');
        let querySelector = JSON.parse(queryString);
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }

}

module.exports = VaccineBatchContract;
