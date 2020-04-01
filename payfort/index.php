
<html>
  <head>
    <link rel="stylesheet" type="text/css" href="style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
  </head>
<body>
  <h2>Add new card</h2>
  <form id="form-container" method="post" action="add_card.php" >
    <!-- Tap element will be here -->
    <div id="element-container"></div>
    <div id="error-handler" role="alert"></div>
    
    <input type="hidden" name="userId" id="UserId" value="<?php echo $_REQUEST['UserId'] ?>">
    <input type="hidden" name="userType" id="UserType" value="<?php echo $_REQUEST['UserType'] ?>">
    <input type="hidden" name="token_id" id="token_id" />
    <input type="hidden" name="card_id" id="card_id" />
    <input type="hidden" name="card_first" id="card_first" />
    <input type="hidden" name="card_last" id="card_last" />
    <input type="hidden" name="exp_month" id="exp_month" />
    <input type="hidden" name="exp_year" id="exp_year" />
    <!-- Tap pay button -->
    <button id="tap-btn">Submit</button>
  </form>
<script src="bluebird.min.js"></script>
<script src="tap.min.js"></script>
<script src="add_cards.js"></script>
</body>
</html>