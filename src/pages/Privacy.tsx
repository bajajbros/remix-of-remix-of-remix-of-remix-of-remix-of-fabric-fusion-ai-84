import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const Privacy = () => {
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
          <h1 className="text-3xl font-display font-bold gradient-text mb-8">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At {settings.app_name}, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI-powered business intelligence platform. 
              Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Account Information:</strong> Name, email address, phone number, company name</li>
              <li><strong>Business Data:</strong> Sales data, inventory information, customer data you upload</li>
              <li><strong>Usage Data:</strong> How you interact with our platform, features used, time spent</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Communication Data:</strong> Messages, support requests, feedback</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate AI-powered insights and recommendations for your business</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and provide customer service</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>256-bit SSL encryption for all data transmission</li>
              <li>Encrypted data storage with regular backups</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. AI and Machine Learning</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our platform uses AI and machine learning to provide intelligent business insights. Your business data 
              is used to train models specific to your account. We do not use your data to train general models 
              that would be shared with other users. Your data remains isolated and secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide 
              you services. You can request deletion of your data at any time by contacting us. We will retain 
              and use your information as necessary to comply with legal obligations, resolve disputes, and 
              enforce our agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and hold certain 
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is 
              being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our platform is not intended for use by children under the age of 18. We do not knowingly collect 
              personal information from children under 18. If you become aware that a child has provided us with 
              personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review 
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
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

export default Privacy;
