$(".startDiscussion").submit(handleSubmit);

function handleSubmit(event) {

    var form = $(this);
    var url = form.attr('action');

    console.log(url);

    //add parent hidden input on reply
    //$("<input></input>");
    //attr(name="parent");
    //attr/value="other");

    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(), // serializes the form's elements.
        success: function (data) {
            console.log("success " + data);
        },
        failure: function (data) {
            $(this).addClass("discussError");
            console.log("Error could not submit form");
            console.log(data);
        }
    });

    event.preventDefault(); // avoid to execute the actual submit of the form.
}



$('.singleComment .respond').click(function (event) {
    var respond = $(this);
    var show = respond.data("showForm");
    var form = respond.siblings($('.startDiscussion'));
    //Toggle show on button press
    if (show === "show") {
        form.css("display", "none");
        respond.data("showForm", "hide");
    } else {
        //Check if it has the form under it or not
        
        if (form.length == 0) {
            var parent = respond.data("parent");

            var newForm = $(".startDiscussion").first().clone();
            newForm.prepend("<input type='hidden' name='parent' value='" + parent + "' />");
            newForm.submit(handleSubmit);
            form = newForm;
            respond.parent().append(newForm);
        }

        form.css("display", "");
        respond.data("showForm", "show");
    }


    event.preventDefault(); //*shrug* Button could do strange things
});