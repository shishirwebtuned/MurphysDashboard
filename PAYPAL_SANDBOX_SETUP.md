# 🧪 PayPal Sandbox Setup Guide

## Why You're Getting the Error

You're trying to use your **REAL Nepali PayPal account** in the **SANDBOX (testing) environment**. 

- ❌ Real PayPal accounts **DO NOT WORK** in sandbox
- ✅ You need **FAKE test accounts** created in PayPal Developer Dashboard

---

## 📝 Create Sandbox Test Accounts (5 minutes)

### Step 1: Login to PayPal Developer Dashboard
1. **Go to:** https://developer.paypal.com/dashboard/
2. **Login** with your real PayPal account (Nepali account is fine for this)
3. If you don't have a PayPal account, create one first at https://www.paypal.com

### Step 2: Create a Test BUYER Account
1. In the dashboard, click **"Testing Tools"** → **"Sandbox Accounts"**
2. Click **"Create Account"** button
3. Fill in the form:
   - **Account Type:** `Personal` (this is the buyer/customer)
   - **Country:** `United States` (important - use US for USD testing)
   - **Email:** Will be auto-generated (like `sb-xxxxx@personal.example.com`)
   - **Password:** Will be auto-generated (or set your own)
   - **Balance:** `Add $500.00` (give it test money)
4. Click **"Create"**

### Step 3: Get Test Account Login Details
1. In the sandbox accounts list, find your new **Personal** account
2. Click the **"..."** menu (three dots) → **"View/Edit Account"**
3. You'll see:
   - **Email:** `sb-xxxxx@personal.example.com` (copy this)
   - **System Generated Password:** Click "Show" to see it (copy this)
   - **OR set your own password** in the "Account Details" tab

### Step 4: Save These Credentials
```
SANDBOX TEST BUYER ACCOUNT
Email: sb-xxxxx@personal.example.com
Password: [the password you saw/set]
Balance: $500.00 USD
```

---

## 🧪 How to Test Payments

### On Your Website:
1. Click "Pay with PayPal" button
2. PayPal popup opens
3. **STOP! Don't use your real account!**
4. **Use the SANDBOX test account credentials:**
   - Email: `sb-xxxxx@personal.example.com`
   - Password: `[test account password]`
5. Complete the payment
6. ✅ Payment will succeed!

---

## 💰 Where Does the Money Go?

When testing in SANDBOX:
- **Money is FAKE** - it's just for testing
- **No real money is charged**
- The payment goes to your **Business Sandbox Account**
- You can see it in PayPal Developer Dashboard → Sandbox Accounts

---

## 🌍 Why Not Nepal/Other Countries?

PayPal sandbox works best with **US-based test accounts** because:
- USD is the most supported currency
- Some countries have restrictions in sandbox
- US accounts have all features enabled

**For Production (Real Payments):**
- You can use your real Nepali account
- Or create a business account for any country
- Just switch to LIVE credentials (not sandbox)

---

## 🔄 Quick Reference

| Environment | Accounts | Money | Login |
|------------|----------|-------|-------|
| **SANDBOX** (Testing) | Fake test accounts from Developer Dashboard | FAKE money | sb-xxxxx@personal.example.com |
| **PRODUCTION** (Live) | Real PayPal accounts | REAL money | Your real email |

**Current Setup:** You are in SANDBOX mode (testing), so use FAKE test accounts!

---

## ✅ Next Steps

1. ✅ Create sandbox test account (steps above)
2. ✅ Close the current PayPal error page
3. ✅ Go back to your billing page
4. ✅ Click "Pay with PayPal" again
5. ✅ Login with **sandbox test account** (sb-xxxxx@personal.example.com)
6. ✅ Complete payment
7. 🎉 Success!

---

## 🆘 Still Having Issues?

If the test account doesn't work:
1. Make sure you created a **Personal** account (not Business)
2. Make sure country is **United States**
3. Make sure it has **balance** ($500+)
4. Try creating a new test account
5. Make sure you're using the **correct password** from the dashboard

---

## 📞 Need Help?

Check PayPal's official guide:
https://developer.paypal.com/api/rest/sandbox/accounts/
