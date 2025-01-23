import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  // Function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Common active link styles
  const getNavLinkStyles = (path: string) => 
    `transition-colors font-medium ${
      isActive(path)
        ? 'bg-purple-100 text-purple-950 px-4 py-2 rounded-lg'
        : 'text-purple-100 hover:text-white'
    }`;

  // Special styles for the Sign In button
  const getSignInStyles = () =>
    `transition-colors font-medium px-4 py-2 rounded-lg ${
      isActive('/login')
        ? 'bg-white text-purple-950'
        : 'bg-purple-200 text-purple-950 hover:bg-purple-100'
    }`;

  return (
    <nav className="navbar fixed w-full z-50 bg-purple-900/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            EventPlanner
          </Link>
          
          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setIsNavOpen(!isNavOpen)}>
            {isNavOpen ? <X className="text-white" /> : <Menu className="text-white" />}
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="/#features" 
              className={getNavLinkStyles('/#features')}
            >
              Features
            </a>
            <a 
              href="/#howItWorks" 
              className={getNavLinkStyles('/#howItWorks')}
            >
              How It Works
            </a>
            <Link 
              to="/login"
              className={getSignInStyles()}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isNavOpen ? 'block' : 'hidden'} py-4`}>
          <div className="flex flex-col space-y-4">
            <a 
              href="/#features" 
              className={getNavLinkStyles('/#features')}
            >
              Features
            </a>
            <a 
              href="/#howItWorks" 
              className={getNavLinkStyles('/#howItWorks')}
            >
              How It Works
            </a>
            <Link 
              to="/login"
              className={getNavLinkStyles('/login')}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;