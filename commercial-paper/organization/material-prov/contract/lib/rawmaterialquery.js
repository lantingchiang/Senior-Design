/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const State = require('../ledger-api/state.js');
//const CommercialPaper = require('./paper.js');
/**
 * Query Class for query functions such as history etc
 *
 */
class RawMaterialQueryUtils {

    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        //this.supportedTypes = {};
    }

    // =========================================================================================
    // getAssetHistory takes the composite key as arg, gets returns results as JSON to 'main contract'
    // =========================================================================================
    /**
    * Get Asset History for a raw material
    * @param {String} batchNumber the raw material batch number
    * @param {String} manufacturer
    */
    async getAssetHistory(batchNumber, manufacturer) {

        let ledgerKey = await this.ctx.stub.createCompositeKey(this.name, [manufacturer, batchNumber]);
        // returns a Promise for a QueryHistoryIterator that allows iterating over a set of key/value pairs
        const resultsIterator = await this.ctx.stub.getHistoryForKey(ledgerKey);
        let results = await this.getAllResults(resultsIterator, true);

        return results;
    }

    // ===========================================================================================
    // queryKeyByPartial performs a partial query based on the namespace and prefix of the composite key,
    // which is the manufacturer's name
    // returns composite key based on partial key provided

    // Read-only function results are not typically submitted to ordering. If the read-only
    // results are submitted to ordering, or if the query is used in an update transaction
    // and submitted to ordering, then the committing peers will re-execute to guarantee that
    // result sets are stable between endorsement time and commit time. The transaction is
    // invalidated by the committing peers if the result set has changed between endorsement
    // time and commit time.
    // 
    // ===========================================================================================
    /**
    * 
    * @param {String} manufacturer
    */
    async queryKeyByPartial(manufacturer) {

        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting 1');
        }
        // partial composite key = namespace + prefix to raw materials (i.e. manufacturer name)
        // "Key": e.g. "org.vaccine.rawmaterialManufacturerA#31415962"
        // "Partial": e.g. "org.vaccine.rawmaterialManufacturerA"  (using partial key, find keys "#31415962")

        // Queries the state in the ledger based on a given partial composite key.
        // Returns an iterator which can be used to iterate over all composite keys
        // whose prefix matches the given partial composite key
        // [manufacturer] is array of strings that will be concatenated together to form partial key
        const resultsIterator = await this.ctx.stub.getStateByPartialCompositeKey(this.name, [manufacturer]);
        let method = this.getAllResults;
        let results = await method(resultsIterator, false);

        return results;
    }


    // ===== Example: Parameterized rich query =================================================
    // queryByPurchaser queries for assets based on a passed in purchaser.
    // This is an example of a parameterized query accepting a single query parameter (purchaser).
    // Only available on state databases that support rich query (e.g. CouchDB)
    // =========================================================================================
    /**
    * queryByName gets instance(s) with given raw material name
    * @param {String} name name of raw material
    */
    async queryByName(name) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting name of raw material.');
        }
        let queryString = {}; // query string format dependent on database used
        queryString.selector = {};
        queryString.selector.name = name;

        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    /**
    * queryByPurchaser gets instance(s) with given purchaser
    * @param {String} purchaser purchaser of raw material
    */
    async queryByPurchaser(purchaser) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting purchaser.');
        }
        let queryString = {}; // query string format dependent on database used
        queryString.selector = {};
        queryString.selector.purchaser = purchaser;  // final result:  '{selector:{purchaser:Pfizer}}'
       
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }
    
    /**
     * gets instance(s) with given dateMixedIn
     * @param {String} dateMixedIn 
     * @returns array of objects (in JS, aka dictionary or JSON)
     */
    async queryByDateMixedIn(dateMixedIn) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting dateMixedIn.');
        }

        let queryString = {}; // query string format dependent on database used
        queryString.selector = {};
        queryString.selector.dateMixedIn = dateMixedIn;

        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    /**
     * gets instance with given batch number
     * @param {String} batchNumber 
     */
    async queryByBatchNumber(batchNumber) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting batch number.');
        }

        let queryString = {}; // query string format dependent on database used
        queryString.selector = {};
        queryString.selector.batchNumber = batchNumber;

        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    /**
     * gets instance(s) with given manufacturer
     * @param {String} manufacturer 
     */
    async queryByManufacturer(manufacturer) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting manufacturer.');
        }

        let queryString = {}; // query string format dependent on database used
        queryString.selector = {};
        queryString.selector.manufacturer = manufacturer;

        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    // ===== Example: Ad hoc rich query ========================================================
    // queryAdhoc uses a query string to perform a query for marbles..
    // Query string matching state database syntax is passed in and executed as is.
    // Supports ad hoc queries that can be defined at runtime by the client.
    // If this is not desired, follow the queryKeyByOwner example for parameterized queries.
    // Only available on state databases that support rich query (e.g. CouchDB)
    // example passed using VS Code ext: ["{\"selector\": {\"owner\": \"MagnetoCorp\"}}"]
    // =========================================================================================
    /**
    * query By AdHoc string (commercial paper)
    * @param {String} queryString actual MangoDB query string (escaped)
    */
    async queryByAdhoc(queryString) {

        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting ad-hoc string, which gets stringified for mango query');
        }
        let self = this;

        if (!queryString) {
            throw new Error('queryString must not be empty');
        }
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    // WORKER functions are below this line: these are called by the above functions, where iterator is passed in

    // =========================================================================================
    // getQueryResultForQueryString worker function executes the passed-in query string.
    // Result set is built and returned as a byte array containing the JSON results.
    // =========================================================================================
    /**
     * Function getQueryResultForQueryString
     * @param {Context} ctx the transaction context
     * @param {any}  self within scope passed in
     * @param {String} the query string created prior to calling this fn
    */
    async getQueryResultForQueryString(ctx, self, queryString) {

        console.log('- getQueryResultForQueryString queryString:\n' + queryString);

        // The query string is in the native syntax of the underlying state database. 
        // An StateQueryIterator is returned which can be used to iterate over all keys in the query result set.
        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await self.getAllResults(resultsIterator, false);

        return results;

    }

    /**
     * Function getAllResults
     * @param {resultsIterator} iterator within scope passed in
     * @param {Boolean} isHistory query string created prior to calling this fn
     * @returns array of objects
    */
    async getAllResults(iterator, isHistory) {
        let allResults = [];
        let res = { done: false, value: null };

        console.log("Entered getAllResults\n");

        while (true) {
            res = await iterator.next();
            console.log("Iterator item is ", res, "\n");
            console.log("res.value is ", res.value, "\nres.value.value is ", res.value.value,"\n");
            console.log("res.value.value to string is ", res.value.value.toString());
            let jsonRes = {};
            // if res.value is not undefined or null
            if (res.value && res.value.value.toString()) {
                if (isHistory && isHistory === true) {
                    // add key-value pair for transaction id
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.Timestamp = new Date((res.value.timestamp.seconds.low * 1000));
                    let ms = res.value.timestamp.nanos / 1000000;
                    jsonRes.Timestamp.setMilliseconds(ms);
                    if (res.value.is_delete) {
                        jsonRes.IsDelete = res.value.is_delete.toString();
                    } else {
                        try {
                            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                        } catch (err) {
                            console.log(err);
                            jsonRes.Value = res.value.value.toString('utf8');
                        }
                    }
                } else { // non history query ..
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            // check to see if we have reached the end
            if (res.done) {
                // explicitly close the iterator 
                console.log('iterator is done');
                await iterator.close();
                return allResults;
            }

        }  // while true
    }

}
module.exports = RawMaterialQueryUtils;
