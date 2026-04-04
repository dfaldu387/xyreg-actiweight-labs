import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-INVOICE-PDF] ${step}${detailsStr}`);
};

// Function to generate custom PDF for trial invoices
const generateTrialInvoicePDF = async (invoice: any, subscription: any, planAmount: number) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false) => {
    page.drawText(text, {
      x,
      y: height - y,
      size: fontSize,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };
  
  // Helper function to draw lines
  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness: number = 1) => {
    page.drawLine({
      start: { x: x1, y: height - y1 },
      end: { x: x2, y: height - y2 },
      thickness,
      color: rgb(0.2, 0.2, 0.2),
    });
  };
  
  // Header section
  addText("INVOICE", 50, 50, 28, true);
  
  // Invoice details (left side)
  addText(`Invoice #: ${invoice.number || invoice.id}`, 50, 90, 12);
  addText(`Date: ${new Date(invoice.created * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 50, 110, 12);
  addText(`Due Date: ${new Date(invoice.created * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 50, 130, 12);
  
  // Company info (right side)
  addText("Arnar sandbox", width - 200, 50, 18, true);
  addText("United States", width - 200, 75, 12);
  
  // Draw header separator line
  drawLine(50, 160, width - 50, 160, 2);
  
  // Bill To section
  addText("Bill To:", 50, 190, 14, true);
  addText(invoice.customer_name || "Customer", 50, 210, 12);
  addText(invoice.customer_email || "", 50, 230, 12);
  
  // Trial notice box
  const boxY = 280;
  const boxHeight = 80;
  
  // Draw trial notice background
  page.drawRectangle({
    x: 50,
    y: height - boxY - boxHeight,
    width: width - 100,
    height: boxHeight,
    borderColor: rgb(0.8, 0.4, 0.4),
    borderWidth: 2,
    color: rgb(1, 0.95, 0.95),
  });
  
  addText("TRIAL PERIOD INVOICE", 60, boxY + 20, 16, true);
  addText("This invoice shows the plan value for informational purposes.", 60, boxY + 40, 11);
  addText("No payment is due during the trial period.", 60, boxY + 60, 11);
  
  // Items table header
  const tableY = 400;
  addText("Description", 50, tableY, 12, true);
  addText("Period", 300, tableY, 12, true);
  addText("Amount", width - 100, tableY, 12, true);
  
  // Draw table header line
  drawLine(50, tableY + 20, width - 50, tableY + 20);
  
  // Line item
  const description = subscription.items.data[0]?.price.nickname || "Professional Plan";
  const amount = (planAmount / 100).toFixed(2);
  
  addText(`Trial period for ${description}`, 50, tableY + 50, 12);
  
  // Trial period dates
  if (subscription.trial_start && subscription.trial_end) {
    const trialStart = new Date(subscription.trial_start * 1000).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const trialEnd = new Date(subscription.trial_end * 1000).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    addText(`${trialStart} - ${trialEnd}`, 300, tableY + 50, 12);
  }
  
  addText(`$${amount}`, width - 100, tableY + 50, 12);
  
  // Draw item separator line
  drawLine(50, tableY + 80, width - 50, tableY + 80);
  
  // Totals section
  const totalsY = tableY + 120;
  const totalsStartX = width - 200;
  
  addText("Subtotal:", totalsStartX, totalsY, 12);
  addText(`$${amount}`, width - 100, totalsY, 12);
  
  addText("Trial Discount:", totalsStartX, totalsY + 25, 12);
  addText(`-$${amount}`, width - 100, totalsY + 25, 12);
  
  // Draw totals separator
  drawLine(totalsStartX, totalsY + 45, width - 50, totalsY + 45);
  
  addText("Total:", totalsStartX, totalsY + 65, 14, true);
  addText("$0.00", width - 100, totalsY + 65, 14, true);
  
  addText("Amount Due:", totalsStartX, totalsY + 90, 12, true);
  addText("$0.00", width - 100, totalsY + 90, 12, true);
  
  // Footer
  const footerY = height - 100;
  addText("Thank you for your business!", 50, footerY, 12);
  addText("Questions? Contact us at support@arnar.com", 50, footerY + 20, 10);
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { invoiceId } = await req.json();
    if (!invoiceId) throw new Error("Invoice ID is required");
    logStep("Invoice ID received", { invoiceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    
    // Find customer by email to verify ownership
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("Customer not found");
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get the invoice and verify it belongs to this customer
    const invoice = await stripe.invoices.retrieve(invoiceId);
    
    if (invoice.customer !== customerId) {
      throw new Error("Invoice does not belong to this customer");
    }
    
    logStep("Invoice verified", { invoiceId: invoice.id, customerId: invoice.customer });

    // Fetch subscription details if this is a subscription invoice
    let subscription = null;
    let isTrialInvoice = false;
    let planAmount = 0;
    
    if (invoice.subscription) {
      subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      logStep("Subscription retrieved", { subscriptionId: subscription.id, status: subscription.status });
      
      // Check if this is a trial invoice (amount is 0 but subscription has a price)
      if (invoice.amount_paid === 0 && invoice.total === 0 && subscription.status === 'trialing') {
        isTrialInvoice = true;
        // Get the plan amount from subscription items
        if (subscription.items.data.length > 0) {
          planAmount = subscription.items.data[0].price.unit_amount || 0;
        }
        logStep("Trial invoice detected", { planAmount, isTrialInvoice });
      }
    }

    // Handle trial invoices with custom PDF
    if (isTrialInvoice && planAmount > 0) {
      logStep("Generating custom trial invoice PDF", { planAmount });
      
      const customPdfBytes = await generateTrialInvoicePDF(invoice, subscription, planAmount);
      const base64Pdf = btoa(String.fromCharCode(...customPdfBytes));
      
      return new Response(JSON.stringify({ 
        customPdf: base64Pdf,
        invoiceId: invoice.id,
        amount: planAmount,
        currency: invoice.currency,
        status: invoice.status,
        isTrialInvoice: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // For paid invoices, use Stripe's PDF
    const invoiceWithPdf = await stripe.invoices.retrieve(invoiceId);

    if (!invoiceWithPdf.invoice_pdf) {
      throw new Error("PDF not available for this invoice");
    }

    logStep("PDF URL generated", { pdfUrl: invoiceWithPdf.invoice_pdf });

    return new Response(JSON.stringify({ 
      pdfUrl: invoiceWithPdf.invoice_pdf,
      invoiceId: invoice.id,
      amount: invoice.amount_paid || invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      isTrialInvoice: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-invoice-pdf", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
