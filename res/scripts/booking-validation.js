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
            hour: {
                required: true,
            },
            email: {
                required: true,
                validEmail: true,
            },
            agree: 'required',
            ownAddress: 'required'
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
            hour: {
                required: 'Моля изберете час'
            },
            email: {
                required: 'E-mail адресът е задължителен',
                validEmail: 'E-mail адресът трябва да бъде валиден',
            },
            agree: 'Трябва да декларирате че сте наясно, че запазвате истински урок',
            ownAddress: 'Адресът е задължителен'
        },
        errorPlacement: function(error, element) {
            error.insertBefore(element.parent());
        },
        ignore: ":not(:visible)"
    })

    jQuery.validator.addMethod("validEmail", function(value, element) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
    })

    jQuery.validator.addMethod("lettersOnly", function(value, element) {
        return this.optional(element) || /^[A-z А-з ]+$/i.test(value);
    })
})