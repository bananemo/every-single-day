$(document).ready(function() {                                                  
  $.ajax({
    method: "POST",
    url: "default",
    success : function(data) {
      alert("welcome bitch!");
    }
  });
});
