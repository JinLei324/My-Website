
// const products = require('./products');
const post = require('./post');
const get = require('./get');
const patch = require('./patch');

const dispatchLogs = require('./dispatchLogs');
const pos = require('./pos');
const products = require('./products');
const childProducts = require('./childProducts');
const WorkingHour = require('./WorkingHour');
const stores = require('./stores');
const franchise = require('./franchise');
const StorePassword = require('./StorePassword');
const signIn = require('./signIn');

const posProduct = require('./posProduct');
const vouchers = require('./vouchers');
const addOns = require('./addOns');
const SFAuth = require('./salesforce');
const updateToProduct = require('./updateToProduct');
const updateToStore = require('./updateToStore');
const password = require('./password');
const storesignIn = require('./storesignIn');
const pushCategoriesIntoStore = require('./pushCategoriesIntoStore');
const  updateToStoreProduct = require('./updateToStoreProduct');
const brand = require('./brand');
const manufacturer = require('./manufature')

module.exports = [].concat(
    post, get, patch, brand, manufacturer, WorkingHour, updateToProduct, password, franchise, updateToStore, StorePassword, storesignIn,
    dispatchLogs, pos, products, childProducts, stores, posProduct, vouchers, addOns, SFAuth, signIn, pushCategoriesIntoStore, updateToStoreProduct
);