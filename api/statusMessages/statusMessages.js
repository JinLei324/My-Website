var config = process.env;
const bookingStatus_notifyi = function(successCode, driver, language) {
  var return_;
  switch (successCode) {
    case 1:
      return_ = "Thank you! We will inform you as soon as we find the best possible driver for your load.";
      break;
    case 2:
      return_ = "Driver " + driver.name + " has accepted your load.";
      break;
    case 3:
      return_ = "Driver has cancelled this delivery with the reason " + driver.reason + ".";
      break;
    case 4:
      return_ = "Your booking is cancelled, hope you book soon on " + config.appName + " again.";
      break;

    case 6:
      return_ = "Driver " + driver.name + " is on his way to pickup your load , please be ready.";
      break;
    case 7:
      return_ = "Driver " + driver.name + " has arrived at your address , please hand over the load to him";
      break;
    // case 8:
    //     return_ = 'Vehicle has been loaded and our driver is on his way to drop your load.';
    //     break;
    // case 9:
    //     return_ = 'Driver has Reached to Drop Location.';
    //     break;
    case 8:
      return_ = "Driver " + driver.name + " is on his way to pickup your load , please be ready.";
      break;
    case 9:
      return_ = "Driver has cancelled this delivery with the reason " + driver.reason + ".";
      break;
    case 16:
      return_ = "The load has been delivered.";
      break;

    case 10:
      return_ = "Please check the receipt.";
      break;

    case 11:
      return_ =
        "Sorry , we cannot take up your delivery request at this moment , all our drivers are busy. Please try again after sometime.";
      break;

    case 12:
      return_ = {
        title: "You got New Booking",
        body: "Customer Has requested shipment",
        sound: "default"
      };
      break;

    case 13:
      return_ = "Customer has cancelled Booking.";
      break;

    case 14:
      return_ = "You Got New Booking.";
      break;

    case 15:
      return_ = "Verification code from " + config.appName;
      break;

    case 111:
      return_ = "Your account is logged in with some other device.";
      break;
    default:
      return_ = "Unassigned.";
  }
};

const bookingStatus = function(successCode, isCominigFromStore, storeType, language) {
  var return_;
  if (parseInt(storeType) != 5) {
    switch (successCode) {
      case 1:
        return_ = "New Order";
        break;
      case 2:
        return_ = "Cancelled by manager";
        break;
      case 3:
        return_ = "Rejected by manager";
        break;
      case 4:
        return_ = "Accepted by Store.";
        break;
      case 5:
        return_ = "Order ready.";
        break;

      case 6:
        return_ = "Order picked.";
        break;
      case 7:
        return_ = "Order completed."; //pickup
        break;
      case 8:
        return_ = "Accepted by driver.";
        break;
      case 9:
        return_ = "Rejected by driver.";
        break;
      case 10:
        return_ = "Driver enroute to store.";
        break;
      case 11:
        return_ = "Driver is at the store.";
        break;
      case 12:
        return_ = "Drive enroute to delivery location.";
        break;
      case 13:
        return_ = "Driver has reached the delivery location.";
        break;
      case 14:
        return_ = "Delivered.";
        break;
      case 15:
        return_ = "Order completed.";
        break;
      case 16:
        return_ = "Cancelled by customer.";
        break;
      case 17:
        return_ = "Cancelled by driver.";
        break;
      case 18:
        return_ = "Order duetime updated."; // order delayed
        break;
      case 19:
        return_ = "central dispatch.";
        break;
      case 20:
        return_ = "Order expired.";
        break;

      default:
        return_ = "Unassigned.";
    }
  } else {
    if (isCominigFromStore) {
      switch (successCode) {
        case 1:
          return_ = "New Order";
          break;
        case 2:
          return_ = "Cancelled by manager";
          break;
        case 3:
          return_ = "Rejected by manager";
          break;
        case 4:
          return_ = "Accepted by Store.";
          break;
        case 5:
          return_ = "Order ready.";
          break;

        case 6:
          return_ = "Order picked.";
          break;
        case 7:
          return_ = "Order completed."; //pickup
          break;
        case 8:
          return_ = "Delivery Driver Assigned.";
          break;
        case 9:
          return_ = "Rejected by driver.";
          break;
        case 10:
          return_ = "Driver enroute to laundramart.";
          break;
        case 11:
          return_ = "Driver at laundramart.";
          break;
        case 12:
          return_ = "laundry pickrd, Drive enroute to delivery location.";
          break;
        case 13:
          return_ = "Driver has reached the delivery location.";
          break;
        case 14:
          return_ = "Delivered.";
          break;
        case 15:
          return_ = "Order completed.";
          break;
        case 16:
          return_ = "Cancelled by customer.";
          break;
        case 17:
          return_ = "Cancelled by driver.";
          break;
        case 18:
          return_ = "Order duetime updated."; // order delayed
          break;
        case 19:
          return_ = "central dispatch.";
          break;
        case 20:
          return_ = "Order expired.";
          break;

        default:
          return_ = "Unassigned.";
      }
    } else {
      switch (successCode) {
        case 1:
          return_ = "New Order";
          break;
        case 2:
          return_ = "Cancelled by Store";
          break;
        case 3:
          return_ = "Rejected by Store";
          break;
        case 4:
          return_ = "PickUp Requested";
          break;
        case 5:
          return_ = "Order ready.";
          break;

        case 6:
          return_ = "Order picked.";
          break;
        case 7:
          return_ = "Order completed."; //pickup
          break;
        case 8:
          return_ = "Driver Assign.";
          break;
        case 9:
          return_ = "Rejected by driver.";
          break;
        case 10:
          return_ = "Driver enroute to customer location.";
          break;
        case 11:
          return_ = "Driver at Your Door Step";
          break;
        case 12:
          return_ = "Drive enroute to delivery location.";
          break;
        case 13:
          return_ = "Driver has reached the delivery location.";
          break;
        case 14:
          return_ = "Delivered.";
          break;
        case 15:
          return_ = "Laundry dropped at laundramart.";
          break;
        case 16:
          return_ = "Driver at yout door step."; // order delayed
          break;
        case 17:
          return_ = "Laundry Picked";
          break;
        case 18:
          return_ = "Dropped to laundromat";
          break;
        // case 16:
        //     return_ = 'Cancelled by customer.';
        //     break;
        // case 17:
        //     return_ = 'Cancelled by driver.';
        //     break;
        // case 18:
        //     return_ = 'Order duetime updated.';// order delayed
        //     break;
        case 19:
          return_ = "central dispatch.";
          break;
        case 20:
          return_ = "Order expired.";
          break;
        case 31:
          return_ = "Driver Arrived & Picked."; // order delayed
          break;
        case 32:
          return_ = "Driver Arrived to laundromat";
          break;
        case 33:
          return_ = "Dropped to laundromat";
          break;
        case 25:
          return_ = "Washing";
          break;
        default:
          return_ = "Unassigned.";
      }
    }
  }

  return return_;
};

module.exports = { bookingStatus_notifyi, bookingStatus };
