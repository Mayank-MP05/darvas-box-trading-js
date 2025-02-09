YouTube Video: https://www.youtube.com/watch?v=fL0mV3jFFEI

Sample Space Selection:

https://docs.google.com/spreadsheets/d/1jPzUXCYQFwb--yO79Vx8ZGSV-uulHsPPrl5-OF03C1w/edit?gid=1080335833#gid=1080335833

One Share Analysis:

https://docs.google.com/spreadsheets/d/1_YFYePaqgC2NREV3DJgkWdcGgM4lBUpZ/edit?gid=1484801545#gid=1484801545

-------

Rules-

- Process week by week
- Very first buy order will high of prev week high
- If prev buy order exists, You will only take trade at IRLower or IRUpper
- Whenever buy order gets triggered, log it also log if it is

- First buy order
- Triggered at IRLower
- Triggered at IRUpper

- At each buy order INVESTMENT_PER_TRADE rs stocks (floors by avg price) will be bought
- For that order calculate and fille the correct values of columsn 

Buy Quantity	Investment	Total Share	Total Investment	Average Price	Target	IRLower	IRUpper	Description

Target, IRLower,IRUpper will be calcuated on Total Investment

- Target will be up 6% of avg buying price
- For each buy order - There is target, upper range, lower range variables

- Target is 1.06x of avg buying price
- Upper range is 1.0275 of avg buying price
- Lower range is 0.9725 of avg buying price

Use this constnats INVESTMENT_PER_TRADE = 5000
TARGET_MULTIPLIER = 1.06
UPPER_MULTIPLIER = 1.0275
LOWER_MULTIPLIER = 0.9725

Now write me python code for pricessing full dataset week by week 