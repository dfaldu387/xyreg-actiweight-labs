
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/context/AuthContext";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { DevModeEnhancedControls } from "@/components/dev/DevModeEnhancedControls";
import { useDevMode } from "@/context/DevModeContext";

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerType, setRegisterType] = useState("company");
  const { user } = useAuth();
  const { isDevMode, toggleDevMode } = useDevMode();

  const handleRegisterOpen = (type: string) => {
    setRegisterType(type);
    setIsRegisterOpen(true);
  };

  // Enable dev mode automatically in development environment
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isDevMode) {
      // Set a small timeout to avoid any potential race conditions
      const timer = setTimeout(() => {
        toggleDevMode();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDevMode, toggleDevMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">XYREG</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-primary">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-primary">About</a>
            <a href="#contact" className="text-gray-600 hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                  Login
                </Button>
                <Button onClick={() => handleRegisterOpen("company")}>
                  Register
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Logged in as {user.email}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Development Mode Controls - Only shown in development environment */}
        {process.env.NODE_ENV === 'development' && (
          <div className="container mx-auto px-4 mt-6 mb-6">
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Developer Mode Controls</h2>
              <p className="mb-4 text-yellow-700">Configure testing settings like user roles, company and internal/external status</p>
              <DevModeEnhancedControls />
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Plan, track, and collaborate across your device lifecycle
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
              Built for MDR, ISO 13485, and IVDR compliance
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => handleRegisterOpen("company")}>
                Register as a Company
              </Button>
              <Button size="lg" variant="outline" onClick={() => handleRegisterOpen("consultant")}>
                Register as a Consultant
              </Button>
              <Button size="lg" variant="outline" onClick={() => handleRegisterOpen("expert")}>
                Register as an Expert
              </Button>
            </div>
          </div>
        </section>

        {/* User Role Testing Section - Only visible for authenticated users */}
        {user && (
          <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6 text-center">Role Management</h2>
              <RoleSelector />
            </div>
          </section>
        )}

        {/* Use Cases Section */}
        <section id="features" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Solutions For Every Need</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">For Medical Device Companies</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Device registration & tracking
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Document management
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Lifecycle control
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("company")}>
                  Register as Company
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">For Consultants</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Manage multiple companies
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Assign experts
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Track client audits
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("consultant")}>
                  Register as Consultant
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">For Experts</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Provide document reviews
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Be matched to projects
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Specialized expertise
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("expert")}>
                  Register as Expert
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Portfolio Management</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Product lifecycle tracking
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Phase-based visualization
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Portfolio analytics
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("company")}>
                  Explore Portfolio
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Pricing Plans</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {/* Freemium */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-2">Freemium</h3>
                <p className="text-3xl font-bold mb-4">$0</p>
                <p className="text-gray-500 mb-6">Basic device tracking</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    1 product
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Basic lifecycle
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    No consulting
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("company")}>
                  Start Free
                </Button>
              </div>
              
              {/* Pro */}
              <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold inline-block mb-2">POPULAR</div>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$99<span className="text-sm text-gray-500">/mo</span></p>
                <p className="text-gray-500 mb-6">For growing companies</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Up to 10 products
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Full lifecycle control
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    2 hours consulting/month
                  </li>
                </ul>
                <Button className="w-full" onClick={() => handleRegisterOpen("company")}>
                  Start Pro
                </Button>
              </div>
              
              {/* Consultant */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-2">Consultant</h3>
                <p className="text-3xl font-bold mb-4">$299<span className="text-sm text-gray-500">/mo</span></p>
                <p className="text-gray-500 mb-6">For consultancies</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Unlimited clients
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Expert assignment
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Client billing
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => handleRegisterOpen("consultant")}>
                  Start Consulting
                </Button>
              </div>
              
              {/* Enterprise */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">Custom</p>
                <p className="text-gray-500 mb-6">For large organizations</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Unlimited products
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Custom integrations
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Dedicated support
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">XYREG</h3>
              <p className="text-sm">Medical device lifecycle management platform for compliant operations.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Webinars</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 flex justify-between items-center">
            <p className="text-sm">© 2025 XYREG. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
          </DialogHeader>
          <LoginForm onClose={() => setIsLoginOpen(false)} setShowRegister={() => {}} />
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {registerType === "company" 
                ? "Register as Company" 
                : registerType === "consultant" 
                  ? "Register as Consultant" 
                  : "Register as Expert"}
            </DialogTitle>
          </DialogHeader>
          <RegisterForm userType={registerType} onClose={() => setIsRegisterOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
