function compareAddOns(cartAddOns, newAddOns) {
    function compareAddOnId(cartAddOn, newAddOn) {
        var aId = cartAddOn.id;
        var bId = newAddOn.id;

        if (aId < bId) {
            return -1;
        }

        if (aId > bId) {
            return 1;
        }

        return 0;
    }

    if (cartAddOns.length !== newAddOns.length) {
        return false;
    }

    cartAddOns.sort(compareAddOnId);
    newAddOns.sort(compareAddOnId);


    for (var i = cartAddOns.length - 1; i >= 0; i--) {
        if (cartAddOns[i].id !== newAddOns[i].id) {
            return false;
        }

        if (cartAddOns[i].addOnGroup.length !== newAddOns[i].addOnGroup.length) {
            return false;
        }

        cartAddOns[i].addOnGroup.sort();
        newAddOns[i].addOnGroup.sort();

        for (var j = cartAddOns[i].addOnGroup.length; j >= 0; j--) {
            if (cartAddOns[i].addOnGroup[j] !== newAddOns[i].addOnGroup[j]) {
                return false;
            }
        }
    }

    return true;
}

module.exports = {
  compareAddOns
}