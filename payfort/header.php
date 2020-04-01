<?php
$lan_arr = array(
    0 => array(
        'First Name',
        'Credit Card Number',
        'Expiration Date',
        'Enter CVV',
        'Continue',
        '1 SAR will be deducted from your account for verification and it will be refunded back.',
        'Invalid credit card details',
        'Invalid credit card details',
        'Invalid credit card details',
        'Last Name',
    ),
    1 => array(
        'الإسم',
        'رقم البطاقة',
        'تاريخ الانتهاء ',
        'رمز التحقق ',
        'الاستمرار ',
        'سوف يتم خصم ريال واحد من حسابك للتحقق ومن ثم يتم اعادة المبلغ للحسابك ',
        'اسم حامل البطاقة غير صحيح',
        'رقم البطاقة الائتمانية غير صحيح',
        'رقم البطاقة التعريفي غير صحيح',
        'الكنية'
    )
);

$lan_id = 0;
if(isset($_REQUEST['lan'])) {
    if ($_REQUEST['lan'] == 'en')
        $lan_id = 0;
    else
        $lan_id = 1;
}


$lan_data = array(
    "lan_id" => 1,
    "lan_name" => "English",
    "lan_code" => $_REQUEST['lan'],
    "lan_dir" => 'ltr'
);
?>
<!doctype html>
<html lang="<?= $lan_data['lan_code'] ?>" dir="<?= $lan_data['lan_dir'] ?>">
    <head>
        <meta charset="UTF-8">
        <title>Selection Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="assets/css/bootstrap.min.css">
        <link rel="stylesheet" href="assets/css/normalize.css">
        <link href="https://fonts.googleapis.com/css?family=Muli" rel="stylesheet">
        <link rel="stylesheet" href="assets/css/fontello.css">
        <link rel="stylesheet" href="assets/css/style.css">
        <link id="bsdp-css" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/css/bootstrap-datepicker.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
    </head>
    <body>
        <!--        <header>
                    <div class="logo">
                        <img src="assets/img/logo.png" alt="">
                    </div>
                </header>-->
        <div class="wrapper">

<?php
$GetUserId = $_REQUEST['UserId'];
//            $GetUserId = $db->encrypt_decrypt('decrypt', $_REQUEST['UserId']);
//            echo $GetUserId;
//            $checkUserSessionQry = "select sid, token, expiry,device from user_sessions where oid = '" . $GetUserId . "' and user_type = '2' and loggedIn = '1'";
//            $checkUserSessionRes = mysql_query($checkUserSessionQry, $db->conn);
//            $num = mysql_num_rows($checkUserSessionRes);
//
//            if ($num == 0) {
//                exit;
//            }
?>
