<?php

//echo "<script type='text/javascript'>alert('here i m');</script>";
//echo json_encode(array('test' => $_POST['Address']));


if ($_REQUEST['Address']) {
    $geocode = file_get_contents('https://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($_REQUEST['Address']) . '&key=AIzaSyCK5bz3K1Ns_BASkAcZFLAI_oivKKo98VE');

    $output = json_decode($geocode);
    $status = $output->status;
    if ($status == "OK") {
        $latlong[0] = $output->results[0]->geometry->location->lat;
        $latlong[1] = $output->results[0]->geometry->location->lng;
        echo json_encode(array('flag' => 1, 'Lat' => $latlong[0], 'Long' => $latlong[1]));
    } else {
        echo json_encode(array('flag' => 0));
    }
}
?>
