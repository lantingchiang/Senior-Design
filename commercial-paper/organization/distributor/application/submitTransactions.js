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
const Shipment = require('../contract/lib/shipment.js');
const readline = require('readline');


async function shipmentOrderRequest(contract, shipmentUUID, shipmentProvider, source, destination) {
    return contract.submitTransaction('orderShipment', shipmentUUID, shipmentProvider, source, destination);
}

async function shipRequest(contract, shipmentUUID, vehicleUUID, source, timestamp, vehicleOperator, currentTemp) {
    return contract.submitTransaction('shipShipment', shipmentUUID, vehicleUUID, source, timestamp, vehicleOperator, currentTemp);
}

async function updateLocTempRequest(contract, shipmentUUID, timestamp, currentLocation, currentTemp) {
    return contract.submitTransaction('updateLocationTemp', shipmentUUID, timestamp, currentLocation, currentTemp);
}

async function arrivalRequest(contract, shipmentUUID, timestamp) {
    return contract.submitTransaction('shipmentArrival', shipmentUUID, timestamp);
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
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org3.yaml', 'utf8'));

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
        console.log('Use org.vaccine.shipment smart contract.');

        const contract = await network.getContract('shipmentcontract', 'org.vaccine.shipment');

        // read transaction details from command line
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        var response, transaction;
        rl.question('Enter the transaction (orderShipment, shipShipment, updateLocationTemp, shipmentArrival) that you wish to submit: ',
            function (transactionName) {
                transaction = transactionName;
                rl.question('Enter shipment uuid: ', function (shipmentUUID) {
                    if (transactionName == 'orderShipment') {
                        rl.question('Enter provider name: ', function (shipmentProvider) {
                            rl.question('Enter shipment source: ', function (source) {
                                rl.question('Enter shipment destination: ', function (destination) {
                                    response = shipmentOrderRequest(contract, shipmentUUID, shipmentProvider, source, destination); 
                                });
                            });
                        });
                    }

                    else if (transactionName == 'shipShipment') {
                        rl.question('Enter vehicle uuid: ', function (vehicleUUID) {
                            rl.question('Enter vehicle operator name: ', function (vehicleOperator) {
                                rl.question('Enter shipment source: ', function (source) {
                                    rl.question('Enter current temperature: ', function (currentTemp) {
                                        response = shipRequest(contract, shipmentUUID, vehicleUUID, source, new Date().toLocaleString(), vehicleOperator, destination, currentTemp); 
                                    });
                                    //TODO: how can we automatically update temp? Just manually inputting for now
                                });
                            });
                        });
                    }
                            
                    else if (transactionName == 'updateLocationTemp') {
                        rl.question('Enter current location: ', function (currentLocation) {
                            rl.question('Enter current temperature: ', function (currentTemp) {
                                response = updateLocTempRequest(contract, shipmentUUID, new Date().toLocaleString(), currentLocation, currentTemp);
                            });
                        });
                    }

                    else if (transactionName == 'shipmentArrival') {
                        response = arrivalRequest(contract, shipmentUUID, new Date().toLocaleString());
                    }
                    else {
                        console.log("Unsupported transaction name");
                    }
                    rl.close();
                });
            });      

        rl.on('close', function () {
            console.log('Submitting vaccine shipment transaction.');
        });


        // process response
        console.log('Processing shipment transaction response.');

        let shipment = Shipment.fromBuffer(response);

        console.log(`Shipment ${transaction} transaction for shipment with uuid ${shipment.shipmentUUID} successfully complete`);

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

    console.log('Shipment transaction program complete.');

}).catch((e) => {

    console.log('Shipment transaction program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});
