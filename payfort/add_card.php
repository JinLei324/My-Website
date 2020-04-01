<?php


require __DIR__ . '/vendor/autoload.php'; //Composer installed
require_once 'dbConfig.php';
session_start();
require_once 'PayfortIntegration.php';
$objFort = new PaytapIntegration();

$cust_id = '';
$card_id = '';
$first_name = '';
$_SESSION['card_userId'] = $_POST['userId'];
$_SESSION['card_userType'] = $_POST['userType'];
$token_id = $_POST['token_id'];

if (isset($_POST['userId']) AND ! empty($_POST['userId'])) {

    if(isset($_POST['userType']) AND ! empty($_POST['userType']))
    {
        $db = database;
        $client = new MongoDB\Client("mongodb://" . username . ":" . password . "@" . hostname . ":5009/" . $db);
        
        $condition = array('_id' => new MongoDB\BSON\ObjectID($_POST['userId']));
        if($_POST['userType'] == 1){
             $dataFromQuery = $client->$db->driver->findOne($condition);
        }else if($_POST['userType'] == 2){
            $dataFromQuery = $client->$db->customer->findOne($condition); 
            
        }else{
            $msg = urlencode('Please enter valid userType');
            header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
            exit();
            
        }    
        if (empty($dataFromQuery)) {
            
            $msg = urlencode('Please send valid UserId');
            header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
            exit();
            
        }
        
        if(!isset($dataFromQuery->cust_id)){
            
            $contry_code = substr($dataFromQuery->countryCode,1);
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => "https://api.tap.company/v2/customers",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => "",
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => "POST",
                CURLOPT_POSTFIELDS => "{\"first_name\":\"".$dataFromQuery->name."\",\"last_name\":\"".$dataFromQuery->name."\",\"email\":\"".$dataFromQuery->email."\",\"phone\":{\"country_code\":\"".$contry_code."\",\"number\":\"".$dataFromQuery->phone."\"}}",
                CURLOPT_HTTPHEADER => array(
                    "authorization: Bearer ".APIKEY,
                    "content-type: application/json"
                ),
            ));
            
            
            $response = curl_exec($curl);            
            
            $err = curl_error($curl);

            curl_close($curl);

            if ($err) {
                
                $msg = urlencode($err);
                header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
                exit();
                
            } else {
                $custData = json_decode($response);
                
                if(!isset($custData->id)){
                    $msg = urlencode($custData->message);
                    header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
                    exit();
                }
                
                $updataData = array("cust_id" => $custData->id,
                                    "cardDetails" => array()                                    
                                );
                if($_POST['userType'] == 1){
                    $result = $client->$db->driver->updateOne($condition,array('$set'=>$updataData));
                }else if($_POST['userType'] == 2){
                   $result = $client->$db->customer->updateOne($condition,array('$set'=>$updataData)); 
                   
                }
                $cust_id = $custData->id; 
                $first_name = $dataFromQuery->name;
            }
                
        }else{
            $cust_id = $dataFromQuery->cust_id;
            $first_name = $dataFromQuery->name;
        }
        
        //ADD card

        
        
        //save card in customer
        
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://api.tap.company/v2/card/".$cust_id,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => "{\"source\":\"".$token_id."\"}",
            CURLOPT_HTTPHEADER => array(
                "authorization: Bearer ".APIKEY,
                "content-type: application/json"
            ),
        ));


        $response = curl_exec($curl);
        $err = curl_error($curl);
        $result = json_decode($response);
        curl_close($curl);
        
        if ($err) {
            
            
            $msg = urlencode($err);
            header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
            exit();
            
        } else {
            
            
            if(!isset($result->id)){
                $msg = urlencode($result->message);
                header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
                exit();
            }
            
            $card_id = $result->id;
            $card_holder_name=$result->name;
            $card_number = $result->first_six.'xxxxxx'.$result->last_four;
            $expiry_month = $result->exp_month;
            $expiry_year = $result->exp_year;
            $isDefault = true;
            if (isset($dataFromQuery->cardDetails) && count($dataFromQuery->cardDetails) > 0) {
                $isDefault = false;
            }
            
            $updataData = array("cardDetails" => 
                            array(
                                '_id' => new MongoDB\BSON\ObjectID(), 
                                'isDefault' => $isDefault, 
                                'card_id' => $card_id, 
                                'token_name' => $token_id, 
                                'card_holder_name' => $card_holder_name, 
                                'card_number' => $card_number, 
                                'expiry_month' => $expiry_month,
                                'expiry_year' => $expiry_year,
                                
                            )
                        );    

            
            if($_POST['userType'] == 1){
                $result = $client->$db->driver->updateOne($condition,array('$push'=>$updataData));
            }else if($_POST['userType'] == 2){
                $result = $client->$db->customer->updateOne($condition,array('$push'=>$updataData)); 
                
            }
            $msg = urlencode('Your card added successfully!');
            header('Location: http://payfort.mandobe.com/result.php?title=SUCCESS&msg='.$msg);
            exit();
            //1 USD Pay
            /*
            $arg = array();
            $arg['cust_id'] = $cust_id;
            $arg['token_name'] = $token_id;
            $arg['email'] = $dataFromQuery->email;
            $arg['country_code'] = substr($dataFromQuery->countryCode,1);
            $arg['amount']=1;
            $arg['name'] = $first_name;
            $arg['phone'] = $dataFromQuery->phone;
            $arg['currency'] = 'USD';
            
            

            $chg_id = $objFort->charge($arg);
            
            if($chg_id!=null)
            {
                
                $url= 'http://payfort.mandobe.com/success.php?tap_id='.$chg_id;
                
                //die('should have redirected by now');
                ///exit();
                echo "<!DOCTYPE html>"; 
                echo "<html>"; 

                echo "<body>"; 
                echo "<script>";                    
                echo "window.location = \"".$url."\""; 
                echo "</script>"; 
                echo "</body>"; 
                echo "</html>"; 
            }else{
                $msg = urlencode('Payment Test Failed');
                //header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
                exit();
            }
            */  
                
            

        }
        
        
        
    }else{
        $msg = urlencode('Please enter user type');
        header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
        exit();
        
    }

} else {
    
    $msg = urlencode('Please send UserId');
    header('Location: http://payfort.mandobe.com/result.php?title=Error&msg='.$msg);
    exit();
}

?>


