<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class SubCategory extends CI_Controller {

  
    public function __construct() {
           
          parent::__construct();
        $this->load->helper('url');
        $this->load->model('Logoutmodal');
        $this->Logoutmodal->logout();
        $this->load->model("Superadminmodal");
        $this->load->model("Categorymodal");
         $this->load->model("SubCategorymodal");
         $this->load->model("Languagemodal");
         $language = ($this->session->userdata('lang'))?($this->session->userdata('lang')):'english';
         $this->lang->load('header_lang',$language);

        error_reporting(0);
        header("cache-Control: no-store, no-cache, must-revalidate");
        header("cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
    }
 

     public function datatable_subcategory($status = '',$visibility = '') {

    
        $this->SubCategorymodal->datatable_subcategory($status,$visibility);
    }
    public function SubCategory($params = '') {

        

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
        //$this->table->set_heading('SL NO', 'IMAGE', 'SUBCATEGORY NAME',  'DESCRIPTION', 'SUB-SUBCATEGORY COUNT','META TAGS','SORT','ACTION','SELECT');
        $checkbox=' <input type="checkbox" id="select_all" />';
        $this->table->set_heading('SL NO', 'IMAGE', 'SUBCATEGORY NAME',  'DESCRIPTION', 'SUB-SUBCATEGORY COUNT','META TAGS','SORT','ACTION',$checkbox);
        $data['language'] = $this->Languagemodal->get_lan_hlpText();
//        echo '<pre>'; print_r($data['language']); die;
        $data['details'] = $this->SubCategorymodal->SubCategoryData();
        $data['bid1'] = $params;
        $data['pagename'] = 'SubCategory/subcategory';
        $this->load->view("company", $data);       
    }
    public function deleteSubCategory() {

        $data = $this->SubCategorymodal->deleteSubCategory();
        return $data;
    }
    public function insertSubCategory() {

        
        $this->SubCategorymodal->insertSubCategory();
        
      }
       public function editSubCategory() {

        
        $this->SubCategorymodal->editSubCategory();
       
        
      }
      public function hideSubCategory() {

        echo $this->SubCategorymodal->hideSubCategory();
    }
    
     public function unhideSubCategory() {
        echo $this->SubCategorymodal->unhideSubCategory();
    }
      public function getbusiness_catdataTwo() {

        $data[] = $this->SubCategorymodal->getbusiness_catdataTwo();

        echo json_encode($data);
    }
      public function getSubCategoryData($id = '') {

         $this->SubCategorymodal->getSubCategoryData($id);

    }
    
     public function operationSubCategory($param = '',$status = ''){
       
        
        switch ($param) {
     
            case 'order': $this->SubCategorymodal->changeCatOrder($status);
                break;
        }
    }
}