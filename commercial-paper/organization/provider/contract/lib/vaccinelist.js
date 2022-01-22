'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const Vaccine = require('./vaccine.js');

class VaccineList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.vaccine.vaccine');
        this.use(Vaccine);
    }

    async addVaccine(vaccine) {
        return this.addState(vaccine);
    }

    async getVaccine(vaccine) {
        return this.getState(vaccine);
    }

    async updateVaccine(vaccine) {
        return this.updateState(vaccine);
    }
}


module.exports = VaccineList;