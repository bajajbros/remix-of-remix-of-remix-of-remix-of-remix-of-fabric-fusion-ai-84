import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const Refund = () => {
  const { settings } = useAppSettings();

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-display font-bold gradient-text mb-8">Refund Policy</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              At {settings.app_name}, we strive to provide the best AI-powered business intelligence services. 
              We understand that sometimes things don't work out as expected. This Refund Policy outlines the 
              conditions under which refunds may be provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Subscription Refunds</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Monthly Subscriptions:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full refund available within 7 days of initial subscription if you're not satisfied</li>
              <li>No refund for mid-cycle cancellations after the 7-day period</li>
              <li>Your access continues until the end of the current billing period</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 mb-4">
              <strong>Annual Subscriptions:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full refund available within 14 days of initial subscription</li>
              <li>Pro-rated refund available within the first 3 months</li>
              <li>No refund after 3 months from subscription date</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Eligibility for Refund</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may be eligible for a refund if:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>The service significantly differs from what was described</li>
              <li>Technical issues prevent you from accessing the platform for extended periods</li>
              <li>You cancel within the eligible refund period mentioned above</li>
              <li>There was an error in billing or duplicate charges</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Non-Refundable Items</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The following are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Setup or implementation fees</li>
              <li>Custom development work already completed</li>
              <li>Third-party services or integrations</li>
              <li>Subscriptions cancelled after the eligible refund period</li>
              <li>Accounts terminated due to policy violations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. How to Request a Refund</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To request a refund:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Contact our support team via WhatsApp at +91 73034 08500</li>
              <li>Or send an email to contact@qwii.in</li>
              <li>Provide your account details and reason for the refund request</li>
              <li>Our team will review your request within 3-5 business days</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Refund Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Once your refund is approved:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Refunds will be processed within 7-10 business days</li>
              <li>The amount will be credited to the original payment method</li>
              <li>Bank processing times may vary</li>
              <li>You will receive an email confirmation once the refund is processed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can cancel your subscription at any time through your account settings or by contacting 
              our support team. Upon cancellation:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>You retain access until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>Your data will be retained for 30 days after cancellation</li>
              <li>You can export your data before the retention period ends</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you're not satisfied with our refund decision, you may escalate the matter by contacting 
              our founders directly. We are committed to resolving all disputes fairly and promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be effective 
              immediately upon posting on this page. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any questions regarding refunds, please contact us:
            </p>
            <ul className="list-none text-muted-foreground mt-2 space-y-1">
              <li><strong>Email:</strong> contact@qwii.in</li>
              <li><strong>WhatsApp:</strong> +91 73034 08500</li>
              <li><strong>Founders:</strong> Mayank Bajaj & Himanshu Kumar</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} {settings.app_name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Refund;
