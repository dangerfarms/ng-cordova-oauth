(function() {
  'use strict';

  angular.module('oauth.google', ['oauth.utils'])
    .factory('$ngCordovaGoogle', google);

  function google($q, $http, $cordovaOauthUtility) {
    return { signin: oauthGoogle };

    /*
     * Sign into the Google service
     *
     * @param    string clientId
     * @param    array appScope
     * @param    object options
     * @return   promise
     */
    function oauthGoogle(clientId, appScope, options) {
      var deferred = $q.defer();
      if(window.cordova) {
        if($cordovaOauthUtility.isInAppBrowserInstalled()) {
          var redirect_uri = "http://localhost/callback";
          var DEFAULT_RESPONSE_TYPE = "token id_token";
          var response_type = DEFAULT_RESPONSE_TYPE;
          if(options !== undefined) {
            if(options.hasOwnProperty("redirect_uri")) {
              redirect_uri = options.redirect_uri;
            }
            if(options.hasOwnProperty("response_type")) {
              response_type = options.response_type;
            }
          }
          var urlSplitChar = (response_type === DEFAULT_RESPONSE_TYPE) ? '#' : '?';
          var browserRef = window.cordova.InAppBrowser.open('https://accounts.google.com/o/oauth2/auth?client_id=' + clientId + '&redirect_uri=' + redirect_uri + '&scope=' + appScope.join(" ") + '&approval_prompt=force&response_type=' + response_type, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener("loadstart", function(event) {
            if((event.url).indexOf(redirect_uri) === 0) {
              browserRef.removeEventListener("exit",function(event){});
              browserRef.close();
              var callbackResponse = (event.url).split(urlSplitChar)[1];
              var responseParameters = (callbackResponse).split("&");
              var parameterMap = [];
              for(var i = 0; i < responseParameters.length; i++) {
                parameterMap[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
              }

              if (parameterMap.code !== undefined && parameterMap.code !== null) {
                deferred.resolve({ code: parameterMap.code });
              }
              else if(parameterMap.access_token !== undefined && parameterMap.access_token !== null) {
                deferred.resolve({ access_token: parameterMap.access_token, token_type: parameterMap.token_type, expires_in: parameterMap.expires_in, id_token: parameterMap.id_token });
              } else {
                deferred.reject("Problem authenticating");
              }
            }
          });
          browserRef.addEventListener('exit', function(event) {
            deferred.reject("The sign in flow was canceled");
          });
        } else {
          deferred.reject("Could not find InAppBrowser plugin");
        }
      } else {
        deferred.reject("Cannot authenticate via a web browser");
      }
      return deferred.promise;
    }
  }

  google.$inject = ['$q', '$http', '$cordovaOauthUtility'];
})();
