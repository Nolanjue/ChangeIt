const signIn = document.getElementById('signInDiv')
const signOut = document.querySelector('.signout')
const loader = document.querySelector('.loader')
const sendButton = document.querySelector('.btn');

const google = window.google;

let token;

let userQuery = '';
let systemResponse = '';


//boilerplate auth
document.addEventListener('DOMContentLoaded', function () {
  
  var localStorageValue = localStorage.getItem('authInfo');
  token = localStorage.getItem('accessToken');

  google.accounts.id.initialize({
    client_id: '835415666408-kvam53mh54bmemcvcqobf2j51ijer6gh.apps.googleusercontent.com',
    scope: "https://www.googleapis.com/auth/calendar.events",

  });//tells which google account we are using!

  if (!localStorageValue) {

    signOut.style.display = 'none';
    alert('Sign in please!')
    location.href = 'login.html'

  } else {
    // If value doesn't exist, stay on design.html or do something else
    console.log("User is signed in!");
    signIn.style.display = 'none';

    if (!token) {


      const getToken = google.accounts.oauth2.initTokenClient({//request access token. NEEDED
        client_id: '835415666408-kvam53mh54bmemcvcqobf2j51ijer6gh.apps.googleusercontent.com',
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback: (tokenResponse) => {//function called by tokenClient.requestAccessToken();

          if (tokenResponse && tokenResponse.access_token) {
            localStorage.setItem('accessToken', JSON.stringify(tokenResponse));
          }
        }

      })
      getToken.requestAccessToken({ prompt: '' });//will run prompt, however firstly will ask permissions first
    }
  }
  google.accounts.id.renderButton(
    document.getElementById('signInDiv'),
    { theme: "outline", size: "small" }
  )
  //try catch here for token expiration


});



function onSignout() {
  localStorage.clear('authInfo');
  localStorage.clear('accessToken')
  document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5500/client/login.html";

}


function getUser() {
  const user = localStorage.getItem('authInfo');
  if (!user) {
    document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5500/client/login.html";
  }
  const parse = JSON.parse(user);
  return parse;
}







const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const input = document.getElementById('msg');

//chat event
chatForm.addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent the default form submission
  try {
    const profile = getUser();
    const query = input.value.trim();
    const id = localStorage.getItem('accessToken')
    if(!id){
      onSignout()
    }
    const access = JSON.parse(id)
    const final_value = access.access_token

    let usermsg = sendMessage(profile, query);
    //to stop user from spamming inputs

    input.disabled = true
    input.style.opacity = 0.5;
    sendButton.style.display = 'none';
    loader.style.display = 'block';

    console.log(query, final_value)
    //call API
    const modelResponse =  await fetch('http://localhost:3000/getLLM', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, final_value})
  }).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
});
    const response = JSON.stringify(modelResponse)
    console.log(response)
    if (!response["response"]) {

      sendMessage({ name: "Bob " }, response);
    }
    else if (response.error) {

      sendMessage({ name: "Bob " }, (response.error ? response.error : response["response"] ))//if theres an error here
    }
    else {
      console.log(response["response"])
      sendMessage({ name: "Bob " }, response["response"] )//if we did successfully, but user input failed

    }
  }
  catch (error) {
    console.log(error)
  }
  finally {
    input.disabled = false;
    input.style.opacity = 1;
    loader.style.display = 'none';
    sendButton.style.display = 'block';
  }


});












/*
async function getEvent(eventId, accessToken) {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching event: ${response.statusText}`);
    }

    const eventData = await response.json();
    console.log('Event data:', eventData);
    return eventData;
  } catch (error) {
    console.error('Error:', error.message);
    throw error; // Re-throw the error for further handling
  }
}
*/




function sendMessage(user, message) {
  let msg = message;//changed this from input.value.trim()
  console.log(user.name)
  if (!msg) {
    return false;
  }
  console.log(msg);
  outputMessage({
    username: user.name, // Replace with actual username if available
    time: new Date().toLocaleTimeString(), // Replace with actual time if available
    text: msg
  }, user.name);
  // Clear input field and focus it again
  input.value = '';
  input.focus();
  return msg;
}


function outputMessage(message, type) {
  const div = document.createElement('div');
  div.classList.add('message');

  /*
  if (type != 'Bob') {
    div.classList.add('message');
  }
  else{
    div.classList.add('othermessage');
    
  }
  */
  const textParagraph = document.createElement('p');
  textParagraph.classList.add('text-value');
  textParagraph.innerText = message.text;
  //to avoid XSS
  const metaParagraph = document.createElement('p');
  metaParagraph.classList.add('meta');
  metaParagraph.innerText = `${message.username} `;

  const timeSpan = document.createElement('span');
  timeSpan.innerText = message.time;

  metaParagraph.appendChild(timeSpan);
  div.appendChild(textParagraph);
  div.appendChild(metaParagraph);

  document.querySelector('.chat-messages').appendChild(div);

}



