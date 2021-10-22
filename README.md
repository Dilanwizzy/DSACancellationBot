<h1>DVSA Cancellation Bot</h1>

<p>I created this bot to help me find available time slots so I can book my driving test. I have used Driving Test Now and I found it wasn't that great especially as majority of centres are booked and people are using the app themselves. Also, it is very limiting of only allowing 3 centres.</p>

<h2>Getting started</h2>

<h3>Prerequisites</h3>

- Nodejs (Tested on Node12)
- docker
- yarn or npm
- Captcha services such as (2captcha). Please note I have only tested on 2Captcha
- SMTP (Optional)


There's two ways of running the application. 
1. Is by ``npm run start:dev ``, ``yarn start:dev``. Or you can first build ``npm run build:prod`` and then ``npm run start:prod`` (same with yarn)
2. Running the application in Docker a container

The first option can work on a normal 64bit computer (Intel or AMD) and DOES NOT WORK ON arm processors such as a raspberry pi.
Puppeteer version of chromium does not support arm processors. So, you will have to run it on Docker.


<h3> Configuartion </h3>

1. The main root of the application there's a **configuaryion.json** file. In there add the names of the centres you want the application to book for - Please make sure the names are **exactly** how they are on the DVSA site.
2. Add the times it should look for. The times are in 24Hours and its only the hours not the minutes. E.g I have added 11, 12, 13, 14, 15. So, the bot will book anytime within those hours. 11:32, 11:03, 12:04, etc ... If left empty it will book any time. 
3. Add the months you want.
4. Copy the .env-example and rename to .env
5. Add your details I will explain each one below

``PORT`` The port the server runs on
``JWT_SECRET_KEY`` If you want authentication then set a secret key for encrypting and decoding JWT tokens.
``JWT_EXPIRATION_TIME=3600`` JWT token expirition. Can be left as is
``POSTGRES_HOST`` The ip/url postgres is run on. Left on localhost (default)
``POSTGRES_PORT`` Postgres port. Left on 5432 (default)
``POSTGRES_USER`` postgres user
``POSTGRES_PASSWORD`` postgres password

``CAPTCHA_API_KEY`` Captcha key use to send off captchas (Your 2captcha key)
``PARALLEL_TASKS`` How many instances of puppeteer it will run. **I would recommend to be set to 1 or 2. 3 is also viable**, anything more seems to cause frequent errors. If you are not using proxies then I will stick to a max of 2 as after a certain amount of requests DVSA stops you from searching for available times.

``LICENSE_NUMBER`` Your licence number on your provisional.
``REFERENCE_NUMBER`` The booking confirmation reference number.

``SMTP_USERNAME`` Your SMTP details for email sending
``SMTP_PASSWORD``
``SMTP_HOST``
``SMTP_PORT``
``SMTP_SECURE`` Use secure connection - defaults to false

``EMAIL`` The address it will send emails to
``ENABLE_EMAIL`` Enables being able to send emails. Must setup SMTP

#### Quick Explaination - For better understanding

- The bot runs from 6:00 - 23:00 these are the times where the DVSA service is available and this done through **nestjs scheduler**. You can find the code under ``src/app.service.ts``. I have also added a fail safe. I unitintially introduced a bug and I found the bot was failing and each time it accessed the site it was presented with a captcha. As you can imagine within 1 hour it sent off about 200 captchas to 2captcha and my ip got banned from DVSA. The bug has been resolved. But the fail safe remains for potential issues.
- Once the application fails 3 times in less than 3 minutes then something went wrong and the bot stops spawning clusters until server is restarted. Added this due to that uintential bug


#### Bookings

The bot will book centres and dates you specified. However, under ``/src/helpers/constants/helpers`` there is a function called ``pickTheBestDate()`` and this has the logic of the date it will pick. Please read the comments to under what is happening

<h3> (1) Starting and running the application </h3>
--

If you want to run it normally follow these steps



