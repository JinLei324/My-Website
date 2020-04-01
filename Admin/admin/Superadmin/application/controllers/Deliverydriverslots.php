<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Deliverydriverslots extends CI_Controller {

    /**
     * Index Page for this controller.
     *
     * Maps to the following URL
     * 		http://example.com/index.php?/welcome
     * 	- or -
     * 		http://example.com/index.php?/welcome/index
     * 	- or -
     * Since this controller is set as the default controller in
     * config/routes.php, it's displayed at http://example.com/
     *
     * So any other public methods not prefixed with an underscore will
     * map to /index.php?/welcome/<method_name>
     * @see http://codeigniter.com/user_guide/general/urls.html
     */
    
    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->model('Logoutmodal');
$this->Logoutmodal->logout();
        $this->load->model("Deliverydriverslotsmodal");
       // $this->load->model("superModel/Logout");
        $this->load->library('CallAPI');
        $language = ($this->session->userdata('lang'))?($this->session->userdata('lang')):'english';
$this->lang->load('header_lang',$language); 
        error_reporting(0);
        header("cache-Control: no-store, no-cache, must-revalidate");
        header("cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
    }

    public function index() {
        $this->load->library('Datatables');
        $this->load->library('table');
        //$data['citiesData'] = $this->Deliverydriverslotsmodal->getCityList();
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class="table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px; font-size:11px;">',
            'heading_row_start' => '<tr role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => '<th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="">',
            'heading_cell_end' => '</th>',
            'row_start' => '<tr>',
            'row_end' => '</tr>',
            'cell_start' => '<td>',
            'cell_end' => '</td>',
            'row_alt_start' => '<tr>',
            'row_alt_end' => '</tr>',
            'cell_alt_start' => '<td>',
            'cell_alt_end' => '</td>',
            'table_close' => '</table>'
        );
        $this->table->set_template($tmpl);

        $this->table->set_heading('SL NO.', 'START DATE', 'END DATE', 'START TIME', 'END TIME','WORKING DAYS','No of Delivery','ACTION');
        $data['pagename'] = "Deliveryslotsdriver/Deliveryschduled";
        $this->load->view("company", $data);
    }
    public function slots($zoneId='',$cityId='',$zoneDeliveryId='') {
       
       
        $this->load->library('Datatables');
        $this->load->library('table');
        //$data['citiesData'] = $this->Deliverydriverslotsmodal->getCityList();
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class="table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px; font-size:11px;">',
            'heading_row_start' => '<tr role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => '<th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="">',
            'heading_cell_end' => '</th>',
            'row_start' => '<tr>',
            'row_end' => '</tr>',
            'cell_start' => '<td>',
            'cell_end' => '</td>',
            'row_alt_start' => '<tr>',
            'row_alt_end' => '</tr>',
            'cell_alt_start' => '<td>',
            'cell_alt_end' => '</td>',
            'table_close' => '</table>'
        );
        $this->table->set_template($tmpl);
        $data['zoneId'] = $zoneId;
        $data['cityId'] = $cityId;
        $data['zoneDeliveryId'] = $zoneDeliveryId;
       

        //$this->table->set_heading('SL NO.','DRIVER NAME','NUMBER','ORDER','ACTION' );
        $this->table->set_heading('SL NO.','DRIVER NAME','NUMBER','ORDER' );
        $data['pagename'] = "Deliveryslotsdriver/Deliveryschduled";
        $this->load->view("company", $data);
    }
    public function slotDetails($id=''){
        $this->load->library('Datatables');
        $this->load->library('table');
        //$data['citiesData'] = $this->Deliverydriverslotsmodal->getCityList();
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class="table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px; font-size:11px;">',
            'heading_row_start' => '<tr role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => '<th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="">',
            'heading_cell_end' => '</th>',
            'row_start' => '<tr>',
            'row_end' => '</tr>',
            'cell_start' => '<td>',
            'cell_end' => '</td>',
            'row_alt_start' => '<tr>',
            'row_alt_end' => '</tr>',
            'cell_alt_start' => '<td>',
            'cell_alt_end' => '</td>',
            'table_close' => '</table>'
        );
        $this->table->set_template($tmpl);

        $this->table->set_heading('SLNO.','DATE', 'START TIME', 'END TIME','DAY','No of Delivery','Booked Delivery','Available Delivery','ACTION');
        $data['pagename'] = "Deliveryslotsdriver/Deliveryslot";
        $data['deliveryworkingHourId'] = $id;
        $this->load->view("company", $data);

    }

    public function bookingSlotdetails($id=''){
       
        $this->load->library('Datatables');
        $this->load->library('table');
        //$data['citiesData'] = $this->Deliverydriverslotsmodal->getCityList();
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class="table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px; font-size:11px;">',
            'heading_row_start' => '<tr role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => '<th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="">',
            'heading_cell_end' => '</th>',
            'row_start' => '<tr>',
            'row_end' => '</tr>',
            'cell_start' => '<td>',
            'cell_end' => '</td>',
            'row_alt_start' => '<tr>',
            'row_alt_end' => '</tr>',
            'cell_alt_start' => '<td>',
            'cell_alt_end' => '</td>',
            'table_close' => '</table>'
        );
        $this->table->set_template($tmpl);

        $this->table->set_heading('SLNO.','ORDER ID','CUSTOMER NAME','DRIVER NAME','ORDER DATE AND TIME','STATUS');
        $data['pagename'] = "Deliveryslotsdriver/bookedDetails";
        $data['deliveryworkingHourId'] = $id;
        $this->load->view("company", $data);

    }
           
    public function datatable_getProviderDetails($zoneId ='',$status = '',$timeOffset= '',$zoneDeliveryId) {
        $this->Deliverydriverslotsmodal->datatable_getProviderDetails($zoneId,$status,$timeOffset,$zoneDeliveryId);
    }

    public function getProviderDetailsCount($cityid = '', $catid = '', $userType = '', $sdate = '') {

        $this->Deliverydriverslotsmodal->getProviderDetailsCount($cityid, $catid, $userType, $sdate);
    }

    public function addSchduled($zoneId='',$cityId = '') {

        $this->Deliverydriverslotsmodal->addSchduled($zoneId,$cityId);

    }
    
    public function deleteSchduled() {

        $this->Deliverydriverslotsmodal->deleteSchduled();

    }
    public function deleteParticularSlot() {

        $this->Deliverydriverslotsmodal->deleteParticularSlot();

    }
    public function addSlotSchduled(){
        $this->Deliverydriverslotsmodal->addSlotSchduled();
    }
  
    public function datatable_getSlotSchduled($id='',$Offset=''){
        $this->Deliverydriverslotsmodal->datatable_getSlotSchduled($id,$Offset);
    }

    public function datatable_getBookingDetails($id='',$Offset=''){
        $this->Deliverydriverslotsmodal->datatable_getBookingDetails($id,$Offset);
    }
    
   

}
