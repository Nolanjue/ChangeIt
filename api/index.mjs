import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer'





dotenv.config();

const app = express();
const port = process.env.PORT;


//parse json bodies easily...
app.use(express.json());
const corsOptions = {
  origin: 'https://changenow.netlify.app',
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
const apiKey = process.env.OPENAI_API_KEY;

async function getLLM(query) {
  const userQuery = query;
  const systemMessage = {
    role: "system",
    content: `
            Your name is Bob.AI and your mission is to help the person save time by doing the action they ask you to. 
            I want you to choose what the user wants based on the query provided by the user. 

            Heres the needed info on all possible actions you can do:

            For each function, you must:
            -make sure mandatory values are not null
            -do the neccessary conversions like the date and time given to you, and make sure they make sense!
            -fill every key to the best of your ability, but leave null for values given in sample inputs if the values are not given in the query 
            -use the matching sample input with all the query values filed in as your output dictionary , the structure must be the same!!


            **If the user wants a zoom meeting: 
            you must use the "getZoom()" function,
            mandatory values that cant be  null: (summary, description, day, time, timeZone, and people), 

            **if the user wants to create a google calendar meeting:
            you must use the "getCalendar()" function
            Mandatory values that cant be null: 
            (summary(title), start, end, description),
      
            Here is the sample input that you need to replace ALL values with the data of the user query.
            {
              response: {your AI response here},
              function: {function chosen},
              params:{
                summary: "Google I/O 2024",
                location: "800 Howard St., San Francisco, CA 94103",
                description: "A chance to hear more about Google\'s developer products.",
                start: {
                  dateTime: "2024-05-28T09:00:00-07:00",
                  timeZone: "America/Los_Angeles"
                },
                end: {
                  dateTime: "2024-05-28T17:00:00-07:00",//if not given, make it an hour later than start time by default!
                  timeZone: "America/Los_Angeles"
                },
                recurrence: [
                  RRULE:"FREQ=DAILY;COUNT=2"
                ],
                attendees: [
                  { email: "lpage@example.com" },
                  { email: "sbrin@example.com" }
                ],
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: "email", minutes: "1440" },
                    { method: "popup", minutes: "10"}
                  ]
                }
              }
            }
            
           
            Here is the User's context for you to be able to fill in the mandatory parameters:
            The current day is ${new Date().toLocaleDateString()} and time is ${new Date().toLocaleTimeString()}, you must use this exact information to determine dates!
            The current time zone is 'America/Los_Angeles'

            If they specify vague information, you must infer data, and give the most reasonable value possible based on the User's query
            
            Some possible examples:
            If there’s completely irrelevant information, say so in the response key what your purpose is to the user 
           
            if they ask a question, give your response in the response key if you believe it to be related to anything with business.
            
            please note even if they have all the required parameters, specify what other parameters they can have added in the response key!
            `
  };
  /*right before context i would add:
   Here is the past record of the conversation:
            ${tempConvo}
            */

  const userMessage = {
    role: "user",
    content: `The given user query: ${userQuery}`
  };

  const messages = [systemMessage, userMessage];

  console.log(messages);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: messages,
        max_tokens: 1200,
      })
    });

    const data = await response.json();
    console.log(data.choices[0].message.content);

    const dict = getDictionary(data.choices[0].message.content);

    if (dict.error || !dict["response"]) {
      return data.choices[0].message.content;
    } else {
      return dict;
    }
  } catch (error) {
    return { 'error': error.toString() };
  }
}

function getDictionary(prompt) {
  try {
    const startIndex = prompt.indexOf('{');

    let endingBracketsCount = 0;
    let dictionary;

    for (let i = startIndex; i < prompt.length; i++) {
      if (prompt[i] === '{') {
        endingBracketsCount++;
      } else if (prompt[i] === '}') {
        endingBracketsCount--;

        if (endingBracketsCount === 0) {
          dictionary = prompt.substring(startIndex, i + 1);
          break;
        }
      }
    }

    return JSON.parse(dictionary);
  } catch (error) {
    return { 'error': error.toString() };
  }
}


async function getData(response, access_token) {
    let returnValue;
    try {
      switch (response["function"]) {//needs to match the exact string type
        case 'getCalendar':
        case 'getCalendar()':
          console.log('made calendar:')
          returnValue = await makeCalendar(response['params'], access_token);
          return returnValue;
        case 'getZoom':
        case 'getZoom()':
          break;
      }
    }
    catch (error) {
      return { 'error': error.toString() };
    }
  }
  
  async function makeCalendar(event, access_token) {
    //parameter with values here.
    //probably add values we need here to NOT be null! We need to check these, else we return a response only
    //if we do have all the values we need, we can return response + link needed
    try {
  
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          return 'error here from making a google calendar! Please log in again!'
        } else {
          throw new Error(`Error creating event: ${data.error.message}`);
        }
      }
  
  
      const eventData = await response.json();
  
      console.log('Event created: ' + eventData.htmlLink);
  
      return 'Check your Google Calendar!, Event created:' +  eventData.htmlLink
      //store the id with the eventData body in a list called "past event list", we will use this to save it
    } catch (error) {
      console.log('Error: ' + error.toString());
      return { 'error': error.toString() };
    }
  }
  



app.post('/getLLM', async (req, res) => {
  const { query, final_value} = req.body;

 
  console.log(query)
  if (!final_value) {
    return res.status(400).json({ error: 'authentication is required' });
  }

  const result = await getLLM(query);
  console.log(result)
  const data = await getData(result, final_value);
  if(!data){
    console.log('done', result)
    return res.json(result)
  }
  //console.log('done', result["response"] + data)
  return res.json((result["response"] ? result["response"] : result)+ (data ? data : ""))
});


app.post('/send-email', async(req, res) => {
  const { user_name, user_email, message } = req.body;
  // Create transporter object using SMTP transport

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.PASS
    }
  });

  // Email content
  const mailOptions = {
    from: user_email,
    to: process.env.GMAIL,
    subject: 'ChangeIt message',
    text: `Name: ${user_name}\nEmail: ${user_email}\nMessage: ${message}`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent:', info.response);
      res.status(200).send('Email sent successfully');
    }
  });
});

app.get('/',(req,res)=>[
    console.log('test')
])

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});