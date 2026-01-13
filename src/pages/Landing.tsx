import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAppSettings } from '@/hooks/useAppSettings';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Palette, 
  Users, 
  Factory, 
  Package, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
  Target,
  LineChart,
  Bot,
  Layers,
  Clock,
  Award,
  Globe,
  HeartHandshake,
  Rocket
} from 'lucide-react';

const Landing = () => {
  const { settings } = useAppSettings();
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'pricing', 'about'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappNumber = '917303408500';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi! I'm interested in QWII platform.`;

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analytics',
      description: 'Advanced machine learning algorithms analyze your business data in real-time, providing actionable insights that drive growth.'
    },
    {
      icon: TrendingUp,
      title: 'Sales Forecasting',
      description: 'Predict future sales with up to 95% accuracy using our proprietary AI models trained on millions of data points.'
    },
    {
      icon: BarChart3,
      title: 'Demand Prediction',
      description: 'Anticipate market demand before it happens. Optimize inventory and reduce waste with intelligent predictions.'
    },
    {
      icon: MessageSquare,
      title: 'AI Business Chatbot',
      description: 'Your 24/7 intelligent assistant that understands your business context and provides instant answers.'
    },
    {
      icon: Palette,
      title: 'Design Generator',
      description: 'Create stunning marketing materials, product designs, and branding assets with AI-powered generation.'
    },
    {
      icon: Users,
      title: 'B2B Agent',
      description: 'Automate B2B communications, lead generation, and relationship management with our intelligent agent.'
    },
    {
      icon: Factory,
      title: 'Production Management',
      description: 'Monitor and optimize your production lines in real-time. Reduce downtime and maximize efficiency.'
    },
    {
      icon: Package,
      title: 'Inventory Intelligence',
      description: 'Smart inventory management that learns from your patterns and automatically suggests optimal stock levels.'
    },
    {
      icon: Shield,
      title: 'Quality Control AI',
      description: 'Detect defects and quality issues before they become problems with computer vision and AI analysis.'
    },
    {
      icon: LineChart,
      title: 'Real-time Analytics',
      description: 'Live dashboards and metrics that give you instant visibility into every aspect of your business.'
    },
    {
      icon: Bot,
      title: 'Process Automation',
      description: 'Automate repetitive tasks and workflows, freeing your team to focus on what matters most.'
    },
    {
      icon: Target,
      title: 'Smart Recommendations',
      description: 'Get personalized recommendations for pricing, marketing, and operations based on your unique data.'
    }
  ];

  const pricingPlans = [
    {
      name: 'BASIC',
      subtitle: 'Business Insights',
      monthlyPrice: 2999,
      annualPrice: 29999,
      bestFor: 'Small businesses, shops, service providers',
      features: [
        'Monthly business performance summary',
        'Key metrics tracking (sales, expenses, growth)',
        'Simple insights & recommendations',
        'Email/WhatsApp report',
        'Support via email'
      ],
      cta: 'Start with Basic',
      popular: false
    },
    {
      name: 'GROWTH',
      subtitle: 'Business Intelligence',
      monthlyPrice: 6999,
      annualPrice: 69999,
      bestFor: 'Growing MSMEs & startups',
      features: [
        'Everything in Basic',
        'Sales & revenue trend analysis',
        'Customer behavior insights',
        'Forecasting (basic–medium level)',
        'Custom dashboard access',
        'Monthly strategy call'
      ],
      cta: 'Grow with Data',
      popular: true
    },
    {
      name: 'PRO',
      subtitle: 'AI Decision Intelligence',
      monthlyPrice: 14999,
      annualPrice: 149999,
      bestFor: 'Data-driven companies',
      features: [
        'Everything in Growth',
        'Advanced forecasting models',
        'AI-driven decision support',
        'Business automation insights',
        'Priority support',
        'Industry-specific intelligence',
        'Extra dashboard',
        'Weekly reports',
        'Dedicated analyst',
        'Custom AI model'
      ],
      cta: 'Scale with AI',
      popular: false
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <span className="text-xl font-display font-bold gradient-text">{settings.app_name}</span>
                <span className="hidden sm:block text-xs text-muted-foreground">{settings.tagline}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['home', 'features', 'pricing', 'about'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === section ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-2">
                  <Phone size={14} />
                  Contact Sales
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Business Intelligence Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="gradient-text">Transform Your Business</span>
              <br />
              <span className="text-foreground">with Intelligent AI</span>
            </h1>

            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {settings.app_name} is the ultimate AI-powered platform designed for modern businesses. 
              From sales forecasting to production management, we bring the power of artificial intelligence 
              to every aspect of your operations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                  <Phone size={20} />
                  Contact for Sales
                </Button>
              </a>
              <a href="https://preview.qwii.in" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-lg">
                  <Rocket size={20} />
                  Try Preview
                </Button>
              </a>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 px-8 py-6 text-lg">
                  Login
                  <ArrowRight size={20} />
                </Button>
              </Link>
            </div>

            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { value: '500+', label: 'Businesses Trust Us' },
                { value: '95%', label: 'Prediction Accuracy' },
                { value: '24/7', label: 'AI Support' },
                { value: '10x', label: 'Faster Decisions' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything You Need to <span className="gradient-text">Dominate Your Market</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of AI-powered tools covers every aspect of your business operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-warning/10 text-warning border-warning/20">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Choose Your <span className="gradient-text">Growth Plan</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Flexible pricing designed for businesses of all sizes. Start small, scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="outline" className="ml-2 text-accent border-accent">
                  Save ~2 months
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`relative glass-card p-8 ${
                  plan.popular 
                    ? 'border-primary ring-2 ring-primary/20 scale-105' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="w-3 h-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">
                    {formatPrice(isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isAnnual ? '/year' : '/month'}
                  </div>
                </div>

                <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>Best for:</strong> {plan.bestFor}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button 
                    className="w-full gap-2" 
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    👉 {plan.cta}
                    <ChevronRight size={16} />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">About Us</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Meet the <span className="gradient-text">Visionaries</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {settings.app_name} was born from a simple observation: businesses are drowning in data but starving for insights. 
                Founded by two passionate technologists, we set out to democratize artificial intelligence for businesses of all sizes.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to empower every business owner with the same powerful AI tools that were once only available to 
                Fortune 500 companies. We believe that with the right insights, any business can achieve extraordinary growth.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="glass-card p-6 text-center">
                  <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold">Innovation First</h4>
                  <p className="text-sm text-muted-foreground">Cutting-edge AI technology</p>
                </div>
                <div className="glass-card p-6 text-center">
                  <HeartHandshake className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h4 className="font-semibold">Customer Success</h4>
                  <p className="text-sm text-muted-foreground">Your growth is our priority</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">MB</span>
                </div>
                <h3 className="text-xl font-bold">Mayank Bajaj</h3>
                <p className="text-sm text-primary">Co-Founder</p>
              </div>
              <div className="glass-card p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">HK</span>
                </div>
                <h3 className="text-xl font-bold">Himanshu Kumar</h3>
                <p className="text-sm text-accent">Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <Zap className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of businesses already using {settings.app_name} to make smarter decisions, 
                automate operations, and accelerate growth.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 px-8">
                    <Phone size={20} />
                    Talk to Sales
                  </Button>
                </a>
                <a href="https://preview.qwii.in" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 px-8">
                    <Rocket size={20} />
                    Try Demo
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
                <span className="text-xl font-display font-bold gradient-text">{settings.app_name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {settings.tagline}
              </p>
              <div className="flex items-center gap-4">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Phone size={20} />
                </a>
                <a href="mailto:contact@qwii.in" className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail size={20} />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground">Pricing</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-muted-foreground hover:text-foreground">About Us</button></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-foreground">Login</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/refund" className="text-muted-foreground hover:text-foreground">Refund Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} />
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    +91 73034 08500
                  </a>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} />
                  <a href="mailto:contact@qwii.in" className="hover:text-foreground">
                    contact@qwii.in
                  </a>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin size={14} className="mt-0.5" />
                  <span>India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {settings.app_name}. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
