# Set up Resend sender address and add it to Supabase

This is a setup guide for you to follow. No app changes are needed.

## 1. Create your Resend key
1. Sign up at resend.com.
2. Go to **API Keys**, then **Create API Key**. Give it "Sending access" and copy the key. It starts with `re_`.

## 2. Get a sender address
- **To test right away:** use `RemitShip <onboarding@resend.dev>`. This address only sends to the email you signed up to Resend with.
- **To email real customers:** you need your own domain, such as remitship.com. A `.vercel.app` address can't be used.
  1. In Resend, go to **Domains**, then **Add Domain**.
  2. Copy the DNS records Resend shows you (MX, SPF and DKIM) into your domain provider's DNS settings.
  3. Click **Verify** and wait until it says Verified.
  4. Your sender is then something like `RemitShip <notifications@remitship.com>`.

## 3. Add the settings to Supabase
In the Supabase Dashboard, open project **remitship**, go to **Edge Functions**, then **Secrets**, then **Add new secret**, and add each setting below:

| Name | Value |
|---|---|
| RESEND_API_KEY | your `re_...` key |
| RESEND_FROM_EMAIL | `RemitShip <onboarding@resend.dev>` (or your own domain address) |
| PUBLIC_SITE_URL | `https://remitship.vercel.app` |
| SUPPORT_EMAIL | your support inbox |
| EMAIL_TEST_MODE | `true` while testing |
| EMAIL_TEST_RECIPIENT | your own Resend signup email |

When your domain is verified, change EMAIL_TEST_MODE to `false` so real customers start getting emails.

## 4. Optional: delivery confirmations
In Resend, go to **Webhooks**, then **Add Endpoint**:
- URL: `https://xkgivujyqanxaaiagovf.supabase.co/functions/v1/resend-notification-webhook`
- Events: delivered, bounced, complained
- Copy the signing secret and add it in Supabase as **RESEND_WEBHOOK_SECRET**.

## 5. Test
Create a test shipment with a recipient email, then change its status. Check the email arrives, and check that it shows as "Accepted by Resend" on the Notifications page in the staff portal.
