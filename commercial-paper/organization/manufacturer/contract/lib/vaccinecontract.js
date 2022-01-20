'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const VaccineBatch = require('./vaccinebatch.js');
const VaccineList = require('./vaccinelist.js');
//const QueryUtils = require('./queries.js');

/**
 * A custom context provides easy access to list of all vaccine batches
 */
class VaccineContext extends Context {

    constructor() {
        super();
        // All vaccine batches are held in a list
        this.vaccineBatchList = new VaccineList(this);
    }

}

/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class VaccineContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.vaccine.vaccineBatch');
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

    // TODO: add queries

}

module.exports = VaccineContract;
