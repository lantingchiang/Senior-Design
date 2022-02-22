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
 * 4. Construct request to query the ledger
 * 5. Evaluate transactions (queries)
 * 6. Process responses
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const readline = require('readline');


// Main program function
async function main() {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet('../identity/user/balaji/wallet');


    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // get username from command line arguments
    if (process.argv.length < 3) {
        throw new Error('Not enough arguments! Expecting username');
    }
    const username = process.argv[2]


    // Main try/catch block
    try {

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org3.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }

        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);

        // Access Vaccine network
        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        // Get addressability to commercial paper contract
        console.log('Use org.vaccine.shipment smart contract.');

        const contract = await network.getContract('shipmentcontract', 'org.vaccine.shipment');

        // queries - commercial paper
        console.log('-----------------------------------------------------------------------------------------');
        console.log('Ready to take queries for shipment \n\n ');

        // read transaction details from command line
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        while (true) {
            var queryResponse = "";
            rl.question("What do you wish to query based on?\n1: shipment uuid\n2:name of shipping provider\n3:source\n4:destination\n5:ship date\n6:arrival date\n7:custom", function (ans) {
                switch (ans) {
                    case '1':
                        rl.question("Enter shipment uuid", function (shipmentUUID) {
                            queryResponse = await contract.evaluateTransaction('queryShipmentUUID', shipmentUUID);
                            console.log("Processing result of querying history of shipment based on shipment uuid");
                        });
                        break;
                    case '2':
                        rl.question("Enter shipping provider name", function (shippingProvider) {
                            queryResponse = await contract.evaluateTransaction('queryShipmentProvider', shippingProvider);
                            console.log("Processing result of querying history of shipment based on shipping provider");
                        });
                        break;
                    case '3':
                        rl.question("Enter shipment source", function (source) {
                            queryResponse = await contract.evaluateTransaction('queryShipmentSource', source);
                            console.log("Processing result of querying shipment based on source");
                        });
                        break;
                    case '4':
                        rl.question("Enter shipment destination", function (destination) {
                            queryResponse = await contract.evaluateTransaction('queryShipmentDestination', destination);
                            console.log("Processing result of querying shipment based on destination");
                        });
                        break;
                    case '5':
                        rl.question("Enter ship date", function (shipDateTime) {
                            queryResponse = await contract.evaluateTransaction('queryShipDateTime', shipDateTime);
                            console.log("Processing result of querying shipment based on ship date");
                        });
                        break;
                    case '6':
                        rl.question("Enter shipment arrival date", function (arrivalDateTime) {
                            queryResponse = await contract.evaluateTransaction('queryArrivalDateTime', arrivalDateTime);
                            console.log("Processing result of querying shipment based on shipment arrival date");
                        });
                        break;
                    case '7':
                        rl.question("Enter custom couch db style query", function (query) {
                            queryResponse = await contract.evaluateTransaction('queryAdhoc', query);
                        });
                        break;
                    default:
                        console.log("Invalid option");
                }
            });

            if (queryResponse.length > 0) {
                console.log("Query results:");
                let json = JSON.parse(queryResponse.toString());
                console.log(json);
                console.log('------------------------------------------------------------');
            }
            
            rl.close();
        }

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

    console.log('Queryapp program complete.');

}).catch((e) => {

    console.log('Queryapp program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});
