$(function() {
    $('#booking-form').validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                lettersOnly: true
            },
            phone: {
                required: true,
                minlength: 10
            },
            agree: 'required'
        },
        messages: {
            name: {
                required: 'Името е задължително',
                minlength: 'Името трябва да съдържа поне 2 букви',
                lettersOnly: 'Името може да съдържа само букви'
            },
            phone: {
                required: 'Телефонът в задължителен',
                minlength: 'Телефонът трябва да съдържа минимум 10 цифри'
            },
            agree: 'Трябва да декларирате че сте наясно, че запазвате истински урок'
        },
        errorPlacement: function(error, element) {
            error.insertBefore(element.parent());
        }
    })

    jQuery.validator.addMethod("lettersOnly", function(value, element) {
        return this.optional(element) || /^[A-z А-з ]+$/i.test(value);
    })
})