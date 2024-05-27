
//check if theres an localstorage value, if so, we navigate to the 
//call all APIs here

//dom, we should check first here with domcreated if localstorage value,

//when we login, we put it in local storage,then navigate it to the next page
// if we delete it
//from loging out, we remove 
//it from localstorage and refresh the page

const CLIENT_ID ='835415666408-kvam53mh54bmemcvcqobf2j51ijer6gh.apps.googleusercontent.com';

const signIn = document.getElementById('signInDiv')
const signOut = document.querySelector('.signout')

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a value in local storage
    var localStorageValue = localStorage.getItem('authInfo');

    if (!localStorageValue) {
        // If value exists, navigate to chat.html, we may not need this...
        //replace with login info...
        signOut.style.display = 'none';

    } else {
        // If value doesn't exist, stay on design.html or do something else
        signIn.style.display = 'none';
    }
    const google = window.google;

    //initliaizes the button and stuff
    google.accounts.id.initialize({
        client_id: '835415666408-kvam53mh54bmemcvcqobf2j51ijer6gh.apps.googleusercontent.com',
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback:onSignIn
      });
    google.accounts.id.renderButton(
        document.getElementById('signInDiv'),
        {theme: "outline", size: "medium"}
    )


});


function onSignIn(CredentialResponse) {
    console.log(CredentialResponse)
    //credential response is the json webtoken.
    let values = decodeJWT(CredentialResponse.credential)
    console.log(values)
    const authInfoString = JSON.stringify(values);
    localStorage.setItem('authInfo', authInfoString);


    //dosent work, since this is the 3rd party request to get token, it will take time
    /*
    const getToken = window.google.accounts.oauth2.initTokenClient({//request access token for any google API. NEEDED
        client_id:CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.events",//APIs that we want access to
        callback:(tokenResponse)=>{//function called by tokenClient.requestAccessToken();
            console.log(tokenResponse)
            
            if(tokenResponse && tokenResponse.access_token){
                localStorage.setItem('accessToken', JSON.stringify(tokenResponse));
            }
        }
        

    })
    getToken.requestAccessToken({prompt: ''});
    */
   location.href = window.location.pathname;
 }
 
 function decodeJWT(token) {
     const base64Url = token.split('.')[1];
     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
     const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
       return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
     }).join(''));
   
     return JSON.parse(jsonPayload);
   }
   
 
   function onSignout() {
    localStorage.clear('authInfo');
    localStorage.clear('accessToken');
    document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://changenow.netlify.app/";
   
 }