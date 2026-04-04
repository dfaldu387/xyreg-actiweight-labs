
import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-slate-50 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">XYREG</h3>
            <p className="text-muted-foreground text-sm">
              Plan, track, and collaborate across your device lifecycle — built for MDR, ISO 13485, and IVDR compliance.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/resources/docs" className="text-muted-foreground hover:text-primary text-sm">Documentation</Link>
              </li>
              <li>
                <Link to="/resources/guides" className="text-muted-foreground hover:text-primary text-sm">User Guides</Link>
              </li>
              <li>
                <Link to="/resources/webinars" className="text-muted-foreground hover:text-primary text-sm">Webinars</Link>
              </li>
              <li>
                <Link to="/resources/blog" className="text-muted-foreground hover:text-primary text-sm">Blog</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary text-sm">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary text-sm">Contact</Link>
              </li>
              <li>
                <Link to="/careers" className="text-muted-foreground hover:text-primary text-sm">Careers</Link>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/xyreg" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-sm">LinkedIn</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-primary text-sm">Terms of Service</Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary text-sm">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/legal/gdpr" className="text-muted-foreground hover:text-primary text-sm">GDPR Compliance</Link>
              </li>
              <li>
                <Link to="/legal/cookie-policy" className="text-muted-foreground hover:text-primary text-sm">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} XYREG. All rights reserved.</p>
          <p className="mt-2">Contact support: <a href="mailto:support@xyreg.com" className="hover:text-primary">support@xyreg.com</a></p>
        </div>
      </div>
    </footer>
  );
}
