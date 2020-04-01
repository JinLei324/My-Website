<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class GridProduct_controller extends CI_Controller {

    public function __construct() {
           
      parent::__construct();
      $this->load->helper('url');
      $this->load->model('GridProductModel');
     
      $this->load->model('Categorymodal');

      $language = ($this->session->userdata('lang'))?($this->session->userdata('lang')):'english';
      $this->lang->load('product_lang', $language);

      error_reporting(0);
      header("cache-Control: no-store, no-cache, must-revalidate");
      header("cache-Control: post-check=0, pre-check=0", false);
      header("Pragma: no-cache");
      header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
     
    }

    public function index($status=''){

        

        $storeId=$this->session->userdata('badmin')['BizId'];

        $data['products'] = $this->GridProductModel->get_product($storeId);
        $data['category']=$this->GridProductModel->getCategory();
      
        $data['brand']=$this->GridProductModel->getBrand();
        $data['manufacturer']=$this->GridProductModel->getManufacturerlist();
      

        $data['pagename'] = "Gridproducts/GridProductView";
        $this->load->view("template", $data);

    }

    //get data based on click
    public function productGridDisplay($status=''){

        

        $storeId=$this->session->userdata('badmin')['BizId'];                
        $data['products'] = $this->GridProductModel->get_productGrid($status,$storeId);
        

    }


       //sub cat dynamic
       public function getCatlist(){

        $this->GridProductModel->getCatlist();
    }

    //sub cat dynamic
    public function getSubCategory(){

        $this->GridProductModel->getSubCategory();
    }

    //sub sub cat dynamic
    public function getSubSubCategory(){

        $this->GridProductModel->getSubSubCategory();
    }


    //deleted products dispaly
    public function deleted($status=''){

        // if ($this->session->userdata('table') != 'company_info') {
        //     redirect(base_url());
        // }
       
        $data['products'] = $this->GridProductModel->get_productdeleted();
        $data['pagename'] = "Gridproducts/GridProductView";
        $this->load->view("template", $data);

    }


    //delete product
    public function deleteProduct($productId=''){

        $data['products'] = $this->GridProductModel->deleteProduct($productId);
        echo json_encode($data['products']) ;

    }

    //edit category
    public function EditProducts($id = '') {

        $this->load->library('Datatables');
        $this->load->library('table');
        $data['currencySymbol'] = $this->GridProductModel->getAppConfigData();
        $data['color'] = $this->GridProductModel->getActiveColors();
       // $data['size'] = $this->GridProductModel->getActiveSize();
        $data['language'] = $this->GridProductModel->getlanguageText();
        $data['manufacturer'] = $this->GridProductModel->getManufacturer();
        $data['brands'] = $this->GridProductModel->getBrands();
        $data['productId'] = $id;
        $data['category'] = $this->Categorymodal->getCategoryForFranchise_and_Business();
        $data['productsData'] = $this->GridProductModel->getData($id);
             
        $data['pagename'] = "Gridproducts/editProducts";
        $this->load->view("template", $data);
    }

    //fetch product details in model
    public function getUnitDetails($productId=''){

       $this->GridProductModel->getUnitDetails($productId);
       
        

    }


    //fetch product details in page
    public function get_productDetails($productId=''){

        $data['data'] = $this->GridProductModel->get_productDetails($productId);
       
        $data['pagename'] = "Gridproducts/viewProductsDetails";
        $this->load->view("template", $data);

       
       

    }

    //view category
    public function ViewProducts($id = '') {

        $this->load->library('Datatables');
        $this->load->library('table');
        $data['currencySymbol'] = $this->GridProductModel->getAppConfigData();
        $data['color'] = $this->GridProductModel->getActiveColors();
       // $data['size'] = $this->GridProductModel->getActiveSize();
        $data['language'] = $this->GridProductModel->getlanguageText();
        $data['manufacturer'] = $this->GridProductModel->getManufacturer();
        $data['brands'] = $this->GridProductModel->getBrands();
        $data['productId'] = $id;
        $data['category'] = $this->Categorymodal->getCategoryForFranchise_and_Business();
        $data['productsData'] = $this->GridProductModel->getData($id);
        $data['storeType'] = $this->session->userdata('badmin')['storeType'];      
        $data['pagename'] = "Gridproducts/viewProductsDetails";
        $this->load->view("template", $data);
    }

   
    //get category
    public function getCategorylist($categoryId=''){

        $franchiseId=$this->session->userdata('fadmin')['MasterBizId'];
        $data['category']=$this->GridProductModel->getCategorylist($categoryId,$franchiseId);
      }

    //sub category
    
     public function getSubCategorylist($categoryId){

        $storeId=$this->session->userdata('badmin')['BizId'];
        $data['category']=$this->GridProductModel->getSubCategorylist($categoryId,$storeId);
      }  

      //subsub category
    
     public function getSubSubCategorylist($categoryId){

        $storeId=$this->session->userdata('badmin')['BizId'];
        $data['category']=$this->GridProductModel->getSubSubCategorylist($categoryId,$storeId);
      }  

      //brand
     public function getBrandlist($categoryId){

        $storeId=$this->session->userdata('badmin')['BizId'];
        $data['category']=$this->GridProductModel->getBrandlist($categoryId,$storeId);
     }

     //get brand product dispaly
     public function getBrandlistDetails($brandId){

        $storeId=$this->session->userdata('badmin')['BizId'];
        $data['category']=$this->GridProductModel->getBrandlistDetails($brandId,$storeId);
     }

     
     //manufracture
     public function getManufacturerslist($manufracturerId){

        $storeId=$this->session->userdata('badmin')['BizId'];
        $data['category']=$this->GridProductModel->getManufacturerslist($manufracturerId,$storeId);
     }
     




    

}
?>