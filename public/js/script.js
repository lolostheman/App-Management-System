function submit_form(){
    var form = document.getElementById("search_form").onkeydown = function(e){
        if(e.which === 13){
            form.submit();
        }
    }    
}