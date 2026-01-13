import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const Terms = () => {
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
          <h1 className="text-3xl font-display font-bold gradient-text mb-8">Terms and Conditions</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using {settings.app_name} ("the Platform"), you accept and agree to be bound by these 
              Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              {settings.app_name} provides an AI-powered business intelligence platform that includes but is not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Sales forecasting and demand prediction</li>
              <li>Business analytics and reporting</li>
              <li>AI-powered recommendations</li>
              <li>Production and inventory management</li>
              <li>Customer relationship management tools</li>
              <li>Automated business insights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of the Platform, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Subscription and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscription fees are billed in advance on a monthly or annual basis depending on your chosen plan. 
              All payments are non-refundable except as expressly stated in our Refund Policy. We reserve the right 
              to modify pricing with 30 days notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Data Usage and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Platform is also governed by our Privacy Policy. By using {settings.app_name}, you consent 
              to the collection and use of your data as described in our Privacy Policy. We implement industry-standard 
              security measures to protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of {settings.app_name} are owned by us and are protected by 
              international copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              distribute, or create derivative works without our express written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              {settings.app_name} and its founders, Mayank Bajaj and Himanshu Kumar, shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform. 
              Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the Platform immediately, without prior notice, 
              for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
              or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes 
              via email or through the Platform. Your continued use of the Platform after such modifications 
              constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes 
              arising under these Terms shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <ul className="list-none text-muted-foreground mt-2 space-y-1">
              <li>Email: contact@qwii.in</li>
              <li>WhatsApp: +91 73034 08500</li>
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

export default Terms;
