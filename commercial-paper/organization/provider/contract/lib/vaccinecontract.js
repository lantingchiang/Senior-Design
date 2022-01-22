'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const Vaccine = require('./vaccine.js');
const VaccineList = require('./vaccinelist.js');
//const QueryUtils = require('./queries.js');

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
        console.log('Instantiate the contract');
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

    // TODO: add queries

}

module.exports = VaccineContract;
