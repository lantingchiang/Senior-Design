/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const RawMaterial = require('./rawmaterial.js');

class RawMaterialList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.vaccine.rawmaterial');
        this.use(RawMaterial);
    }

    async addRawMaterial(material) {
        return this.addState(material);
    }

    async getRawMaterial(materialKey) {
        return this.getState(materialKey);
    }

    async updateRawMaterial(material) {
        return this.updateState(material);
    }
}


module.exports = RawMaterialList;
