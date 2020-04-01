<?php 

error_reporting(E_ALL);
ini_set('display_errors', 1);
include('header.php');


?>

<style>
    .waller_details {
        text-align: center;
        color: #189d5b;
        margin-top:3%
    }
    .h-seperator {
        width: 100%;
        border-bottom: 2px dashed #C9D0E1;
        margin: 2em auto 2em auto;
        display: block;
        padding: 0em;
        opacity: .3;
        display: none!important;
    }
    body {
        background-color: #fff;
        color: #444;
        margin: 0;
        padding: 0;
        /* text-transform: capitalize; */
        font-size: .9em;
        line-height: 1.4em;
        font-family: Muli;
        font-weight: bold;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        margin: 0 0 0px!important;
    }
    .actions input {
        width: 100%!important;
        padding: 1em;
        display: block;
        background: #d8d8d8;
        text-align: center;
        text-decoration: none;
        font-size: 1.1em;
        border-radius: 4px;
        color: #fff;
        font-weight: 700;
    }
    .actions {
        width: 100%;
        height: auto;
        padding: 0!important;
        overflow: hidden;
        margin: 0!important;
    }
    .wrapper {
        width: 95%!important;
        max-width: 1024px;
        margin: auto;
    }
    section.nav {
        display: none;
    }
    header {
        display: none!important;
    }
    footer {
        display: none!important;
    }
    .form-horizontal .control-label {
        text-align: <?= ($lan_data['lan_dir'] == 'ltr')?"left":"right"?> !important; 
    }
    .form-control {
        text-align: <?= ($lan_data['lan_dir'] == 'ltr')?"right":"left"?>;
        border: none !important;
        box-shadow: none !important;
        background-color: #fff !important;
    }
    .form-group {
        padding-left:5px;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display:         flex;
        flex-wrap: wrap;
        border-bottom: 1px solid #e4e7f0;
    }
    .form-group > [class*='col-'] {
        display: flex;
        flex-direction: column;
    }
    .control-label{
        color:#a1a6bb;
        padding-top: 7px;
    }
    .form-control{
        color:#222328;
    }
    .datepicker th{
        background: white;
        color:black;
        font-weight: bold;
    }
/*    .has-error .form-control{
        border-bottom: 1px solid #a94442 !important;
    }*/
</style>

<?php
require __DIR__ . '/vendor/autoload.php'; //Composer installed
require_once 'PayfortIntegration.php';
require_once 'dbConfig.php';
$objFort = new PaytapIntegration();
session_start();
$_SESSION['lan'] = $_REQUEST['lan'];


if (isset($_REQUEST['UserId']) AND ! empty($_REQUEST['UserId'])) {

    if(isset($_REQUEST['UserType']) AND ! empty($_REQUEST['UserType']))
    {
        $db = database;
        $client = new MongoDB\Client("mongodb://" . username . ":" . password . "@" . hostname . ":5009/" . $db);
        
        $condition = array('_id' => new MongoDB\BSON\ObjectID($_REQUEST['UserId']));
        if($_REQUEST['UserType'] == 1){
             $dataFromQuery = $client->$db->driver->findOne($condition);
        }else if($_REQUEST['UserType'] == 2){
            $dataFromQuery = $client->$db->customer->findOne($condition); 
           
        }else{
            echo 'Please enter valid userType';
            exit;
        }    
        if (empty($dataFromQuery)) {
            echo 'Please send valid UserId';
            exit;
        }
    }else{

        echo 'Please enter user type';
        exit;
    }

} else {
    echo 'Please send UserId';
    exit;
}

?>
<section class="nav">
    <ul>
        <li class="active lead"> Payment Method</li>
        <li class="lead"> Done</li>
    </ul>
</section>
<div class="h-seperator"></div>

<section class="payment-method">
    <ul>
        <li>
        
            <div class="details" style="padding-top:10px;">
                <form id="frm_payfort_payment_merchant_page2" id = "myForm" class="form-horizontal" action="add_card.php" method="post"
                onsubmit="return validateForm()">
                    <div class="form-group">
                        <label class="col-xs-5 control-label" for="payfort_fort_mp2_card_holder_name"><?= $lan_arr[$lan_id][0]?></label>
                        <div class="col-xs-6">
                            <input type="text" class="form-control required" name="firstName" id="payfort_fort_mp2_card_holder_name" placeholder="<?= $lan_arr[$lan_id][0]?>" maxlength="50" onkeypress="return onlyAlpha(event, this)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-xs-5 control-label" for="payfort_fort_mp2_card_holder_name1"><?= $lan_arr[$lan_id][9]?></label>
                        <div class="col-xs-6">
                            <input type="text" class="form-control required" name="lastName" id="payfort_fort_mp2_card_holder_name1" placeholder="<?= $lan_arr[$lan_id][9]?>" maxlength="50" onkeypress="return onlyAlpha(event, this)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-xs-5 control-label" for="payfort_fort_mp2_card_number"><?= $lan_arr[$lan_id][1]?></label>
                        <div class="col-xs-6">
                            <input type="tel" class="form-control required" name="cardNo" id="payfort_fort_mp2_card_number" placeholder="<?= $lan_arr[$lan_id][1]?>" maxlength="16" onkeypress="return onlyDigit(event, this)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-xs-5 control-label" for="payfort_fort_mp2_expiry_month"><?= $lan_arr[$lan_id][2]?></label>
                        <div class="col-xs-6">
                            <input type="text" name="cardExpiry" readonly class="datepicker form-control required" placeholder="MM/YY" id="payfort_fort_mp2_expiry">
<!--                            <div class="row">
                                <div class="col-xs-6">
                                    <select class="form-control col-xs-2" name="expiry_month" id="payfort_fort_mp2_expiry_month">
                                        <option value="01">Jan (01)</option>
                                        <option value="02">Feb (02)</option>
                                        <option value="03">Mar (03)</option>
                                        <option value="04">Apr (04)</option>
                                        <option value="05">May (05)</option>
                                        <option value="06">June (06)</option>
                                        <option value="07">July (07)</option>
                                        <option value="08">Aug (08)</option>
                                        <option value="09">Sep (09)</option>
                                        <option value="10">Oct (10)</option>
                                        <option value="11">Nov (11)</option>
                                        <option value="12">Dec (12)</option>
                                    </select>
                                </div>
                                <div class="col-xs-6">
                                    <select class="form-control" name="expiry_year" id="payfort_fort_mp2_expiry_year">
                                        <?php
//                                        $today = getdate();
//                                        $year_expire = array();
//                                        for ($i = $today['year']; $i < $today['year'] + 11; $i++) {
//                                            $year_expire[] = array(
//                                                'text' => strftime('%Y', mktime(0, 0, 0, 1, 1, $i)),
//                                                'value' => strftime('%y', mktime(0, 0, 0, 1, 1, $i))
//                                            );
//                                        }
                                        ?>
                                        <?php
//                                        foreach ($year_expire as $year) {
//                                            echo "<option value={$year['value']}>{$year['text']}</option>";
//                                        }
                                        ?>
                                    </select>
                                </div>
                            </div>-->
                        </div>
                    </div>
                    <input type="hidden" name="userId" id="UserId" value="<?php echo $_REQUEST['UserId'] ?>">
                    <input type="hidden" name="userType" id="UserType" value="<?php echo $_REQUEST['UserType'] ?>">
                    <div class="form-group">
                        <label class="col-xs-5 control-label" for="payfort_fort_mp2_cvv"><?= $lan_arr[$lan_id][3]?></label>
                        <div class="col-xs-6">
                            <input type="tel" class="form-control required" name="cardCvv" id="payfort_fort_mp2_cvv" placeholder="<?= $lan_arr[$lan_id][3]?>" maxlength="3" onkeypress="return onlyDigit(event, this)">
                        </div>
                    </div>
                    <div class="h-seperator"></div>



                    <section class="actions">
                        <input type = submit class="btn btn-info" id="btn_continue" style="background-color: #333333;"
                        value="<?= $lan_arr[$lan_id][4]?>">
                    </section>
                </form>
            </div>
        </li>
        <!--        <li>
                    <input id="po_installments" type="radio" name="payment_option" value="installments" style="display: none">
                    <label class="payment-option" for="po_installments">
                        <img src="assets/img/installment.png" alt="">
                        <span class="name"> Pay with installments</span>
                        <em class="seperator hidden"></em>
                    </label>
                </li>
                <li>
                    <input id="po_naps" type="radio" name="payment_option" value="naps" style="display: none">
                    <label class="payment-option" for="po_naps">
                        <img src="assets/img/naps.png" alt="">
                        <span class="name">Pay with NAPS</span>
                        <em class="seperator hidden"></em>
                    </label>
                </li>
                <li>
                    <input id="po_sadad" type="radio" name="payment_option" value="sadad" style="display: none">
                    <label class="payment-option" for="po_sadad">
                        <img src="assets/img/sadaad.png" alt="">
                        <span class="name">Pay with SADAD</span>
                        <em class="seperator hidden"></em>
                    </label>
                </li>-->
    </ul>
</section>



<div class="alert alert-warning" style="margin-top:20px;">
    <i class="fa fa-exclamation-triangle"></i> <?= $lan_arr[$lan_id][5]?>
</div>

<script src="plugin/sweetalert-dev.js"></script>
<link rel="stylesheet" type="text/css" href="plugin/sweetalert.css">
<script type="text/javascript" src="vendors/jquery.min.js"></script>
<script type="text/javascript" src="assets/js/jquery.creditCardValidator.js"></script>
<script type="text/javascript" src="assets/js/checkout.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js"></script>
<script type="text/javascript">
    function onlyAlpha(event,txtid) {
        var inputValue = event.which;
        //if digits or not a space then don't let keypress work.
        if ((inputValue > 64 && inputValue < 91) // uppercase
                || (inputValue > 96 && inputValue < 123) // lowercase
                || inputValue == 32) { // space
            return;
        }
        event.preventDefault();
    }
    function onlyDigit(evt,txtid) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }
    function validateForm() {
           
           console.log("Continue Clicked");
           $('.form-group').removeClass('has-error');
           var flg = false;
           $('.required').each(function(){
//                var maxlength = $(this).attr('maxLength');
               var val = $(this).val();
               if(val == '' || typeof val == 'undefined'){
                   flg = true;
                   $(this).closest('.form-group').addClass('has-error');
               }
           });
           
           
           var isValid = payfortFortMerchantPage2.validateCcForm();
           return isValid
               
           
    }
    $(document).ready(function () {
        $('.datepicker').datepicker({
            autoclose: true,
            format: 'mm/yy',
            startDate: '+3d',
            endDate: '+11y',
            orientation: "bottom <?= ($lan_data['lan_dir'] == 'ltr')?"right":"left"?>",
            startView: "months",
            minViewMode: "months",
            language: '<?= $lan_data['lan_code']?>',
            isRTL: <?= ($lan_data['lan_dir'] == 'ltr')?"false":"true"?>
        });
        $('input:radio[name=payment_option]').click(function () {
            $('input:radio[name=payment_option]').each(function () {
                if ($(this).is(':checked')) {
                    $(this).addClass('active');
                    $(this).parent('li').children('label').css('font-weight', 'bold');
                    $(this).parent('li').children('div.details').show();
                } else {
                    $(this).removeClass('active');
                    $(this).parent('li').children('label').css('font-weight', 'normal');
                    $(this).parent('li').children('div.details').hide();
                }
            });
        });
        
        
    });
    var lan_arr = <?= json_encode($lan_arr[$lan_id])?>;
    var payfortFortMerchantPage2 = (function () {
        return {
            validateCcForm: function () {
                this.hideError();
               
                var isValid = payfortFort.validateCardHolderName($('#payfort_fort_mp2_card_holder_name'));
                
                if (!isValid) {
                    
                    this.showError(lan_arr[6]);
                    return false;
                }
                var isValid = payfortFort.validateCardHolderName($('#payfort_fort_mp2_card_holder_name1'));
                
                if (!isValid) {
                    
                    this.showError(lan_arr[6]);
                    return false;
                }
                
                isValid = payfortFort.validateCreditCard($('#payfort_fort_mp2_card_number'));
                if (!isValid) {
                   
                    this.showError(lan_arr[7]);
                    return false;
                }
               
                isValid = payfortFort.validateCvc($('#payfort_fort_mp2_cvv'));
                if (!isValid) {
                     
                    this.showError(lan_arr[8]);
                    return false;
                }
                return true;
            },
            showError: function (msg) {
                swal({
                    title: msg,
                    timer: 2000,
                    showConfirmButton: false
                });
//                swal({
//                    title: '',
//                    timer: 2000,
//                    showConfirmButton: false,
//                    text: msg,
//                    type: "error"
//                });
            },
            hideError: function () {
                return;
            }
        };
    })();
</script>
<?php include('footer.php') ?>
