
<style>
    .ui-autocomplete{
        z-index: 5000;
    }
    #selectedcity,#companyid{
        display: none;
    }
    .btn{
        font-size: 10px !important;
    }

    .ui-menu-item{cursor: pointer;background: black;color:white;border-bottom: 1px solid white;width: 200px;}
  
    .loader {
        border: 16px solid #f3f3f3; /* Light grey */
        border-top: 16px solid #3498db; /* Blue */
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
    }
    .pageAdj{
        margin-top: -35px;
        padding-top: 15px;
        margin-left: -50px;
        margin-right: -50px;
    }

    .MandatoryMarker{
        color:red;
    }

        .caret{
        float: right;
        position: relative;
        right: -10px;
    }
    .form-group.pos_relative2.productNameListDiv {
    position: absolute;
    width: 100%;
    top: 40px;
    left: -4px;
}
div#productNameList {
    border: 1px solid #cacaca;
    position: relative;
    padding: 10px;
    max-height: 100px;
    overflow-y: scroll;
    position: absolute;
    width: 93%;
    z-index: 999;
    background: #fff;
    top: 40px;

}p.pData {
    cursor: pointer;
    padding: 5px;
}
p.pData:hover {
    background: #006df9;
    color: #fff;
    padding: 5px;
}
.row-same-height {
    position: relative;
}
.loader {
    border: 3px solid #f3f3f3;
    border-radius: 50%;
    border-top: 3px solid #3498db;
    width: 30px;
    height: 30px;
    -webkit-animation: spin 0.5s linear infinite;
    animation: spin 0.5s linear infinite;
    position: absolute;
    right: 7px;
    top: 2px;
}

/* Safari */
@-webkit-keyframes spin {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/*    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }*/
    
</style>

<script>

var delCatid;
 $("body").click
            (
            function(e)
            {
                console.log(e)
                if(e.target.className !== "productDropdown")
                {
                $(".productDropdown").hide();
                $('#productNameList').hide();
                }
            }
        );

$(document).ready(function (){

$(document).on('click','.fg-button',function(){
    $("#select_all").prop("checked", false);
});  

  $("body").on('click','#select_all',function(){ 
    if(this.checked){
        $('.checkbox').each(function(){
            this.checked = true;
        });
    }else{
         $('.checkbox').each(function(){
            this.checked = false;
        });
    }
});


   $("body").on('click','.checkbox',function(){ 
        if($('.checkbox:checked').length == $('.checkbox').length){
            $('#select_all').prop('checked',true);
        }else{
            $('#select_all').prop('checked',false);
        }   
   });



});

    $(document).ready(function () {
        $('.Category').addClass('active');
        var id = '';
        $('.error-box-class').keypress(function () {
            $('.error-box').text('');
        });


        $('#btnStickUpSizeToggler').click(function () {
            $("#display-data").text("");
            $("#display-data").text("");
            $('.catname').val("");
            $('#categoryError').text("");
            $('.catDescription').val("");
            $('#cat_photos').val("");
            $(".imagesProduct").css('display','none'); 
         
         
           $(".imagesProduct").css('display','none'); 


            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            if (val.length == 0) {
                $('#modalHeading').html("ADD CATEGORY");
                var size = $('input[name=stickup_toggler]:checked').val()
                var modalElem = $('#myModal');
                if (size == "mini") {
                    $('#modalStickUpSmall').modal('show')
                } else {
                    $('#myModal').modal('show')
                    if (size == "default") {
                        modalElem.children('.modal-dialog').removeClass('modal-lg');
                    } else if (size == "full") {
                        modalElem.children('.modal-dialog').addClass('modal-lg');
                    }
                }
            } else {
                $('#displayData').modal('show');
                $("#display-data").text("Invalid selection");
            }
        });


        $('#bdelete').click(function () {
            $("#display-data").text("");
            $(".modalPopUpText").text("");
            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            id = '';
            id = val;
            if (val.length < 0 || val.length == 0) {
                $('#displayData').modal('show');
                $("#display-data").text("Please select a category");
            } else if (val.length == 1 || val.length > 1)
            {
                $(".modalPopUpText").text("Do you wish to delete the selected categories ?");
                $("#display-data").text("");
                var BusinessId = val;
                var size = $('input[name=stickup_toggler]:checked').val()
                var modalElem = $('#confirmmodel');
                if (size == "mini") {
                    $('#modalStickUpSmall').modal('show')
                } else {
                    $('#confirmmodel').modal('show')
                    if (size == "default") {
                        modalElem.children('.modal-dialog').removeClass('modal-lg');
                    } else if (size == "full") {
                        modalElem.children('.modal-dialog').addClass('modal-lg');
                    }
                }
//                var condition = {MONGO_id: val};
                $("#confirmed").click(function () {

                    $.ajax({
                        url: "<?php echo base_url('index.php?/Category') ?>/operationCategory/delete",
                        type: "POST",
                        data: {val: val},
                        dataType: 'json',
                        success: function (response)
                        {

                            $('.close').trigger("click");
                            $('#big_table_processing').show();
                            var table = $('#big_table');
                            $('#big_table').fadeOut('slow');
                            var settings = {
                                "autoWidth": false,
                                "sDom": "<'table-responsive't><'row'<p i>>",
                                "destroy": true,
                                "scrollCollapse": true,
                                "iDisplayLength": 20,
                                "bProcessing": true,
                                "bServerSide": true,
                                "sAjaxSource": '<?php echo base_url() ?>index.php?/Category/operationCategory/table/' + status,
                                "bJQueryUI": true,
                                "sPaginationType": "full_numbers",
                                "iDisplayStart ": 20,
                                "oLanguage": {
                                },
                                "fnInitComplete": function () {
                                    $('#big_table').fadeIn('slow');
                                    $('#big_table_processing').hide();
                                },
                                'fnServerData': function (sSource, aoData, fnCallback)
                                {
                                    $.ajax
                                            ({
                                                'dataType': 'json',
                                                'type': 'POST',
                                                'url': sSource,
                                                'data': aoData,
                                                'success': fnCallback
                                            });
                                },
                                "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
                            };
                            table.dataTable(settings);
                        }
                    });
                });
            }

        });


    //     $(document).on('change', '.catImage', function () {

    //         console.log('clicked');
           
    //        $('#text_images1').text("");
    //        var fieldID = $(this).attr('attrId');
    //        var ext = $(this).val().split('.').pop().toLowerCase();
    //        var formElement = $(this).prop('files')[0];
    //        console.log(formElement);

    //        uploadImage(fieldID, ext, formElement);

    //    });

   

    //     function uploadImage(fieldID, ext, formElement)
    // {

    //     if ($.inArray(ext, ['jpg', 'png', 'JPEG']) == -1) {
    //         $('#errorModal').modal('show');
    //         $('.modalPopUpText').text('Please choose correct format');
    //     } else
    //     {
    //         var form_data = new FormData();
    //         var amazonPath = " http://s3.amazonaws.com"
    //         form_data.append('sampleFile', formElement);
    //         $(document).ajaxStart(function () {
    //             $(".finishbutton").prop("disabled",true)
    //            $("#loadingimg").css("display","block");
    //         });
    //         $.ajax({
    //             url: "<?php echo uploadImageLink; ?>",
    //             type: "POST",
    //             data: form_data,
    //             dataType: "JSON",

    //             beforeSend: function () {

    //             },
    //             success: function (response) {
    //                 console.log('respo----',response);
    //                 if (response.code == '200') {
                        
    //                 }
    //             },
    //             error: function () {

    //             },
    //             cache: false,
    //             contentType: false,
    //             processData: false
    //         });
    //     }
    // }

     $(document).on('change', '.catImage', function () {
           
           var fieldID = 0;
           var ext = $(this).val().split('.').pop().toLowerCase();
           var formElement = $(this).prop('files')[0];
           uploadImage(fieldID, ext, formElement);
       })

       $(document).on('change', '.editcatImage', function () {
           
           var fieldID = 1;
           var ext = $(this).val().split('.').pop().toLowerCase();
           var formElement = $(this).prop('files')[0];
           uploadImage(fieldID, ext, formElement);
       })

         function uploadImage(fieldID, ext, formElement)
        {
            if ($.inArray(ext, ['jpg', 'JPEG','png','PNG']) == -1) {
              alert("please upload .jpg image")
            } else
            {
                var form_data = new FormData();
                var amazonPath = " http://s3.amazonaws.com"
                var file_data = formElement;
                var fileName = file_data.name;
                form_data.append('OtherPhoto', file_data);
                form_data.append('type', 'uploadImage');
                form_data.append('Image', 'Image');
                form_data.append('folder', 'first_level_category');
                
                $(document).ajaxStart(function () {
                    if(fieldID < 3)
                    $("#insert").prop("disabled",true)
                    else
                    $("#editbusiness").prop("disabled",true)
                  
                });

                $.ajax({
                    url: "<?php echo base_url('index.php?/Common') ?>/uploadImagesToAws",
                    type: "POST",
                    data: form_data,
                    dataType: "JSON",
                    beforeSend: function () {
                    },
                    success: function (result) {
                        console.log('pas1');
                        if(fieldID == 0){
                            console.log('pas2');
                           $("#imagesProductImg").val(result.fileName) 
                           $(".imagesProduct").attr('src',result.fileName)
                           $(".imagesProduct").css('display','inline'); 
                        }
                        else if(fieldID == 1){
                            $("#editimagesProductImg").val(result.fileName) 
                           $(".editimagesProduct").attr('src',result.fileName)
                           $(".editimagesProduct").css('display','inline'); 
                        }
                        else if(fieldID == 2){
                            $("#iconImageLink").val(result.fileName) 
                            $("#iconImageImg").attr('src',result.fileName)
                            $("#iconImageImg").css('display','inline');
                        }
                        else if(fieldID == 3){
                           $("#EditlogoImageLink").val(result.fileName) 
                           $("#EditlogoImageImg").attr('src',result.fileName)
                           $("#EditlogoImageImg").css('display','inline'); 
                        }
                        else if(fieldID == 4){
                            $("#EditbannerImageLink").val(result.fileName) 
                            $("#EditbannerImageImg").attr('src',result.fileName)
                            $("#EditbannerImageImg").css('display','inline');
                        }
                        else if(fieldID == 5){
                            $("#EditiconImageLink").val(result.fileName) 
                            $("#EditiconImageImg").attr('src',result.fileName)
                            $("#EditiconImageImg").css('display','inline');
                        }
                        $(document).ajaxComplete(function () {
                            if(fieldID < 3)
                            $("#insert").prop("disabled",false)
                            else
                            $("#editbusiness").prop("disabled",false)
                            // $("#loadingimg").css("display","none");
                        });
                        

                    },
                    error: function () {

                    },
                    cache: false,
                    contentType: false,
                    processData: false
                });
            }
    }


        $('#insert').click(function () {
            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            if ($('#catname_0').val() == "" || $('#catname_0').val() == null)
            {
                $("#categoryError").text("Please enter the category name");
            } 
            else if ($("#imagesProductImg").val() == "" || $("#imagesProductImg").val() == null) {
                $("#categoryError").text("Please select the image");
            }
             else if (val.length == 1 || val.length > 1) {
                $('#displayData').modal('show');
                $('#display-data').text('Invalid Selection')
            } else {
                var imgUrl = '';
                var form_data = new FormData();
                var form_data1 = new FormData();
                var catname = new Array();
                var catDescription = new Array();
                var parentCatId=$('#parentCatId').val();
               
                if(parentCatId=="" || parentCatId==null){
                    parentCatId="";
                }

                $(".catname").each(function () {
                    catname.push($(this).val());
                    form_data1.append('name[]', $(this).val());
                });

                $(".catDescription").each(function () {
                    catDescription.push($(this).val());
                    form_data1.append('description[]', $(this).val());
                });

                var visibility = parseInt(1);

                form_data1.append('visibility', visibility);
                form_data1.append('parentCatId', parentCatId);
                form_data1.append('addedFrom', "store");


                var cat_photos = $("#cat_photos").val();
           

                form_data.append('type', 'uploadImage');
                form_data.append('Image', 'Image');
                form_data.append('folder', 'first_level_category');

                var imgUrl = '';
                $(document).ajaxStart(function () {
                    $("#wait").css("display", "block");
                });


           
                         imgUrl=$("#imagesProductImg").val();
                            form_data1.append('imageUrl', imgUrl);
                            $.ajax({
                                url: "<?php echo base_url('index.php?/Category/operationCategory') ?>/insert",
                                type: 'POST',
                                data: form_data1,
                                dataType: 'JSON',
                                success: function (response)
                                {
                                    $('#parentCatId').val('');
                                    if (response.msg == 1) {


                                        $('.close').trigger('click');
                                        var size = $('input[name=stickup_toggler]:checked').val()
                                        var modalElem = $('#addmodal');
                                        if (size == "mini")
                                        {
                                            $('#modalStickUpSmall').modal('show')
                                        } else
                                        {
                                            $('#addmodal').modal('show');
                                            $('.modalPopUpText').text('Category has been added successfully..');

                                        }
                                        $('#big_table_processing').show();
                                        var table = $('#big_table');
                                        $('#big_table').fadeOut('slow');
                                        var settings = {
                                            "autoWidth": false,
                                            "sDom": "<'table-responsive't><'row'<p i>>",
                                            "destroy": true,
                                            "scrollCollapse": true,
                                            "iDisplayLength": 20,
                                            "bProcessing": true,
                                            "bServerSide": true,
                                            "sAjaxSource": '<?php echo base_url() ?>index.php?/Category/operationCategory/table/0',
                                            "bJQueryUI": true,
                                            "sPaginationType": "full_numbers",
                                            "iDisplayStart ": 20,

                                            "oLanguage": {
                                            },
                                            "fnInitComplete": function () {
                                                $('#big_table').fadeIn('slow');
                                                $('#big_table_processing').hide();
                                            },
                                            'fnServerData': function (sSource, aoData, fnCallback)
                                            {
                                                $.ajax
                                                        ({
                                                            'dataType': 'json',
                                                            'type': 'POST',
                                                            'url': sSource,
                                                            'data': aoData,
                                                            'success': fnCallback
                                                        });
                                            },
                                            "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
                                        };
                                        table.dataTable(settings);


                                    } else {

                                        $('.close').trigger('click');
                                        var size = $('input[name=stickup_toggler]:checked').val()
                                        var modalElem = $('#addmodal');
                                        if (size == "mini")
                                        {
                                            $('#modalStickUpSmall').modal('show')
                                        } else
                                        {
                                            $('#addmodal').modal('show')
                                            if (size == "default") {
                                                modalElem.children('.modal-dialog').removeClass('modal-lg');
                                            } else if (size == "full") {
                                                modalElem.children('.modal-dialog').addClass('modal-lg');
                                            }
                                        }
                                        $('.modalPopUpText').text('Category already exists..');
                                    }
                                },
                                cache: false,
                                contentType: false,
                                processData: false
                            });
                     
                $(".catname").val("");
                $(".catDescription").val("");
                $("#cat_photos").val("");
                $('#myModal').hide();
            }
        });

        var editVal = '';
        $(document).on('click', '#btnedit', function () {
            $("#display-data").text("");
            $('#modalHeading').html("EDIT CATEGORY");
            editVal = $(this).val();
            
            $('#Editcat_photos').val('');

            $.ajax({
                url: "<?php echo base_url() ?>index.php?/Category/operationCategory/get",
                type: 'POST',
                data: {val: editVal},
                dataType: 'JSON',
                success: function (response)
                {
                    $.each(response, function (index, row) {
                        $('#editedId').val(row._id.$oid);

                        $('#Editcatname_0').val(row.categoryName['en']);
<?php foreach ($language as $val) { ?>
                            $('#Editcatname_<?= $val['lan_id'] ?>').val(row.categoryName['<?= $val['langCode'] ?>']);
<?php } ?>
                        $('#EditcatDescription_0').val(row.categoryDesc['en']);
<?php foreach ($language as $val) { ?>
                            $('#EditcatDescription_<?= $val['lan_id'] ?>').val(row.categoryDesc['<?= $val['langCode'] ?>']);
<?php } ?>

                        if (row.imageUrl) {
                            $('#Edit_photo').show();
                            $('#Edit_photo').attr('href', row.imageUrl);

                            $(".editimagesProduct").attr('src', row.imageUrl)
                                $(".editimagesProduct").css('display','inline'); 

                        } else
                            $('#Edit_photo').hide();
                    });
                },
            });

            var size = $('input[name=stickup_toggler]:checked').val()
            var modalElem = $('#editModal');
            if (size == "mini")
            {
                $('#modalStickUpSmall').modal('show')
            } else
            {
                $('#editModal').modal('show')
                if (size == "default") {
                    modalElem.children('.modal-dialog').removeClass('modal-lg');
                } else if (size == "full") {
                    modalElem.children('.modal-dialog').addClass('modal-lg');
                }
            }
            $("#errorboxdatas").text("Are you sure you wish to activate the category ?");

        });


        // delete category
        $(document).on('click', '#btndelete', function () {
            $('#myModalDelete').modal('show');
             delCatid   =$(this).attr('data-id');
        });
        

        $('#confirmDel').click(function(){
            val=delCatid;
            $.ajax({
                    url: "<?php echo base_url('index.php?/Category') ?>/operationCategory/delete",
                    type: "POST",
                    data: {val: val},
                    dataType: 'json',
                    success: function (response)
                    {   
                        console.log('reppp---',response)
                        location.reload();
                    }
                });
        });

        //active category
        $(document).on('click', '#btnactive', function () {
            $('#myModalActive').modal('show');
             delCatid   =$(this).attr('data-id');
        });
        

        $('#confirmActive').click(function(){
            val=delCatid;
            $.ajax({
                    url: "<?php echo base_url('index.php?/Category') ?>/operationCategory/active",
                    type: "POST",
                    data: {val: val},
                    dataType: 'json',
                    success: function (response)
                    {   
                        console.log('reppp---',response)
                        location.reload();
                    }
                });
        });



        $('#editbusiness').click(function () {

            $("#display-data").text("");
            var form_data = new FormData();
            var form_data1 = new FormData();
            var val = editVal;
            $('.editclearerror').text("");
            var editcatname = new Array();
            var editcatnameDesc = new Array();
            $(".Editcatname").each(function () {
                form_data1.append('name[]', $(this).val());
                editcatname.push($(this).val());

            });

            $(".EditcatDescription").each(function () {
                form_data1.append('description[]', $(this).val());
                editcatnameDesc.push($(this).val());

            });

            var editcatpic = $("#Editcat_photos").val();

            var file_data = $('#Editcat_photos').prop('files')[0];
            if (file_data) {
                form_data.append('cat_photos', file_data);

                var fileName = file_data.name;
                form_data.append('OtherPhoto', file_data);

                form_data.append('type', 'uploadImage');
                form_data.append('Image', 'Image');
                form_data.append('folder', 'first_level_category');
            }
            form_data1.append('editId', val);
            if ($(".Editcatname").val() == "" || $(".Editcatname").val() == null || $(".Editcatname").val() == '' || $(".Editcatname").val() == 0) {

                $("#editclearerror").text("Please enter the Category name");
            } else {

                var imgUrl = '';
                var img = '';
              
                if (file_data) {
                    $.ajax({
                        
                        url: "<?php echo base_url('index.php?/Common') ?>/uploadImagesToAws",
                        type: "POST",
                        data: form_data,
                        dataType: "JSON",
                        success: function (result) {
                            console.log('val----',result);
                            if (result) {
                                imgUrl = result.fileName;
                                form_data1.append('imageUrl', imgUrl);
                                $.ajax({
                                    url: "<?php echo base_url('index.php?/Category/operationCategory') ?>/edit",
                                    type: 'POST',
                                    data: form_data1,
                                    dataType: 'JSON',
                                    success: function (response)
                                    {
                                        window.location.reload();
                                    },
                                    cache: false,
                                    contentType: false,
                                    processData: false
                                });
                            } else {

                                alert('Problem In Uploading Image-' + result.folder);
                            }
                        },
                        cache: false,
                        contentType: false,
                        processData: false
                    });

                } else {
                    $.ajax({
                        url: "<?php echo base_url('index.php?/Category/operationCategory') ?>/edit",
                        type: 'POST',
                        data: form_data1,
                        async: true,
                        dataType: 'JSON',
                        success: function (response)
                        {
                            window.location.reload();
                        },
                        cache: false,
                        contentType: false,
                        processData: false
                    });

                }
            }
        });


        $('#hide').click(function () {
            $("#display-data").text("");
            $(".modalPopUpText").text("");
            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            id = val;
            if (val.length < 0 || val.length == 0) {
                $('#displayData').modal('show');
                $("#display-data").text("Please select a category");
            } else if (val.length == 1)
            {
                var size = $('input[name=stickup_toggler]:checked').val()
                var modalElem = $('#hideModal');
                if (size == "mini") {
                    $('#modalStickUpSmall').modal('show')
                } else {
                    $('#hideModal').modal('show')
                    if (size == "default") {
                        modalElem.children('.modal-dialog').removeClass('modal-lg');
                    } else if (size == "full") {
                        modalElem.children('.modal-dialog').addClass('modal-lg');
                    }
                }

                $(".modalPopUpText").text("Are you sure you wish to hide category");



            } else if (val.length > 1)
            {
                $('#displayData').modal('show');
                $("#display-data").text("Invalid selection");
            }

        });


        $("#btnHide").click(function () {
            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            $.ajax({
                url: "<?php echo base_url() ?>index.php?/Category/operationCategory/hide",
                type: "POST",
                data: {val: val},
                dataType: 'json',
                success: function (response)
                {
                    if (response.flag == 1) {
                        $(".close").trigger("click");
                        $('#big_table_processing').show();
                        var table = $('#big_table');
                        $('#big_table').fadeOut('slow');
                        var settings = {
                            "autoWidth": false,
                            "sDom": "<'table-responsive't><'row'<p i>>",
                            "destroy": true,
                            "scrollCollapse": true,
                            "iDisplayLength": 20,
                            "bProcessing": true,
                            "bServerSide": true,
                            "sAjaxSource": '<?php echo base_url() ?>index.php?/Category/operationCategory/table/' + status,
                            "bJQueryUI": true,
                            "sPaginationType": "full_numbers",
                            "iDisplayStart ": 20,

                            "oLanguage": {
                            },
                            "fnInitComplete": function () {
                                $('#big_table').fadeIn('slow');
                                $('#big_table_processing').hide();
                            },
                            'fnServerData': function (sSource, aoData, fnCallback)
                            {
                                $.ajax
                                        ({
                                            'dataType': 'json',
                                            'type': 'POST',
                                            'url': sSource,
                                            'data': aoData,
                                            'success': fnCallback
                                        });
                            },
                            "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
                        };
                        table.dataTable(settings);
                    } else {
                        $('#hideModal').modal('hide')
                        $('#displayData').modal('show');
                        $('#display-data').text('Category is already Hidden')

                    }
                }
            });
        });

        $('#unhide').click(function () {
            $("#display-data").text("");
            $(".modalPopUpText").text("");
            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            if (val.length < 0 || val.length == 0) {
                $('#displayData').modal('show');
                $("#display-data").text("Please select a category");
            } else if (val.length == 1)
            {
                var size = $('input[name=stickup_toggler]:checked').val()
                var modalElem = $('#unhideModal');
                if (size == "mini") {
                    $('#modalStickUpSmall').modal('show');
                } else {
                    $('#unhideModal').modal('show');
                    if (size == "default") {
                        modalElem.children('.modal-dialog').removeClass('modal-lg');
                    } else if (size == "full") {
                        modalElem.children('.modal-dialog').addClass('modal-lg');
                    }
                }
                $(".modalPopUpText").text("Are you sure you wish to unhide category");

            } else if (val.length > 1)
            {
                $('#displayData').modal('show');
                $("#display-data").text("Invalid Selection");
            }

        });

        $("#btnUnhide11").click(function () {

            var val = $('.checkbox:checked').map(function () {
                return this.value;
            }).get();
            $.ajax({
                url: "<?php echo base_url() ?>index.php?/Category/operationCategory/unhide",
                type: "POST",
                data: {val: val},
                dataType: 'json',
                success: function (response)
                {
                    if (response.flag == 1) {
                        $(".close").trigger("click");
                        $('#big_table_processing').show();
                        var table = $('#big_table');
                        $('#big_table').fadeOut('slow');
                        var settings = {
                            "autoWidth": false,
                            "sDom": "<'table-responsive't><'row'<p i>>",
                            "destroy": true,
                            "scrollCollapse": true,
                            "iDisplayLength": 20,
                            "bProcessing": true,
                            "bServerSide": true,
                            "sAjaxSource": '<?php echo base_url() ?>index.php?/Category/operationCategory/table/' + status,
                            "bJQueryUI": true,
                            "sPaginationType": "full_numbers",
                            "iDisplayStart ": 20,

                            "oLanguage": {
                            },
                            "fnInitComplete": function () {
                                $('#big_table').fadeIn('slow');
                                $('#big_table_processing').hide();
                            },
                            'fnServerData': function (sSource, aoData, fnCallback)
                            {
                                $.ajax
                                        ({
                                            'dataType': 'json',
                                            'type': 'POST',
                                            'url': sSource,
                                            'data': aoData,
                                            'success': fnCallback
                                        });
                            },
                            "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
                        };
                        table.dataTable(settings);
                    } else {
                        $('#displayData').modal('show');
                        $("#display-data").text("Category is already Unhidden");
                        $('#unhideModal').modal('hide');
                    }
                }
            });
        });

    });



    function moveUp(id) {
        var row = $(id).closest('tr');
        var prev_id = row.prev('tr').find('.moveUp').attr('id')
        var curr_id = row.find('.moveUp').attr('id');
        if (prev_id == undefined) {
            $('#displayData').modal('show');
            $('#display-data').text('Cannot reorder , Category is at the end..!!')
        } else {
            $.ajax({
                url: "<?php echo base_url() ?>index.php?/Category/operationCategory/order",
                type: "POST",
                data: {kliye: 'interchange', curr_id: curr_id, prev_id: prev_id},
                success: function (result) {

                }
            });
            row.prev().insertAfter(row);
            $('#saveOrder').trigger('click');
        }
//        });
    }
    function moveDown(id) {

        var row = $(id).closest('tr');
        var prev_id = row.find('.moveDown').attr('id');
        var curr_id = row.next('tr').find('.moveDown').attr('id');
        if (curr_id == undefined) {
            $('#displayData').modal('show');
            $('#display-data').text('Cannot reorder , Category is at the end..!!')
        } else {
            $.ajax({
                url: "<?php echo base_url() ?>index.php?/Category/operationCategory/order",
                type: "POST",
                data: {kliye: 'interchange', prev_id: prev_id, curr_id: curr_id},
                success: function (result) {

//                    alert("intercange done" + result);

                }
            });
            row.insertAfter(row.next());
            $('#saveOrder').trigger('click');
        }
//        });
    }

    function validatecat() {
        $.ajax({
            url: "<?php echo base_url() ?>index.php?/Category/operationCategory/validate",
            type: "POST",
            data: {catname: $('#catname_0').val()},
            dataType: "JSON",
            success: function (result) {
                $('#catname_0').attr('data', result.msg);

                if (result.count == true) {

                    $("#clearerror").html("Category name already exists.");
                    $('#catname_0').focus();
                    return false;
                } else if (result.count != true) {
                    $("#clearerror").html("");

                }
            }
        });
    }

   function productFill() {
        $('.loader').show();
        var pName=$('#catname_0').val();

        var countPname=pName.length;
        
        if(countPname==0){
            $('.loader').hide();
        }
        if(countPname>3){

                 $.ajax({
                    url: "<?php echo base_url('index.php?/Category') ?>/getProductsBySerach",
                    type: "POST",
                    dataType: 'JSON',
                    data: {serachData: pName},
                    success: function (response)
                    {
                        $('#productNameListDiv').show();
                         $('#productNameList').empty();
                        console.log('rel---',response)
                     
                        html = '';
                      

                          if (response.data.length !== 0)
                        {
                           
                            $.each(response.data, function (index, row) {
                                  html +='<p class="pData" id="'+ row._id.$oid+'" >'+row.name[0]+' </p>';
                                  $('#productNameList').show();
                            });
                           
                        }else{
                            $('#productNameList').hide();
                        }

                         $('#productNameList').append(html);


    $("#productNameList").on('click', '.pData' , function () {
        $('#catname_0').val($(this).text());
        var selectedId = $(this).attr('id');
        console.log('------',selectedId);
        $('#productNameList').empty();
        $('#productNameList').hide();



             
             $.ajax({


                    url:   '<?php echo base_url(); ?>index.php?/Category/getProductDataDetail/' + selectedId,
                    type: "GET",
                    data: '',                  
                    success: function (json,textStatus, xhr) {
                      
                    var dataList=JSON.parse(json);
                    var dList=dataList.data;

                     var dataList=JSON.parse(json);
                    var dList=dataList.data;
                    console.log('data----',dList)

                    // name
                    <?php foreach ($language as $val) { ?>
                          	$('#catname_<?= $val['lan_id'] ?>').val(dList.categoryName['<?= $val['langCode'] ?>']);
			        <?php } ?>
                    
                    // description
                    <?php foreach ($language as $val) { ?>
		                    $('#catDescription_<?= $val['lan_id'] ?>').val(dList.categoryDesc['<?= $val['langCode'] ?>']);
			        <?php } ?>

                    $("#catDescription_0").val(dList.categoryDesc['en']);      
                    $("#imagesProductImg").val(dList.imageUrl)                
                    $('.imagesProduct').attr('src', dList.imageUrl);
                    $('.imagesProduct').show();
                    $('#parentCatId').val(dList._id.$oid);

                                    
                    }
                });
        });

        $('.loader').hide();
                      
                    }
                });

        }
        
       
    }


</script>

<script type="text/javascript">
    $(document).ready(function () {

        var status = 1;
        if (status == 1) {
            $('#btnStickUpSizeToggler').hide();
            $('#edit').show();
            $('#bdelete').show();
        }

        $('#big_table_processing').show();
        var table = $('#big_table');
        $('#big_table').fadeOut('slow');
        var settings = {
            "autoWidth": false,
            "sDom": "<'table-responsive't><'row'<p i>>",
            "destroy": true,
            "scrollCollapse": true,
            "iDisplayLength": 20,
            "bProcessing": true,
            "bServerSide": true,
            "sAjaxSource": '<?php echo base_url() ?>index.php?/Category/operationCategory/table/' + status,
            "bJQueryUI": true,
            "sPaginationType": "full_numbers",
            "iDisplayStart ": 20,

            "oLanguage": {
            },
            "fnInitComplete": function () {
                $('#big_table').fadeIn('slow');
                $('#big_table_processing').hide();
            },
            'fnServerData': function (sSource, aoData, fnCallback)
            {
                $.ajax
                        ({
                            'dataType': 'json',
                            'type': 'POST',
                            'url': sSource,
                            'data': aoData,
                            'success': fnCallback
                        });
            },
            "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
        };
        table.dataTable(settings);
        $('#search-table').keyup(function () {
            table.fnFilter($(this).val());
        });


        $('.whenclicked li').click(function () {
            if ($(this).attr('id') == 0) {
                $('#btnStickUpSizeToggler').show();
                $('#edit').show();
                $('#bdelete').show();
            } else if ($(this).attr('id') == 2) {
                $('#btnStickUpSizeToggler').hide();
                $('#edit').hide();
                $('#bdelete').hide();
            } else {
                $('#btnStickUpSizeToggler').hide();
                $('#edit').show();
                $('#bdelete').hide();
            }
        });
        $('.changeMode').click(function () {

            var table = $('#big_table');
            $('#big_table').fadeOut('slow');
            $('#big_table_processing').show();
            var settings = {
                "autoWidth": false,
                "sDom": "<'table-responsive't><'row'<p i>>",
                "destroy": true,
                "scrollCollapse": true,
                "iDisplayLength": 20,
                "bProcessing": true,
                "bServerSide": true,
                "sAjaxSource": $(this).attr('data'),
                "bJQueryUI": true,
                "sPaginationType": "full_numbers",
                "iDisplayStart ": 20,

                "oLanguage": {
                },
                "fnInitComplete": function () {
                    $('#big_table').fadeIn('slow');
                    $('#big_table_processing').hide();
                },
                'fnServerData': function (sSource, aoData, fnCallback)
                {
                    $.ajax
                            ({
                                'dataType': 'json',
                                'type': 'POST',
                                'url': sSource,
                                'data': aoData,
                                'success': fnCallback
                            });
                },
                "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
            };
            $('.tabs_active').removeClass('active');
            $(this).parent().addClass('active');
            table.dataTable(settings);
        });
    });
    function refreshTableOnCityChange() {

        var table = $('#big_table');
        $('#big_table').fadeOut('slow');
        $('#big_table_processing').show();
        var settings = {
            "autoWidth": false,
            "sDom": "<'table-responsive't><'row'<p i>>",
            "destroy": true,
            "scrollCollapse": true,
            "iDisplayLength": 20,
            "bProcessing": true,
            "bServerSide": true,
            "sAjaxSource": $(".whenclicked li.active").children('a').attr('data'),
            "bJQueryUI": true,
            "sPaginationType": "full_numbers",
            "iDisplayStart ": 20,

            "oLanguage": {
            },
            "fnInitComplete": function () {
                $('#big_table').fadeIn('slow');
                $('#big_table_processing').hide();
            },
            'fnServerData': function (sSource, aoData, fnCallback)
            {
                $.ajax
                        ({
                            'dataType': 'json',
                            'type': 'POST',
                            'url': sSource,
                            'data': aoData,
                            'success': fnCallback
                        });
            },
            "columnDefs": [
		{  targets: "_all",
			orderable: false 
		}
],
        };
        table.dataTable(settings);
    }
</script>

<div class="page-content-wrapper"style="padding-top: 20px;">
    <!-- START PAGE CONTENT -->
    <div class="content">

        <!-- <div class="brand inline" style="  width: auto; margin-left: 8px;padding-top: 20px;">
            <strong style="color:#0090d9;font-size: 16px;">Product Category</strong>
        </div> -->

        <div class="brand inline" style="  width: auto;">
            <?php echo $this->lang->line('Product_Category'); ?>
        </div>
        <div class="panel panel-transparent ">
        <ul class="nav nav-tabs nav-tabs-fillup  bg-white whenclicked">

            <li id= "0" class="tabs_active " style="cursor:pointer">
                <a  class="changeMode" data="index.php?/Category/operationCategory/table/0"><span><?php echo $this->lang->line('Pending_Approval'); ?></span></a>
            </li>
            <li id= "1" class="active tabs_active" style="cursor:pointer">
                <a  class="changeMode" data="index.php?/Category/operationCategory/table/1"><span><?php echo $this->lang->line('Approved'); ?></span></a>
            </li>
            <!-- <li id= "3" class="tabs_active" style="cursor:pointer">
                <a  class="changeMode" data="index.php?/Category/operationCategory/table/3"><span><?php echo $this->lang->line('Rejected'); ?></span></a>
            </li>
            <li id= "4" class="tabs_active" style="cursor:pointer">
                <a  class="changeMode" data="index.php?/Category/operationCategory/table/4"><span><?php echo $this->lang->line('Banned'); ?></span></a>
            </li> -->
            <li id= "2" class="tabs_active" style="cursor:pointer">
                <a   class="changeMode" data="index.php?/Category/operationCategory/table/2"><span><?php echo $this->lang->line('Deleted'); ?></span></a>
            </li>

            <!--<div class="pull-right m-t-10 cls111"> <button class="btn btn-info " id="edit">Edit</button></div>-->
            <div class="pull-right m-t-10  cls110"> 
                <button class="btn btn-success pull-right m-t-10" id="btnStickUpSizeToggler" style="margin-top: 8px;"><?php echo $this->lang->line('Add'); ?></button>
            </div>
            <!-- <div class="pull-right m-t-10 cls111"> <button class="btn btn-danger" id="bdelete" ><span>Delete</button></a></div> -->
            <!--            <div class="pull-right m-t-10 cls111"> <button class="btn btn-warning" id="hide">Hide</button></a></div>
                        <div class="pull-right m-t-10 cls111"> <button class="btn btn-primary" id="unhide">Unhide</button></a></div>-->
        </ul>
        </div>

        <div class="parallax" data-pages="parallax">
            <div class="col-xs-12 container-fixed-lg sm-p-l-20 sm-p-r-20">
                <div class="row panel panel-transparent">
 
                    <div class="tab-content">
                        <div class="col-xs-12 container-fixed-lg bg-white">
                            <!-- START PANEL -->
                            <div class="panel panel-transparent">
                                <div class="panel-heading">
                                    <div class="error-box" id="display-data" style="text-align:center; color: red;"></div>
                                    <div class="searchbtn row clearfix pull-right" style="margin-right: 0%;">

                                        <div class="col-xs-12"><input type="text" id="search-table" class="form-control pull-right" style="text-transform: capitalize;" placeholder="<?php echo SEARCH; ?>"> </div>
                                    </div>
                                    <div class="dltbtn">
                                    </div>
                                </div>
                                &nbsp;

                                <div class="container">
                                    <div class="row clearfix">
                                        <div class="col-md-12 column">
                                            <?php echo $this->table->generate(); ?>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <!-- END PANEL -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <!-- END PAGE CONTENT -->

</div>

<div class="modal fade stick-up" id="addmodal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">

            <div class="modal-header">
                <span class="modal-title"><?php echo $this->lang->line('Success_Alert'); ?></span>
                <button type="button" class="close" data-dismiss="modal">&times;</button>

            </div>
            <div class="modal-body">
                <div class="row">

                    <div class="error-box modalPopUpText" id="boxaddmodal"><?php echo $this->lang->line('Category_added_success'); ?></div>

                </div>
            </div>

            <div class="modal-footer">
                <div class="row">
                    <div class="col-sm-4" ></div>
                    <div class="col-sm-4"></div>
                    <div class="col-sm-4" >
                        <button type="button" class="btn btn-default pull-right" id="confirmeds1" data-dismiss="modal" ><?php echo $this->lang->line('OK'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<div class="modal fade stick-up" id="hideModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">

            <div class="modal-header">
                <span class="modal-title"><?php echo $this->lang->line('Alert'); ?></span>
                <button type="button" class="close" data-dismiss="modal">&times;</button>

            </div>
            <div class="modal-body">
                <div class="row">

                    <div class="error-box modalPopUpText" id="boxhidemodal"><?php echo $this->lang->line('Category_hide'); ?></div>

                </div>
            </div>

            <div class="modal-footer">
                <div class="row">
                    <div class="col-sm-4" ></div>
                    <div class="col-sm-4"></div>
                    <div class="col-sm-4" >
                        <button type="button" class="btn btn-success pull-right" id="btnHide" data-dismiss="modal" ><?php echo $this->lang->line('Yes'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>


<div class="modal fade stick-up" id="confirmmodel" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title"><?php echo $this->lang->line('Alert'); ?></span>
                <button type="button" class="close" data-dismiss="modal">&times;</button>

            </div>
            <div class="modal-body">
                <div class="row">

                    <div class="error-box modalPopUpText" id="errorboxdata" ></div>

                </div>
            </div>


            <div class="modal-footer">
                <div class="row">
                    <div class="col-sm-4" ></div>
                    <div class="col-sm-8" >
                        <div class="pull-right m-t-10"><button type="button" data-dismiss="modal" class="btn btn-default btn-cons" id="cancel"><?php echo $this->lang->line('Cancel'); ?></button></div>
                        <button type="button" class="btn btn-primary pull-right" id="confirmed" ><?php echo $this->lang->line('Yes'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<div class="modal fade stick-up" id="unhideModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title"><?php echo $this->lang->line('Alert'); ?></span>
                <button type="button" class="close" data-dismiss="modal">&times;</button>

            </div>
            <div class="modal-body">
                <div class="row">

                    <div class="error-box modalPopUpText" id="errorboxdata" ></div>

                </div>
            </div>


            <div class="modal-footer">
                <div class="row">
                    <div class="col-sm-4" ></div>
                    <div class="col-sm-8" >
                        <div class="pull-right m-t-10"><button type="button" data-dismiss="modal" class="btn btn-default btn-cons" id="cancel"><?php echo $this->lang->line('Cancel'); ?></button></div>
                        <button type="button" class="btn btn-primary pull-right" id="btnUnhide11" ><?php echo $this->lang->line('Yes'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>




<div class="modal fade stick-up" id="confirmmodels" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom:0;">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <div class=" clearfix text-left">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="pg-close fs-14"></i>
                    </button>

                </div>

            </div>
            <br>
            <div class="modal-body">
                <div class="row">

                    <div class="error-box" id="errorboxdatas" style="font-size: large;text-align:center"><?php echo $this->lang->line('Delete'); ?></div>

                </div>
            </div>

            <br>

            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-4" ></div>
                    <div class="col-sm-4"></div>
                    <div class="col-sm-4" >
                        <button type="button" class="btn btn-default pull-right" id="confirmeds" ><?php echo $this->lang->line('Yes'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>


<div class="modal fade stick-up" id="myModal" tabindex="-1" role="dialog" aria-hidden="true">



    <div class="modal-dialog">
        <div class="modal-content">

            <div class="modal-body">
                <div class="modal-header">
                    <div class=" clearfix text-left">
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="pg-close fs-14"></i>
                        </button>

                    </div>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <span class="modal-title"><?php echo $this->lang->line('Add_Category'); ?></span>
                </div>
                <div class="modal-body">


                    <div id="Category_txt" >
                        <div class="row">
                            <div class="form-group formex">
                                <div class="frmSearch">
                                    <label for="fname" class="col-sm-4 control-label"><?php echo $this->lang->line('Name_English'); ?> <span class="MandatoryMarker">*</span></label>
                                    <div class="col-sm-6">    
                                        <input type="text"   id="catname_0" name="catname[0]" onblur="validatecat()" style="  width: 100%;line-height: 2;" class="catname form-control error-box-class" onkeyup="productFill()" >
                                        <div class="loader" style="display:none"></div>
                                        <input type="hidden" id="parentCatId" name="parentCatId">
                                         
                                             <div id="productNameList" style="display:none"></div>
                                        
                                    </div>

                                </div>
                            </div>
                        </div> 

                    <!-- dynamic -->
                     <div class="form-group pos_relative2 productNameListDiv"  >
                                        <label for="fname" class="col-sm-2 control-label error-box-class "> </label>
                                        <div class="col-sm-6 pos_relative2">

                                             <!-- <div id="productNameList" style="display:none"></div> -->
                                                                                          
                                           

                                        </div>
                                        <div class="col-sm-3 error-box redClass" id="text_name"></div>
                                    </div>

                        <?php
                        foreach ($language as $val) {
                            if ($val['Active'] == 1) {
                                ?>
                                <br/>
                                <div class="row">
                                    <div class="form-group formex">
                                        <div class="frmSearch">
                                            <label for="fname" class="col-sm-4 control-label">Name(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                            <div class="col-sm-6">
                                                <input type="text"  id="catname_<?= $val['lan_id'] ?>" name="catname[<?= $val['lan_id'] ?>]" style="  width: 100%;line-height: 2;" class="catname form-control error-box-class" >
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            <?php } else { ?>
                                <div class="row">
                                    <div class="form-group formex" style="display:none;">
                                        <div class="frmSearch">
                                            <label for="fname" class="col-sm-4 control-label">Name(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                            <div class="col-sm-6">
                                                <input type="text"  id="catname_<?= $val['lan_id'] ?>" name="catname[<?= $val['lan_id'] ?>]" style="  width: 100%;line-height: 2;" class="catname form-control error-box-class" >
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <?php
                            }
                        }
                        ?>

                    </div>

                    <br/>
                    <div class="categoryDescription">
                        <div class="row">
                            <div class="form-group" class="formex">
                                <label for="fname" class="col-sm-4 control-label"><?php echo $this->lang->line('Description_English'); ?> <span class="MandatoryMarker">*</span></label>
                                <div class="col-sm-6">
                                    <textarea type="text"  id="catDescription_0" name="catDescription[0]"  class="catDescription form-control error-box-class" style="max-width: 100%;"></textarea>
                                    <input type="hidden" id="cat_photosamz" name="cat_photosamz" value=""/>
                                </div>
                            </div>
                        </div>

                        <?php
                        foreach ($language as $val) {
                            if ($val['Active'] == 1) {
                                ?>
                                <br/>
                                <div class="row">
                                    <div class="form-group formex">
                                        <div class="frmSearch">
                                            <label for="fname" class="col-sm-4 control-label">Description(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                            <div class="col-sm-6">
                                                <textarea type="text"  id="catDescription_<?= $val['lan_id'] ?>" name="catDescription[<?= $val['lan_id'] ?>]" style="line-height: 2; max-width: 100%;" class="catDescription form-control error-box-class" ></textarea>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            <?php } else { ?>
                                <div class="row">
                                    <div class="form-group formex" style="display:none;">
                                        <div class="frmSearch">
                                            <label for="fname" class="col-sm-4 control-label">Description(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                            <div class="col-sm-6">
                                                <textarea type="text"  id="catDescription_<?= $val['lan_id'] ?>" name="catDescription[<?= $val['lan_id'] ?>]" style="line-height: 2; max-width: 100%;" class="catDescription form-control error-box-class" ></textarea>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <?php
                            }
                        }
                        ?>

                    </div>

                    <br/>
                    <div class="categoryImage">
                        <div class="row">
                            <div class="form-group" class="formex">
                                <label for="fname" class="col-sm-4 control-label"><?php echo $this->lang->line('Image'); ?><span class="MandatoryMarker"> * (max size - 2 mb)</span></label>
                                <div class="col-sm-6">
                                    <input type="file" class="form-control error-box-class catImage"  name="cat_photos" id="cat_photos"  placeholder=""></div>

                                    <input type="hidden" id="imagesProductImg" value="">

                                    <img src="" style="width: 35px; height: 35px; display: none;" class="imagesProduct style_prevu_kit">
                            </div>

                            
                        </div>
                    </div>
                    <br/>
                    <div class="modal-footer">                            
                        <div class="col-sm-6 error-box" id="categoryError"></div>

                        <div class="col-sm-6" >
                            <button type="button" class="btn btn-primary pull-right" id="insert" ><?php echo $this->lang->line('Add'); ?></button>
                            <div class="pull-right m-t-10"><button type="button" data-dismiss="modal" class="btn btn-default btn-cons" id="cancel">Cancel</button></div>
                        </div>
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="pg-close fs-14"></i>
                        </button>
                    </div>  
                </div>
                <!-- /.modal-content -->
            </div>
        </div>
    </div>
</div>





<div class="modal fade stick-up" id="editModal" tabindex="-1" role="dialog" aria-hidden="true">

    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <span class="modal-title"><?php echo $this->lang->line('Edit_Category'); ?></span>
            </div>

            <div class="modal-body">

                <input type="hidden" id="editedId" style="  width: 219px;line-height: 2;" class="form-control error-box-class"/>                       

                <div id="Category_txt" >
                    <div class="row">
                        <div class="form-group formex">
                            <div class="frmSearch">
                                <div class="col-sm-1"></div>
                                <label for="fname" class="col-sm-4 control-label"> <?php echo $this->lang->line('Name_English'); ?><span class="MandatoryMarker">*</span></label>
                                <div class="col-sm-6">    <!--<div class="col-sm-6">-->  
                                    <input type="text"   id="Editcatname_0" name="Editcatname[0]" style="line-height: 2;max-width: 100%;" class="Editcatname form-control error-box-class" >
                                </div>

                            </div>
                        </div>  
                    </div>

                    <?php
                    foreach ($language as $val) {
                        if ($val['Active'] == 1) {
                            ?>
                            <br/>
                            <div class="row">
                                <div class="form-group formex">
                                    <div class="frmSearch">
                                        <div class="col-sm-1"></div>
                                        <label for="fname" class="col-sm-4 control-label">Name (<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                        <div class="col-sm-6">
                                            <input type="text"  id="Editcatname_<?= $val['lan_id'] ?>" name="Editcatname[<?= $val['lan_id'] ?>]" style="  width: 100%;line-height: 2;" class="Editcatname form-control error-box-class" >
                                        </div>

                                    </div>
                                </div>
                            </div>


                        <?php } else { ?>
                            <div class="row">
                                <div class="form-group formex" style="display: none;">
                                    <div class="frmSearch">
                                        <div class="col-sm-1"></div>
                                        <label for="fname" class="col-sm-4 control-label">Name (<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                        <div class="col-sm-6">
                                            <input type="text"  id="Editcatname_<?= $val['lan_id'] ?>" name="Editcatname[<?= $val['lan_id'] ?>]" style="  width: 100%;line-height: 2;" class="Editcatname form-control error-box-class" >
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <?php
                        }
                    }
                    ?>

                </div>
                <br/>
                <div class="row"></div>

                <div class="categoryDescription">
                    <div class="row">
                        <div class="form-group" class="formex">
                            <div class="col-sm-1"></div>
                            <label for="fname" class="col-sm-4 control-label"><?php echo $this->lang->line('Description'); ?></label>
                            <div class="col-sm-6">
                                <textarea type="text"  id="EditcatDescription_0" name="EditcatDescription"  class=" EditcatDescription form-control error-box-class" style="max-width: 100%;"> </textarea>
                            </div>
                        </div>
                    </div>

                    <?php
                    foreach ($language as $val) {
                        if ($val['Active'] == 1) {
                            ?>
                            <br/>
                            <div class="row">
                                <div class="form-group formex">
                                    <div class="frmSearch">
                                        <div class="col-sm-1"></div>
                                        <label for="fname" class="col-sm-4 control-label">Description(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                        <div class="col-sm-6">
                                            <textarea type="text"  id="EditcatDescription_<?= $val['lan_id'] ?>" name="EditcatDescription[<?= $val['lan_id'] ?>]" style="line-height: 2; max-width: 100%;" class="EditcatDescription form-control error-box-class" ></textarea>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        <?php } else { ?> 
                            <div class="row">
                                <div class="form-group formex"  style="display: none;">
                                    <div class="frmSearch">
                                        <div class="col-sm-1"></div>
                                        <label for="fname" class="col-sm-4 control-label">Description(<?php echo $val['lan_name']; ?>) <span class="MandatoryMarker">*</span></label>
                                        <div class="col-sm-6">
                                            <textarea type="text"  id="EditcatDescription_<?= $val['lan_id'] ?>"  name="EditcatDescription[<?= $val['lan_id'] ?>]" style="line-height: 2; max-width: 100%;" class="EditcatDescription form-control error-box-class" ></textarea>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <?php
                        }
                    }
                    ?>

                </div>
                <br/>
                <div class="row"></div>
                <div class="categoryImage">
                    <div class="row">
                        <div class="form-group" class="formex">
                            <div class="col-sm-1"></div>
                            <label for="fname" class="col-sm-4 control-label"><?php echo $this->lang->line('Image'); ?><span class="MandatoryMarker">  (max size - 2 mb)</span></label>
                            <div class="col-sm-6">
                                <input type="file" class="form-control error-box-class editcatImage"  name="Editcat_photos" id="Editcat_photos" value="" placeholder="">
                                <input type="hidden" id="Edit_photos" name="Edit_photos"  class="form-control error-box-class">

                                <img src="" style="width: 35px; height: 35px; display: none;" class="editimagesProduct style_prevu_kit">
                                
                                <input type="hidden" id="editimagesProductImg" value="">

                                <!-- <a target="_blank" id="Edit_photo" name="Edit_photo" style="display:none;" href="" >view</a>  -->

                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <div class="modal-footer">
                <div class="col-sm-4 error-box" id="editclearerror"></div>

                <div class="col-sm-8" >
                    <div class="pull-right m-t-10"><button type="button" data-dismiss="modal" class="btn btn-default btn-cons" id="cancel"><?php echo $this->lang->line('Cancel'); ?></button></div>
                    <button type="button" class="btn btn-primary pull-right" id="editbusiness" ><?php echo $this->lang->line('Save'); ?></button>
                </div>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="pg-close fs-14"></i>
                </button>
            </div>

            <!-- /.modal-content -->
        </div>
        <!-- /.modal-dialog -->
    </div>  
</div>

<!--<div id="wait" style="display:none;width:100px;height:100px;border:1px solid black;position:absolute;top:50%;left:50%;padding:2px;"><img src='<?php echo base_url(); ?>pics/spinner.gif' width="64" height="64" /><br>Loading..</div>-->


<div id="myModalDelete" class="modal fade" role="dialog">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title">Alert</h4>
      </div>
      <div class="modal-body">
        <p style="font-size: 15px;">Are you sure you want to delete..?</p>
      </div>
      <div class="modal-footer">
      <button type="button" class="btn btn-default" id="confirmDel" >Ok</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>

  </div>
</div>


<div id="myModalActive" class="modal fade" role="dialog">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title">Alert</h4>
      </div>
      <div class="modal-body">
        <p style="font-size: 15px;">Are you sure you want to active..?</p>
      </div>
      <div class="modal-footer">
      <button type="button" class="btn btn-default" id="confirmActive" >Ok</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>

  </div>
</div>