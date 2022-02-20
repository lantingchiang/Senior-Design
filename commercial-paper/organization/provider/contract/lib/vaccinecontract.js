'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');
//const QueryUtils = require('../../../digibank/contract/lib/queries.js');

// PaperNet specifc classes
const Vaccine = require('./vaccine.js');
const VaccineList = require('./vaccinelist.js');
const VaccineQueryUtils = require('./vaccinequery.js');

/**
 * A custom context provides easy access to list of all individual vaccines
 */
class VaccineContext extends Context {

    constructor() {
        super();
        // All vaccines are held in a list
        this.vaccineList = new VaccineList(this);
    }

}

/**
 * Define vaccine dose smart contract by extending Fabric Contract class
 *
 */
class VaccineContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.vaccine.vaccine');
    }

    /**
     * Define a custom context 
    */
    createContext() {
        return new VaccineContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract for vaccines');
    }

    /**
     * Issue vaccine dose to a patient. 
     *
     * @param {Context} ctx the transaction context
     * @param {Integer} vaccineUUID the unique id of this vaccine dose
     * @param {Integer} batchNum the vaccine batch number that this dose came from
     * @param {String} manufacturer the manufacturer of the vaccine
     * @param {String} issuer name of individual who gave the vaccine dose
     * @param {String} recipient name of individual who recieved the vaccine dose
     * TODO: change date to a better format
     * @param {String} expirationDateTime date of expiration
     * @param {String} issueDateTime date of issue
     * 
    */
    async issue(ctx, vaccineUUID, batchNum, manufacturer, issuer, recipient, expirationDateTime, issueDateTime) {

        // create an instance of the vaccine
        let currVaccine = Vaccine.createInstance(vaccineUUID, batchNum, expirationDateTime, manufacturer); 

        // set batch to ISSUED state 
        currVaccine.setIssued();

        // set issuer and reicpient of vaccine
        currVaccine.setIssuer(issuer);
        currVaccine.setRecipient(recipient);

        // set issue date and time
        currVaccine.setIssueDateTime(issueDateTime);

        // save the owner's MSP 
        let mspid = ctx.clientIdentity.getMSPID();
        currVaccine.setOwnerMSP(mspid);

        // Add the vaccine to the list of all similar vaccines in the ledger world state
        await ctx.vaccineList.addVaccine(currVaccine);
      
        // Must return a serialized vaccine to caller of smart contract
        return currVaccine;
    }

     /**
     * Query history of a vaccine
     * @param {Context} ctx the transaction context
     * @param {String} vaccineUUID unique id of a vaccine dose
    */
      async queryHistory(ctx, vaccineUUID) {
        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        // pass in primary key composed of vaccineUUID
        let results = await query.getAssetHistory(vaccineUUID);
        return results;
    }

    /**
    * queryPurchaser: supply purchaser of vaccine to find list of 
    * vaccines this purchaser purchased
    * @param {Context} ctx the transaction context
    * @param {String} purchaser vaccine purchaser
    */
    async queryPurchaser(ctx, owner) {

        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByPurchaser(owner);
        console.log("------ Result returned by query purchaser -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryIssueDateTime(ctx, issueDateTime) {
        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByIssueDateTime(issueDateTime);
        console.log("------ Result returned by query issue date time -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryBatchNumber(ctx, batchNumber) {
        let query = new RawMaterialQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByBatchNumber(batchNumber);
        console.log("------ Result returned by query batch number -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryManufacturer(ctx, manufacturer) {
        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByManufacturer(manufacturer);
        console.log("------ Result returned by query manufacturer -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryVaccineUUID(ctx, vaccineUUID) {
        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByVaccineUUID(vaccineUUID);
        console.log("------ Result returned by query vaccine uuid -----\n", results,
            "-------------------------------\n");

        return results;
    }

    async queryRecipient(ctx, recipient) {
        let query = new VaccineQueryUtils(ctx, 'org.vaccine.vaccine');
        let results = await query.queryByRecipient(recipient);
        console.log("------ Result returned by query recipient -----\n", results,
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
    * queryAdHoc vaccine - supply a custom query for couch db
    * eg - as supplied as a param:     
    * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
    * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
    * 
    * @param {Context} ctx the transaction context
    * @param {String} queryString querystring
    */
    async queryAdhoc(ctx, queryString) {

        let query = new QueryUtils(ctx, 'org.vaccine.vaccine');
        let querySelector = JSON.parse(queryString);
        let adhoc_results = await query.queryByAdhoc(querySelector);

        return adhoc_results;
    }

}

module.exports = VaccineContract;
