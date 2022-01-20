'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const CommercialPaper = require('./vaccinebatch.js');

class VaccineList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.vaccine.vaccineBatch');
        this.use(CommercialPaper);
    }

    async addVaccineBatch(vaccineBatch) {
        return this.addState(vaccineBatch);
    }

    async getVaccineBatch(vaccineBatchKey) {
        return this.getState(vaccineBatchKey);
    }

    async updateVaccineBatch(vaccineBatch) {
        return this.updateState(vaccineBatch);
    }
}


module.exports = VaccineBatchList;