 $(function() {

     var cookieName = 'cookie-consent';

     if (!getCookie(cookieName)) {
         $('#cookie-consent-container').removeClass('hidden');

         $('#cookie-consent-ok').click(function() {
             // Build the expiration date string:
             var expiration_date = new Date();
             expiration_date.setFullYear(expiration_date.getFullYear() + 1);

             // Build the set-cookie string:
             cookie_string = cookieName + '=true; path=/; expires=' + expiration_date.toUTCString();
             // Create or update the cookie:
             document.cookie = cookie_string;
         });
     }

     function getCookie(cname) {
         var name = cname + "=";
         var ca = document.cookie.split(';');
         for (var i = 0; i < ca.length; i++) {
             var c = ca[i];
             while (c.charAt(0) == ' ') {
                 c = c.substring(1);
             }
             if (c.indexOf(name) == 0) {
                 return c.substring(name.length, c.length);
             }
         }
         return null;
     }

 });