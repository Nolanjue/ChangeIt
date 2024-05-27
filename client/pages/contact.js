document.getElementById('contact-form').addEventListener('submit',  async function(event) {
    event.preventDefault();
    const formData = new FormData(this);

    console.log(formData)

    // Convert FormData to a dictionary-like object
    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    console.log(formObject);

    // Extract individual values
    const user_name = formObject.user_name;
    const user_email = formObject.user_email;
    const message = formObject.message;

    await fetch('https://changeit-production.up.railway.app/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'  // Set the content type to JSON
      },
      body: JSON.stringify({user_name, user_email, message})//converts to JSON object

    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      alert("Thank you for your message!");


      // You can redirect the user to a thank you page or clear the form here
      location.href = window.location.pathname;
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred, please try again later.');
    });
  });