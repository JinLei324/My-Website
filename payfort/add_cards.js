//pass your public key from tap's dashboard
var tap = Tapjsli('pk_test_F6OyUbm9k0BcYXnuqwVHj5TG');

var elements = tap.elements({});

var style = {
  base: {
    color: '#535353',
    lineHeight: '18px',
    fontFamily: 'sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: 'rgba(0, 0, 0, 0.26)',
      fontSize:'15px'
    }
  },
  invalid: {
    color: 'red'
  }
};
// input labels/placeholders
var labels = {
    cardNumber:"Card Number",
    expirationDate:"MM/YY",
    cvv:"CVV",
    cardHolder:"Card Holder Name"
  };
//payment options
var paymentOptions = {
  currencyCode:["KWD","USD","SAR","QAR","INR"],
  labels : labels,
  TextDirection:'ltr'
}
//create element, pass style and payment options
var card = elements.create('card', {style: style},paymentOptions);
//mount element
card.mount('#element-container');
//card change event listener
card.addEventListener('change', function(event) {
  if(event.loaded){
    console.log("UI loaded :"+event.loaded);
    console.log("current currency is :"+card.getCurrency())
  }
  var displayError = document.getElementById('error-handler');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

var form = document.getElementById('form-container');
form.addEventListener('submit', function(event) {
  event.preventDefault();

  tap.createToken(card).then(function(result) {
    console.log(result);
    if (result.error) {
      // Inform the user if there was an error
      var errorElement = document.getElementById('error-handler');
      errorElement.textContent = result.error.message;
    } else {
      // Send the token to your server
     
      var tokenId = document.getElementById('token_id');
      tokenId.value = result.id;
      
      var cardId = document.getElementById('card_id');
      cardId.value = result.card.id;
      var cardFirst = document.getElementById('card_first');
      cardFirst.value = result.card.first_six;
      var cardLast = document.getElementById('card_last');
      cardLast.value = result.card.last_four;
      var expMonth = document.getElementById('exp_month');
      expMonth.value = result.card.exp_month;
      var expYear = document.getElementById('exp_year');
      expYear.value = result.card.exp_year;
      form.submit(); 
    }
  });
});