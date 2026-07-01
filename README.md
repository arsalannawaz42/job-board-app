# DailyJobsPK — Simple Job Board

Aap yahan se daily jobs post kar saktay hain (kisi bhi bank/company ki job ka link + detail), aur log yahan se dekh ke "Apply Now" par click karke official page par apply karenge.

## Chalane ka tareeka

1. Node.js install karein (agar nahi hai): https://nodejs.org
2. Terminal mein:
   ```
   cd job-board
   npm install
   npm start
   ```
3. Browser mein kholein:
   - Website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

## Admin Password

Default password: `myjobs123`

**Ise change karein!** `server.js` file kholein aur ye line dhoondein:
```js
const ADMIN_PASSWORD = "myjobs123";
```
Apna khud ka strong password rakhein.

## Job kaise add karein

1. `/admin.html` par jayein
2. Upar password box mein password likhein
3. Job title, company, location, last date, description, aur **apply link** (jese Bank/company ki official job posting ka URL) daal ke "Job Add Karein" dabayein
4. Job foran homepage par nazar aa jayegi

## Naye Pages (AdSense ke liye)

Website mein ab ye 3 zaroori pages bhi add ho gaye hain — Google AdSense inke bina application reject kar deta hai:

- `about.html` — About Us
- `contact.html` — Contact Us
- `privacy.html` — Privacy Policy

**Zaroori:** `contact.html` mein abhi placeholder email (`contact@dailyjobspk.com`) daala gaya hai — ise apni asli email se replace kar dein. Isi tarah `privacy.html` mein bhi jahan "DailyJobsPK" likha hai, agar aap website ka naam change karein to yahan bhi update kar lein.

## Income kaise generate karein (Monetization)

1. **Google AdSense**: Apni website ko live karne ke baad AdSense account bana ke apply karein (adsense.google.com). Approve hone ke baad `index.html` mein jahan "Ad space" likha hai wahan apna AdSense code paste karein.
2. **Traffic**: Jitni zyada aur fresh jobs aap daily post karenge, utna zyada log aayenge (log daily naukri check karne aate hain) — is se ads ki earning barhti hai.
3. Baad mein chahen to **sponsored job posts** (companies se paise le kar unki job feature karna) bhi kar saktay hain.

## Website ko live/online kaise karein

Filhaal ye sirf aapke computer par chal rahi hai (localhost). Duniya ke liye live karne ke liye:

1. Code ko GitHub par upload karein
2. **Render.com** ya **Railway.app** par free/cheap hosting le kar deploy karein (ye Node.js apps ko free mein host karte hain)
3. Ek domain kharidein (e.g. dailyjobspk.com) — Namecheap ya koi local provider se
4. Domain ko hosting se connect karein

Jab live karne ka waqt aaye, mujhe bata dein — main deployment mein step-by-step madad kar dunga.

## Zaroori: Copyright/Legal note

Jobs post karte waqt sirf **official facts** (title, company, location, deadline, apply link) use karein aur seedha official source ka link dein. Kisi company/bank ki job posting ka poora matn (text) copy-paste na karein — sirf apne alfaz mein short summary likhein, aur apply link se official page par bhejein. Isse legal masla nahi hoga aur log bharosa bhi karenge.
