<?php

$curl = curl_init();
$charge_id = $_GET['tap_id'];
curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.tap.company/v2/charges/".$charge_id,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_POSTFIELDS => "{}",
  CURLOPT_HTTPHEADER => array(
    "authorization: Bearer ".APIKEY
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);
$result = json_decode($response);
$UserId = $_SESSION['card_userId'] ;
$UserType = $_SESSION['card_userType'] ;
echo $result->status;
$success = true;
if ($err || $result->status=='') {
    $success = false;
    
} 
?>
<html>
    <head>
        <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">   
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">  

        <style>
            body{
                font-size: 21px;
                overflow-x: hidden;    
                font-family: 'Lato', sans-serif;
            }

            .Main{
                font-size: 48px;
                font-weight: 700;
                color: #445525;
                ;
            }
            .content{
                margin-top: 20%;
            }
        </style>   
    </head>
    <body>
        <div class="container text-center content">
            <?php
            if (isset($_SESSION['lan'])) {
                if ($_SESSION['lan'] == 'en') {
                    ?>
                    <h1 class="Main" >
                    <?php
                        if($success)
                            echo "Success !!!";
                        else
                            echo "Failed !!!";
                    ?>
                    </h1>
                    <h3 class="Msg" >
                    
                    <?php
                        if($success)
                            echo "Your card added successfully...";
                        else
                            echo "Your card added failed... ";
                    ?>
                    </h3>    
                    <?php
                } else {
                    ?>

                    <h1 class="Main" >
                    <?php
                        if($success)
                            echo "بنجاح  !!!";
                        else
                            echo "Failed !!!";
                    ?>
                    
                    </h1>
                    <h3 class="Msg" >
                    <?php
                        if($success)
                            echo "تم اضافة الكرت الخاص بك بنجاح";
                        else
                            echo "Your card added failed...";
                    ?>
                    
                    </h3>
                    <?php
                }
            } else {
                ?>
                <h1 class="Main" >
                <?php
                        if($success)
                            echo "Success !!!";
                        else
                            echo "Failed !!!";
                    ?>
                    </h1>
                <h3 class="Msg" >
                <?php
                        
                        if($success)
                            echo "Your card added successfully...";
                        else
                            echo "Your card added failed... ";
                    
                ?>
                
                </h3>
                <?php
            }
            ?>

        </div>
    </body>
</html>