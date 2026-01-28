import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, CreditCard, Phone, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
}

const PlanRegistrationForm = ({
  open,
  onOpenChange,
  planName,
  planPrice,
  billingCycle,
}: PlanRegistrationFormProps) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    message: '',
  });

  const upiId = '7303408500@kotak811';
  const qrCodeUrl = 'https://ibb.co/xtXt8B4Z';

  const copyUPIId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('plan_registrations').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.companyName || null,
        plan_name: planName,
        billing_cycle: billingCycle,
        plan_price: planPrice,
        message: formData.message || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Registration submitted successfully!');
      setStep('payment');
    } catch (error: any) {
      toast.error(`Failed to submit registration: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      message: '',
    });
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Register for {planName} Plan</DialogTitle>
              <DialogDescription>
                Fill in your details to get started with the {planName} plan at {formatPrice(planPrice)}/{billingCycle === 'annual' ? 'year' : 'month'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Any specific requirements or questions?"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">Registration Successful!</DialogTitle>
              <DialogDescription className="text-center">
                Thank you for choosing the {planName} plan. Here are the payment details:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-semibold">Plan Selected:</span>
                  <span className="text-lg font-bold text-primary">{planName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-semibold">Amount:</span>
                  <span className="text-2xl font-bold">{formatPrice(planPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Billing Cycle:</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </h4>

                <div className="space-y-3">
                  <div className="p-4 border-2 border-primary/50 rounded-lg space-y-3 bg-primary/5">
                    <p className="font-semibold flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-primary" />
                      UPI Payment (Recommended)
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 space-y-3 w-full">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">UPI ID:</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-background rounded-lg border font-mono text-sm">
                              {upiId}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={copyUPIId}
                              className="gap-2"
                            >
                              {copiedUPI ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Scan QR code or copy UPI ID to make payment using any UPI app (GPay, PhonePe, Paytm, etc.)
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="p-3 bg-white rounded-lg border-2 border-primary/20">
                          <img
                            src={qrCodeUrl}
                            alt="UPI QR Code"
                            className="w-32 h-32 object-contain"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-2">Scan to Pay</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2">
                    <p className="font-semibold">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">
                      Contact our sales team for bank account details
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Sales Team
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our team will reach out to you within 24 hours to complete the payment process and activate your account.
                    </p>
                    <div className="flex flex-col gap-1 mt-2">
                      <a href="tel:+917303408500" className="text-sm text-primary hover:underline">
                        📞 +91 73034 08500
                      </a>
                      <a href="tel:+918383954181" className="text-sm text-primary hover:underline">
                        📞 +91 83839 54181
                      </a>
                      <a href="https://wa.me/917303408500" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        💬 WhatsApp: +91 73034 08500
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlanRegistrationForm;
