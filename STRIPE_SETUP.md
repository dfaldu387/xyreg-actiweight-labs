# Stripe Integration Setup 

This guide explains how to set up Stripe checkout for the billing page.

## Prerequisites

1. A Stripe account with API keys
2. Supabase project with Edge Functions enabled

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Stripe Dashboard Setup

1. **Create Products and Prices**:
   - Go to your Stripe Dashboard → Products
   - Create products for each plan (Starter, Professional, Business, Enterprise)
   - Set up recurring prices for each product
   - Note down the price IDs for reference

2. **Set up Webhooks**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the webhook signing secret to your environment variables

## Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy the Edge Functions**:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy verify-payment
   supabase functions deploy stripe-webhook
   ```

5. **Set environment variables for Edge Functions**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Testing

1. **Test Checkout Flow**:
   - Go to the billing page
   - Click on a plan button
   - You should be redirected to Stripe checkout
   - Complete the payment with a test card
   - You should be redirected back to the billing page with success message

2. **Test Cards**:
   - Use Stripe's test cards for testing:
     - `4242 4242 4242 4242` (Visa)
     - `4000 0000 0000 0002` (Visa - declined)
     - `4000 0025 0000 3155` (Visa - requires authentication)

## Production Considerations

1. **Update Environment Variables**:
   - Replace test keys with live keys
   - Update webhook endpoints to production URLs

2. **Security**:
   - Never expose secret keys in client-side code
   - Use environment variables for all sensitive data
   - Implement proper error handling

3. **Monitoring**:
   - Set up Stripe Dashboard alerts
   - Monitor webhook delivery in Stripe Dashboard
   - Check Supabase Edge Function logs

## Troubleshooting

1. **Checkout not working**:
   - Verify Stripe publishable key is correct
   - Check browser console for errors
   - Verify Edge Functions are deployed and accessible

2. **Webhook not receiving events**:
   - Check webhook endpoint URL is correct
   - Verify webhook secret is set correctly
   - Check Supabase Edge Function logs

3. **Plan not updating after payment**:
   - Check verify-payment function logs
   - Verify database permissions
   - Check if user/company ID is correct

## Customization

You can customize the checkout experience by modifying:

1. **Checkout Session Creation** (`create-checkout-session/index.ts`):
   - Add custom fields
   - Modify line items
   - Add metadata

2. **Success/Cancel URLs**:
   - Update URLs in `stripeService.ts`
   - Add custom success/cancel pages

3. **Plan Pricing**:
   - Update prices in `billingService.ts`
   - Modify price parsing logic

## Support

For issues with:
- **Stripe Integration**: Check Stripe documentation and logs
- **Supabase Edge Functions**: Check Supabase dashboard logs
- **Frontend Issues**: Check browser console and network tab 