'use strict'

const tablename = 'stripePlan';

const db = require('../../library/mongodb')
const logger = require('winston');

const ObjectID = require('mongodb').ObjectID;

/**
 * get all plans for stripe
 * @param {*} mode test/live
 */
const getPlans = (mode) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .find({ 'mode': mode }).toArray((err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
};

/**
 * get plan by id for stripe
 * @param {*} planId plan id
 * @param {*} mode test/live
 */
const getPlan = (planId, mode) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .findOne({ 'id': planId, 'mode': mode }, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

/**
 * create plan for stripe
 * @param {*} insObj 
 */
const createPlan = (insObj) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .insert(insObj, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

/**
 * update plan data
 * @param {*} planId plan id
 * @param {*} mode test/live
 * @param {*} data 
 */
const updatePlan = (planId, mode, data) => {
    return new Promise((resolve, reject) => {
        let condition = { 'id': planId, 'mode': mode };
        db.get().collection(tablename)
            .update(condition, data, (err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
};

/**
 * delete plan data
 * @param {*} planId plan id
 * @param {*} mode test/live
 */
const deletePlan = (planId, mode) => {
    return new Promise((resolve, reject) => {
        let condition = { 'id': planId, 'mode': mode };
        db.get().collection(tablename)
            .remove(condition, (err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
};


module.exports = {
    getPlans,
    getPlan,
    createPlan,
    updatePlan,
    deletePlan
};
