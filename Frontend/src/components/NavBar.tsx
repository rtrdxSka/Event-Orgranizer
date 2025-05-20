import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { logout } from '@/lib/api';
import queryClient from '@/config/queryClient';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';

const Navbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getNavLinkStyles = (path: string) =>
    `transition-colors font-medium ${
      isActive(path)
        ? 'bg-purple-100 text-purple-950 px-4 py-2 rounded-lg'
        : 'text-purple-100 hover:text-white'
    }`;

  const {mutate: signOut} = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login", {replace: true});
    }
  });

  const AuthButtons = () => {
    if (user) {
      return (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-100 hover:text-white hover:bg-purple-800 mr-2"
            onClick={() => navigate('/event/create')}
          >
            Create Event
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-purple-100 hover:text-white hover:bg-purple-800 mr-2"
            onClick={() => navigate('/events')}
          >
            My Events
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-purple-100 hover:text-white hover:bg-purple-800"
            onClick={() => navigate('/profile')}
          >
            <User className="h-5 w-5 mr-2" />
            Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-purple-200 text-purple-950 hover:bg-purple-100"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </>
      );
    }

    return (
      <Link
        to="/login"
        className="transition-colors font-medium px-4 py-2 rounded-lg bg-purple-200 text-purple-950 hover:bg-purple-100"
      >
        Sign In
      </Link>
    );
  };

  return (
    <nav className="navbar fixed w-full z-50 bg-purple-900/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            EventPlanner
          </Link>
         
          <button className="md:hidden" onClick={() => setIsNavOpen(!isNavOpen)}>
            {isNavOpen ? <X className="text-white" /> : <Menu className="text-white" />}
          </button>

          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <>
                <a href="/#features" className={getNavLinkStyles('/#features')}>
                  Features
                </a>
                <a href="/#howItWorks" className={getNavLinkStyles('/#howItWorks')}>
                  How It Works
                </a>
              </>
            )}
            <AuthButtons />
          </div>
        </div>

        <div className={`md:hidden ${isNavOpen ? 'block' : 'hidden'} py-4`}>
          <div className="flex flex-col space-y-4">
            {!user && (
              <>
                <a href="/#features" className={getNavLinkStyles('/#features')}>
                  Features
                </a>
                <a href="/#howItWorks" className={getNavLinkStyles('/#howItWorks')}>
                  How It Works
                </a>
              </>
            )}
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;