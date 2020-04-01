<?php 

require_once 'dbConfig.php';
class PaytapIntegration {
    public $serverLink;

    public $apiAccess;

    /**
     * Undocumented function
     *
     * @param [type] $arg
     * @return charge id
     */
    public function charge($arg){
        //var_dump($arg);
        $amount  = $arg['amount'];

        
        $first_name = $arg['name'];

        $email = $arg['email'];

        $source=$arg['token_name'];
        //$source='src_all';
        $cust_id = $arg['cust_id'];
        
        $country_code = $arg['country_code'];

        $phone = $arg['phone'];

        $currency = $arg['currency'];

        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://api.tap.company/v2/charges",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => "{\"amount\":".$amount.",\"currency\":\"".$currency."\",\"threeDSecure\":false,\"save_card\":false,\"description\":\"Test Description\",\"statement_descriptor\":\"Sample\",\"metadata\":{\"udf1\":\"test 1\",\"udf2\":\"test 2\"},\"reference\":{\"transaction\":\"txn_0001\",\"order\":\"ord_0001\"},\"receipt\":{\"email\":false,\"sms\":true},\"customer\":{\"id\":\"".$cust_id ."\",\"first_name\":\"".$first_name."\",\"email\":\"".$email."\",\"phone\":{\"country_code\":\"".$country_code."\",\"number\":\"".$phone."\"}},\"source\":{\"id\":\"".$source."\"},\"redirect\":{\"url\":\"".SUCCESSURL."\"}}",
            CURLOPT_HTTPHEADER => array(
                "authorization: Bearer ".APIKEY,
                "content-type: application/json"
            ),
        ));

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);
        $result = json_decode($response);
        
        //var_dump($result);
        if($result->response->code == '000'){
            
            
            
            return $result->id;
            
        }
        else {
            return null;
        }
           

    }
    /**
     * Undocumented function
     *
     * @param [charge ID] $args
     * @return true or false
     */
    public function refunds($args){
        $chg_id  = $arg['chg_id'];
        $amount  = $arg['amount'];
        $currency = $arg['currency'];
        $reason = $arg['reason'];
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://api.tap.company/v2/refunds",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => "{\"charge_id\":".$chg_id.",\"amount\":".$amount.",\"currency\":".$currency."\"reason\":".$reason."}",
            CURLOPT_HTTPHEADER => array(
                "authorization: Bearer ".APIKEY,
                "content-type: application/json"
            ),
        ));

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);
        $result = json_decode($response);
        if ($err) {

            return false;

        } else {
            if($result->response->code == '000'){
            
            
            
               return true;
                
            }
            else {
                return false;
            }
            
        }
    
    }    
}
?>