'use strict';

const logger = require('winston');
const moment = require('moment');
var Async = require('async');
const wallet = require('../../../../worker/wallet/wallet')

const ReferralBonusMaster = (params, callback) => {

    const creditInDriverWallet = (data) => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: params.userId.toString(),
                trigger: 'REFERRAL',
                comment: 'Refferal bonus on a trip',
                currency: params.currency || '',
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol || '',
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                tripId: params.bookingId,
                paymentTxtId: params.chargeId || "",
                serviceTypeText: params.serviceTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                bookingTypeText: params.bookingTypeText || "",
                cityName: params.cityName || "",
                userType: 2,
                initiatedBy: 'Driver Referral',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //credit into driver wallet

    const debitInAppWallet = (data) => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: params.userId.toString(),
                trigger: 'REFERRAL',
                comment: 'Refferal bonus on a trip',
                currency: params.currency || '',
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol || '',
                txnType: 2,
                amount: parseFloat(params.amount || 0),
                tripId: params.bookingId,
                paymentTxtId: params.chargeId || "",
                serviceTypeText: params.serviceTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                bookingTypeText: params.bookingTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Driver Referral',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //debit in app wallet

    creditInDriverWallet()
        .then(debitInAppWallet)
        .then(data => {
            callback(null, true);
        }).catch(e => {
            callback(e);
        });
}

const walletEntryForTip = (params, callback) => {

    const recivedFromCustomer = () => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: params.userId.toString(),
                trigger: 'TIP',
                comment: 'Tip payment by customer ' + params.amount,
                currency: params.currency || '',
                currencySymbol: params.currencySymbol || '',
                currencyAbbr: params.currencyAbbr || 1,
                txnType: 4,
                amount: parseFloat(params.amount || 0),
                paymentTxtId: params.chargeId,
                tripId: params.bookingId,
                serviceTypeText: params.serviceTypeText || '',
                paymentTypeText: params.paymentTypeText || "",
                bookingTypeText: params.bookingTypeText || "",
                cityName: params.cityName || "",
                userType: 1,
                initiatedBy: 'Customer',
                calculateClosingBalance: 0
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//debit from customers card & log into wallet transaction

    const creditInApp = () => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: 1,
                trigger: 'TIP',
                comment: 'Tip payment by customer',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                paymentTxtId: params.chargeId,
                tripId: params.bookingId,
                serviceTypeText: params.serviceTypeText || '',
                paymentTypeText: params.paymentTypeText || "",
                bookingTypeText: params.bookingTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };

            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //credit in app

    const debitPaymentGatwayCommission = () => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: 1,
                trigger: 'TIP',
                comment: 'Invoice payment - Tip PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 2,
                amount: parseFloat(params.pgComm || 0),
                paymentTxtId: params.chargeId,
                tripId: params.bookingId,
                serviceTypeText: params.serviceTypeText || '',
                bookingTypeText: params.bookingTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };

            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//debit from apps wallet(payment gateway fee)

    const creditInPGWallet = () => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: 1,
                trigger: 'TIP',
                comment: 'Tip payment - PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.pgComm || 0),
                paymentTxtId: params.chargeId,
                tripId: params.bookingId,
                serviceTypeText: params.serviceTypeText || '',
                bookingTypeText: params.bookingTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 5,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };

            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //credit into pg wallet

    const creditInProvider = () => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                userId: params.providerId.toString(),
                trigger: 'TIP',
                comment: 'Tip payment - Credit To Driver',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.providerEarning || 0),
                paymentTxtId: params.chargeId,
                tripId: params.bookingId,
                serviceTypeText: params.serviceTypeText || '',
                bookingTypeText: params.bookingTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 2,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //debit from masters wallet

    recivedFromCustomer()
        .then(creditInApp)
        .then(debitPaymentGatwayCommission)
        .then(creditInPGWallet)
        .then(creditInProvider)
        .then(data => {
            callback(null, true);
        }).catch(e => {
            callback(e);
        });
}

const rechargeWalletForCustomer = (params, callback) => {

    const creditToCustomerWallet = () => {
        return new Promise((resolve, reject) => {
            // let data = {
            //     userId: params.userId.toString(),
            //     trigger: 'WALLET RECHARGE',
            //     comment: 'Wallet recharge from customer app',
            //     currency: params.currency,
            //     currencyAbbr: params.currencyAbbr || 1,
            //     currencySymbol: params.currencySymbol,
            //     txnType: 1,
            //     amount: parseFloat(params.amount || 0),
            //     tripId: 'N/A',
            //     paymentTxtId: params.chargeId,
            //     cityId: (params.cityId) ? params.cityId.toString() : '',
            //     serviceTypeText: "",
            //     bookingTypeText: "",
            //     paymentTypeText: params.paymentTypeText || "",
            //     cityName: params.cityName || "",
            //     userType: 1,
            //     initiatedBy: 'Customer',
            //     calculateClosingBalance: 1
            // };
            // wallet.walletTransction(data, (err, res) => {
            //     return err ? reject(err) : resolve(params);
            // });
            let dataArr = {
                userId: params.userId.toString(),
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge from customer app',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1, //transction type(1-Credit, 2-Debit) 
                amount: parseFloat(params.amount || 0),
                // blocked: 0,
                // wallet: true,
                orderId: "N/A",
                paymentTxtId: params.chargeId,
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                cityId: (params.cityId) ? params.cityId.toString() : '',
                userType: 1,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credis to customers wallet & log into wallet transaction

    const creditToAppWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credit in app wallet

    const debitFromAppWalletPGCommision = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge - PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 2,
                amount: parseFloat(params.pgComm || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//debit from apps wallet(payment gateway fee)

    const creditToPGWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge - PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.pgComm || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 5,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credit to pg wallet

    creditToCustomerWallet()
        .then(creditToAppWallet)
        .then(debitFromAppWalletPGCommision)
        .then(creditToPGWallet)
        .then(data => {
            callback(null, true);
        }).catch(e => {
            callback(e);
        });
}

const rechargeWalletForDriver = (params, callback) => {

    const creditToDriverWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: params.userId.toString(),
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge from Driver app',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 2,
                initiatedBy: 'Driver',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credis to customers wallet & log into wallet transaction

    const creditToAppWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Driver',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credit in app wallet

    const debitFromAppWalletPGCommision = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge - PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 2,
                amount: parseFloat(params.pgComm || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 4,
                initiatedBy: 'Driver',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//debit from apps wallet(payment gateway fee)

    const creditToPGWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: 1,
                trigger: 'WALLET RECHARGE',
                comment: 'Wallet recharge - PG commission',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.pgComm || 0),
                tripId: 'N/A',
                paymentTxtId: params.chargeId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                serviceTypeText: "",
                bookingTypeText: "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: 5,
                initiatedBy: 'Driver',
                calculateClosingBalance: 1
            }
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }//credit to pg wallet

    creditToDriverWallet()
        .then(creditToAppWallet)
        .then(debitFromAppWalletPGCommision)
        .then(creditToPGWallet)
        .then(data => {
            callback(null, true);
        }).catch(e => {
            callback(e);
        });
}

const checkHardLimithitWithThisAmount = (params, callback) => {

    const checkHardLimithit = () => {
        return new Promise((resolve, reject) => {
            let inputData = {
                userId: params.userId,
                userType: params.userType,
                amount: params.amount
            }
            wallet.checkIfAnyLimitHitWithAmount(inputData, (err, res) => {
                if (err)
                    reject(err)
                else if (res && res.data && res.data.newHardLimitHit && res.data.newHardLimitHit == true) {
                    reject({ code: 406, data: "your wallet doesn't have sufficient balance for this booking" });
                } else {
                    resolve(true);
                }
            });
        });
    }

    checkHardLimithit()
        .then(data => {
            return callback(null, true);
        }).catch(e => {
            return callback(e);
        });
}

const captureAmountFromWallet = (params, callback) => {

    const debitToWallet = () => {
        return new Promise((resolve, reject) => {
            if (parseFloat(params.amount) > 0) {
                let data = {
                    userId: params.userId.toString(),
                    trigger: 'TRIP CAPTURE BALANCE',
                    comment: 'trip capture wallet balance',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 2,
                    amount: parseFloat(params.amount || 0),
                    tripId: params.bookingId,
                    paymentTxtId: 'N/A',
                    userType: params.userType,
                    initiatedBy: 'Customer',
                    serviceTypeText: params.serviceTypeText || '',
                    bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(data, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            } else {
                resolve(true);
            }
        });
    }

    debitToWallet()
        .then(data => {
            return callback(null, true);
        }).catch(e => {
            return callback(e);
        });
}

const refundAmountToWallet = (params, callback) => {

    const creditToWallet = () => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: params.userId.toString(),
                trigger: 'TRIP REFUND BALANCE',
                comment: 'trip refund wallet balance',
                currency: params.currency,
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol,
                txnType: 1,
                amount: parseFloat(params.amount || 0),
                tripId: params.bookingId,
                cityId: (params.cityId) ? params.cityId.toString() : '',
                paymentTxtId: 'N/A',
                serviceTypeText: params.serviceTypeText || "",
                bookingTypeText: params.bookingTypeText || "",
                paymentTypeText: params.paymentTypeText || "",
                cityName: params.cityName || "",
                userType: params.userType,
                initiatedBy: 'Customer',
                calculateClosingBalance: 1
            };
            wallet.walletTransction(data, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    }

    creditToWallet()
        .then(data => {
            return callback(null, true);
        }).catch(e => {
            return callback(e);
        });
}

const walletEntryForBooking = (params, callback) => {

    // entry for earning in respective Wallet
    const makeEarningEntry = () => {
        //payment entry in customer wallet
        const paymentEntryInCustomer = () => {
            return new Promise((resolve, reject) => {
                let amount = (parseFloat(params.cashCollected) || 0) + (parseFloat(params.cardDeduct) || 0);
                if (amount > 0) {
                    let dataArr = {
                        userId: params.userId.toString(),
                        trigger: 'TRIP',
                        comment: 'Earning Entry For Booking',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 4, //transction type(1-Credit, 2-Debit) 
                        amount: parseFloat(amount || 0),
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 1,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 0
                    };
                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };

        //credit master earning to master wallet
        const creditInProvider = () => {
            return new Promise((resolve, reject) => {
                if (params.providerEarning && params.providerEarning != 0) {
                    let dataArr = {
                        userId: params.providerId,
                        trigger: 'TRIP',
                        comment: 'Invoice payment by customer',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 1, //transction type(1-Credit, 2-Debit)
                        amount: parseFloat(params.providerEarning || 0),
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 2,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };
                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };

        //payment entry of app earning in app wallet
        const paymentEntryInApp = () => {
            return new Promise((resolve, reject) => {
                if (params.appEarning && params.appEarning != 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'TRIP',
                        comment: 'Earning Entry For Booking',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 5,
                        amount: parseFloat(params.appEarning || 0),
                        paymentTxtId: params.chargeId,
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 4,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 0
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };

        return new Promise((resolve, reject) => {
            paymentEntryInCustomer()
                .then(creditInProvider)
                .then(paymentEntryInApp)
                .then(() => {
                    return resolve(true);
                }).catch((err) => {
                    logger.error('error while making entry of earning =>', err);
                    return reject(err);
                });
        });
    }

    //entry for cash transactions
    const checkCashTransaction = () => {
        // debit amount from master wallet
        const debitInProvider = (data) => {
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: params.providerId,
                    trigger: 'TRIP',
                    comment: 'Invoice payment by customer',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 2, //transction type(1-Credit, 2-Debit)
                    amount: parseFloat(params.cashCollected || 0),
                    tripId: params.bookingId,
                    serviceTypeText: params.serviceTypeText || '',
                    bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 2,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }
        return new Promise((resolve, reject) => {
            if (params.cashCollected && params.cashCollected > 0) {
                debitInProvider()
                    .then(() => {
                        return resolve(true);
                    }).catch((err) => {
                        logger.error('error while making entry of cash transaction =>', err);
                        return reject(err);
                    });
            } else {
                return resolve(true);
            }
        });
    }

    //entry for card transactions
    const checkCardTransaction = () => {
        // Credit Card Deduct amount in App
        const creditInApp = (data) => {
            return new Promise((resolve, reject) => {
                if (params.cardDeduct && params.cardDeduct > 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'TRIP',
                        comment: 'Invoice payment by customer',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 1,
                        amount: parseFloat(params.cardDeduct || 0),
                        paymentTxtId: params.chargeId,
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 4,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        //Debit PG commission from respective Wallet
        const debitPaymentGatwayCommission = (data) => {
            return new Promise((resolve, reject) => {
                if (params.pgComm && params.pgComm != 0) {
                    var userType = (params.pgCommPayBy && params.pgCommPayBy == 1) ? 2 : 4;
                    let dataArr = {
                        userId: 1,
                        trigger: 'TRIP',
                        comment: 'Invoice payment - PG commission',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 2,
                        amount: parseFloat(params.pgComm || 0),
                        paymentTxtId: params.chargeId,
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: userType,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        // credit PG commission in PG wallet
        const creditInPGWallet = (data) => {
            return new Promise((resolve, reject) => {
                if (params.pgComm && params.pgComm != 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'TRIP',
                        comment: 'Invoice payment - PG commission',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 1,
                        amount: parseFloat(params.pgComm || 0),
                        paymentTxtId: params.chargeId,
                        tripId: params.bookingId,
                        serviceTypeText: params.serviceTypeText || '',
                        bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 5,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        return new Promise((resolve, reject) => {
            creditInApp()
                .then(debitPaymentGatwayCommission)
                .then(creditInPGWallet)
                .then(() => {
                    return resolve(true);
                }).catch((err) => {
                    logger.error('error while making entry of cash transaction =>', err);
                    return reject(err);
                });
        });
    }

    //entry for wallet transactions
    const checkWalletTransaction = () => {
        // Credit Wallet Transaction amount in App
        const creditInApp = (data) => {
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: 1,
                    trigger: 'TRIP',
                    comment: 'Invoice payment by customer',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 1,
                    amount: parseFloat(params.WalletTransaction || 0),
                    paymentTxtId: params.chargeId,
                    tripId: params.bookingId,
                    serviceTypeText: params.serviceTypeText || '',
                    bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 4,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };

                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }
        return new Promise((resolve, reject) => {
            if (params.WalletTransaction && params.WalletTransaction > 0) {
                creditInApp()
                    .then(() => {
                        return resolve(true);
                    }).catch((err) => {
                        logger.error('error while making entry of cash transaction =>', err);
                        return reject(err);
                    });
            } else {
                return resolve(true);
            }
        });
    }

    //entry for last due
    const checkLastDue = () => {
        // Credit last due amount in customer wallet
        const creditInCustomer = (data) => {
            return new Promise((resolve, reject) => {
                let data = {
                    userId: params.userId.toString(),
                    trigger: 'TRIP',
                    comment: 'Invoice payment - Last Due ' + params.lastDue,
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 1,
                    amount: parseFloat(params.lastDue || 0),
                    tripId: params.bookingId,
                    serviceTypeText: params.serviceTypeText || '',
                    bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 1,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(data, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }
        return new Promise((resolve, reject) => {
            if (params.lastDue && params.lastDue > 0) {
                creditInCustomer()
                    .then(() => {
                        return resolve(true);
                    }).catch((err) => {
                        logger.error('error while making entry of cash transaction =>', err);
                        return reject(err);
                    });
            } else {
                return resolve(true);
            }
        });
    }

    checkCashTransaction()
        .then(checkCardTransaction)
        .then(checkWalletTransaction)
        .then(makeEarningEntry)
        .then(checkLastDue)
        .then(() => {
            return callback(null, true);
        }).catch((err) => {
            return callback(err, true);
        })
}


const campaginDiscount = (params, callback) => {
    const creditInCustomer = (data) => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                tripId: params.bookingId || 'N/A',
                userId: params.userId.toString(),
                userType: params.userType,
                txnType: 1,
                trigger: 'bonus',
                comment: 'Campaign reward credit',
                initiatedBy: 'N/A',
                amount: parseFloat(params.amount || 0),
                currency: params.currency || 'usd',
                currencySymbol: params.currencySymbol || '$',
                paymentType: 3,
                paymentTypeText: "WALLET",
                paymentTxtId: 'N/A',
                bookingType: 'N/A',
                bookingTypeText: 'N/A',
                cityId: params.cityId || "",
                cityName: params.cityName || "",
                pgName: "N/A",
                calculateClosingBalance: 1,
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //debit from customer wallet
    const debitInApp = (data) => {
        return new Promise((resolve, reject) => {
            let dataArr = {
                tripId: params.bookingId || 'N/A',
                userId: 1,
                userType: 4,
                txnType: 2,

                trigger: 'bonus',
                comment: 'Campaign reward credit',
                initiatedBy: 'N/A',

                amount: parseFloat(params.amount || 0),

                currency: params.currency || 'usd',
                currencySymbol: params.currencySymbol || '$',
                paymentType: 3,
                paymentTypeText: "WALLET",
                paymentTxtId: 'N/A',
                bookingType: 'N/A',
                bookingTypeText: 'N/A',
                cityId: params.cityId || "",
                cityName: params.cityName || "",
                pgName: "N/A",
                calculateClosingBalance: 1,
            };
            wallet.walletTransction(dataArr, (err, res) => {
                return err ? reject(err) : resolve(params);
            });
        });
    } //debit from customer wallet
    creditInCustomer()
        .then(debitInApp)
        .then(data => {
            callback(null, true)
        }).catch(e => {
            callback(e)
        });
}

module.exports = {
    ReferralBonusMaster,
    walletEntryForTip,
    rechargeWalletForCustomer,
    rechargeWalletForDriver,
    checkHardLimithitWithThisAmount,
    captureAmountFromWallet,
    refundAmountToWallet,
    walletEntryForBooking,
    campaginDiscount
};