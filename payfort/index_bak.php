<?php
require "vendor/autoload.php";
use IZaL\Tap;
use IZaL\Tap\TapBilling;
//use 
$config =
    [
        'ApiKey' => '1tap7',
        'UserName' => 'test',
        'Password' => '123tap',
        'MerchantID' => '1014',
        'ErrorURL' => 'http://payfort.mandobe.com/returnurl.php', // optional. default(NULL)
        'PaymentOption' => 'KNET', // optional. default (ALL)
        'AutoReturn' => 'Y', // optional. default (Y)
        'CurrencyCode' => 'KWD', // optional. default (KWD)
        'LangCode' => 'EN' // optional. default(AR)
    ];


/**
*
* set the products that has to be purchased by the customer
*
* required fields (
*     Quantity, 
*     TotalPrice,
*     UnitName,
*     UnitDesc,
*     UnitPrice
* )
* 
* optional fields (
*    ImgUrl,
*    VndID
* )
* 
* note that you dont need to pass currency code in products list, as you are already passing it in the config.
* 
*/

$products =
    [
        [
            'Quantity' => '1',
            'TotalPrice' => '500',
            'UnitName' => 'Product Name',
            'UnitDesc' => 'Product Description',
            'UnitPrice' => '500',
        ],
        [
            'Quantity' => '2',
            'TotalPrice' => '300',
            'UnitName' => 'Product Name',
            'UnitDesc' => 'Product Description',
            'UnitPrice' => '150',
        ]
    ];

$customer =
    [
        'Email' => 'customer@email.com',
        'Name' => 'Awesome Customer',
        'Mobile' => '9999999',
    ];

// by default the package sets gateway to 'ALL', however, you can pass the below method if you need to set the gateway to other available options (KNET,VISA,MASTER,AMEX) 

// optional
//$gateway = ['Name' => 'KNET'];

//test payment url, comment below line for production
$PaymentURL = "http://tapapi.gotapnow.com/TapWebConnect/Tap/WebPay/PaymentRequest";
$merchant =
    [
        'ReturnURL' => 'http://payfort.mandobe.com/returnurl.php',
        'ReferenceID' => uniqid(),
    ];
$billing = new TapBilling($config);

$billing->setProducts($products);
$billing->setCustomer($customer);
//$billing->setGateway($gateway);
$billing->setMerchant($merchant);
$billing->setPaymentURL($PaymentURL);

// request for payment url
$paymentRequest = $billing->requestPayment();

// get the response
$response = $paymentRequest->response->getRawResponse();
var_dump($response);
?>