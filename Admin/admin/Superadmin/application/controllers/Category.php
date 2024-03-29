<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class Category extends CI_Controller {

  
    public function __construct() {
           
          parent::__construct();
        $this->load->helper('url');
        $this->load->model('Logoutmodal');
$this->Logoutmodal->logout();
        $this->load->model("Categorymodal");
        $this->load->model("StoreCategoryModel");
        $language = ($this->session->userdata('lang'))?($this->session->userdata('lang')):'english';
$this->lang->load('header_lang',$language); 
//        $this->load->model("Superadminmodal");

        error_reporting(0);
        header("cache-Control: no-store, no-cache, must-revalidate");
        header("cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
    }
 

    public function index() {

     

        $data['business'] = $this->Categorymodal->CategoryData();

        $this->load->library('Datatables');
        $this->load->library('table');
        
        $tmpl = array('table_open' => '<table id="big_table" border="1" cellpadding="2" cellspacing="1" class=" table table-striped table-bordered dataTable no-footer" id="tableWithSearch" role="grid" aria-describedby="tableWithSearch_info" style="margin-top: 30px;">',
            'heading_row_start' => '<tr style= "font-size:12px"role="row">',
            'heading_row_end' => '</tr>',
            'heading_cell_start' => ' <th class="sorting" tabindex="0" aria-controls="tableWithSearch" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="width: 127px;font-size:12px;">',
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
        $data['status'] =1;
//        $this->table->set_heading('SL NO', 'IMAGE', 'CATEGORY NAME', 'DESCRIPTION', 'SUBCATEGORY COUNT','META TAGS', 'SORT','ACTIONS' ,'SELECT');
        $checkbox=' <input type="checkbox" id="select_all" />';
        //$this->table->set_heading('SL NO', 'IMAGE', 'CATEGORY NAME', 'DESCRIPTION', 'SUBCATEGORY COUNT','META TAGS', 'SORT','ACTIONS' , 'COMMISION',$checkbox);
        $this->table->set_heading('SL NO', 'IMAGE', 'CATEGORY NAME', 'DESCRIPTION', 'SUBCATEGORY COUNT','META TAGS', 'SORT','ACTIONS' ,$checkbox);
        $data['language'] = $this->Categorymodal->get_lan_hlpText();
        $data['storeCategory'] = $this->StoreCategoryModel->getStoreCategoryData();
        $data['pagename'] = 'Category/category'; 
        $this->load->view("company", $data);
    }
       
            
     public function operationCategory($param = '',$status = ''){
       
        
        switch ($param) {
            case 'insert':$this->Categorymodal->insertCategory();
                break;

            case 'edit': $this->Categorymodal->editCategory();
                break;

            case 'delete':$this->Categorymodal->deleteCategory();
                break;

            case 'get': $this->Categorymodal->getCategoryData();
                break;
            
            case 'table': $this->Categorymodal->datatable_category($status);
                break;
            
            case 'unhide': $this->Categorymodal->unhideCategory($status);
                break;
            
            case 'hide': $this->Categorymodal->hideCategory($status);
                break;
            
            case 'order': $this->Categorymodal->changeCatOrder($status);
                break;
        }
    }
}