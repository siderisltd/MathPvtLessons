$(function() {
    var localStorageKey = 'mathLessonBookingDetails';

    if (typeof(localStorage) !== typeof(undefined)) {
        var detailsJson = localStorage.getItem(localStorageKey);

        if (detailsJson) {
            var details = JSON.parse(detailsJson);

            $('#name').val(details.name);
            $('#phone').val(details.phone);
            $('#lessonClass').val(details.lessonClass);
            $('input[value="' + details.address + '"]').prop('checked', true);
        }
    }

    $('#booking-form').submit(function() {
        if ($(this).valid()) {
            if (typeof(localStorage) !== typeof(undefined)) {
                var name = $('#name').val();
                var phone = $('#phone').val();
                var lessonClass = $('#lessonClass').val();
                var address = $('input[name="address"]:checked').val();

                var details = {
                    name: name,
                    phone: phone,
                    lessonClass: lessonClass,
                    address: address
                }

                var detailsJson = JSON.stringify(details);

                localStorage.setItem(localStorageKey, detailsJson);
            }
        }
    });
});