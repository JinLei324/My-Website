<?php

// testing
if (!defined('BASEPATH'))
    exit('No direct script access allowed');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class PackageBox extends CI_Controller {
  
    public function __construct() {
           
          parent::__construct();
        $this->load->helper('url');
        $this->load->model('Packageboxmodel');
        $this->load->model('Categorymodal');
        $this->load->model('SubCategorymodal');
        $this->load->model('SubsubCategorymodal');
        // for check session
        $this->load->model('Logoutmodal');
        $this->Logoutmodal->logout();
        //
        $language = ($this->session->userdata('lang'))?($this->session->userdata('lang')):'english';
        $this->lang->load('header_lang',$language);
        $this->lang->load('packagebox_lang', $language);
        
        error_reporting(0);
        header("cache-Control: no-store, no-cache, must-revalidate");
        header("cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
    }
    
       public function index($status = '') {
        $this->load->library('Datatables');
        $this->load->library('table');
        
        $data['language'] = $this->Packageboxmodel->getlanguageText();
        // $data['category'] = $this->Categorymodal->getCategoryForFranchise_and_Business();
        
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class=" table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px;">',
            'heading_row_start' => '<tr style= "font-size:12px"role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => '<th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="width: 127px;font-size:12px;">',
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
        //$this->table->set_heading($this->lang->line('col_sino'),$this->lang->line('col_Name'),$this->lang->line('col_Cat'),$this->lang->line('col_SubCat'),$this->lang->line('col_SubSubCat'),$this->lang->line('col_Desc'),$this->lang->line('col_select'));
        $checkbox=' <input type="checkbox" id="select_all" />';
        $this->table->set_heading($this->lang->line('col_sino'),
        $this->lang->line('col_Name'),$this->lang->line('col_weight'), 
        $this->lang->line('col_volume'), $checkbox);
    
        $data['storeCategory']=$this->Packageboxmodel->getStoreCategory();
        $data['pagename'] = "packageBox/index";
        $this->load->view("company", $data);
    }
    public function sizeUrl(){
        $this->Packageboxmodel->sizeUrl();
    }
     public function size_details($status = '') {
        $this->Packageboxmodel->size_details($status);
    }
    public function getSizeChart($id=''){
        $this->Packageboxmodel->getSizeChart($id);
    }
    
     public function addSizeGroup() {
        $this->Packageboxmodel->addSizeGroup();
    }
     public function getSize() {
        $data1 = $this->Packageboxmodel->getSize();
        echo json_encode(array('data' => $data1));
       
    }
    public function getCategoryData($scid = '') {
        $this->Packageboxmodel->getCategoryData($scid);
       }
    public function getSubCategoryData($cid = '',$sid = '') {
     $this->Packageboxmodel->getSubCategoryData($cid, $sid);
    }
    public function getSubsubCategoryDataList($sid = '',$ssid = '') {
     $this->Packageboxmodel->getSubsubCategoryDataList($sid, $ssid);
    }
     public function editSize() {
       $this->Packageboxmodel->editSize();
    }
     public function activateColor() {
        $this->Packageboxmodel->activateColor();
    }
     public function deactivateColor() {
        $this->Packageboxmodel->deactivateColor();
    }
   
    
}
