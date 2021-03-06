/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 *  SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { Wallets } = require('fabric-network');
const path = require('path');

const fixtures = path.resolve(__dirname, '../../../../test-network');

async function main() {
    // get username from command line arguments
    if (process.argv.length < 3) {
        throw new Error('Not enough arguments! Expecting username');
    }
    const username = process.argv[2]

    // Main try/catch block
    try {

        // A wallet stores a collection of identities
        const wallet = await Wallets.newFileSystemWallet(`../identity/user/${username}/wallet`);

        // Identity to credentials to be stored in the wallet
        const credPath = path.join(fixtures, `/organizations/peerOrganizations/org3.example.com/users/${username}@org3.example.com`);
        const certificate = fs.readFileSync(path.join(credPath, `/msp/signcerts/${username}@org3.example.com-cert.pem`)).toString();
        const privateKey = fs.readFileSync(path.join(credPath, '/msp/keystore/priv_sk')).toString();

        // Load credentials into wallet
        const identityLabel = username;

        const identity = {
            credentials: {
                certificate,
                privateKey
            },
            mspId: 'Org3MSP',
            type: 'X.509'
        }

        await wallet.put(identityLabel, identity);

    } catch (error) {
        console.log(`Error adding to wallet. ${error}`);
        console.log(error.stack);
    }
}

main().then(() => {
    console.log('done');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});
