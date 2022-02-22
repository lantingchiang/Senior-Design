/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to buy (buy_request) commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

import { v4 as uuidv4 } from 'uuid';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const Batch = require('../contract/lib/vaccinebatch.js');
const readline = require('readline');

async function issueRequest(contract, vaccineName, batchNumber, quantity, manufacturer, manufactureDate) {
    return contract.submitTransaction('issue', vaccineName, batchNumber, quantity, manufacturer, manufactureDate);
}

// Main program function
async function main () {
    // get username from command line arguments
    if (process.argv.length < 3) {
        throw new Error('Not enough arguments! Expecting username');
    }

    const username = process.argv[2]
    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet(`../identity/user/${username}/wallet`);


    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org2.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: username,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }

        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);

        // Access vaccine network
        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        // Get addressability to raw material contract
        console.log('Use org.vaccine.vaccineBatch smart contract.');

        const contract = await network.getContract('batchcontract', 'org.vaccine.vaccineBatch');

        // read transaction details from command line
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        var response, transaction;
        rl.question('Enter the transaction (issue) that you wish to submit: ',
            function (transactionName) {
                transaction = transactionName;
                rl.question('Enter batch number: ', function (batchNumber) {
                    rl.question('Enter manufacturer: ', function (manufacturer) {

                        if (transactionName == 'issue') {
                            rl.question('Enter vaccine name: ', function (vaccineName) {
                                rl.question('Enter quantity: ', function (quantity) {
                                    rl.question('Enter manufactureDate: ', function (manufactureDate) {
                                        response = issueRequest(contract, vaccineName, batchNumber, quantity, manufacturer, manufactureDate);
                                    });

                                });
                            });
                        }
                        else {
                            console.log("Unsupported transaction name");
                        }
                        rl.close();
                    });
                });
            });  


        rl.on('close', function () {
            console.log('Submitting vaccine batch transaction.');
        });


        // process response
        console.log('Processing vaccine batch transaction response.');

        let vaccineBatch = Batch.fromBuffer(response);

        console.log(`Vaccine ${transaction} transaction for vaccine with batch number ${vaccineBatch.batchNumber} 
            manufacturered by ${vaccineBatch.manufacturer} for ${vaccineBatch.quantity} quantity successfully complete`);

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
main().then(() => {

    console.log('Vaccine batch transaction program complete.');

}).catch((e) => {

    console.log('Vaccine batch transaction program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});