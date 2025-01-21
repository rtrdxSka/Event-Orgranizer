import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Users, MessageSquare, MapPin, Menu, X, Check, Clock, Bell } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import { Link, useNavigate  } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false);
  const alternateWords = ['Hangouts', 'Meetings', 'Reunions', 'Events', 'Meetups', 'Celebrations'];
  const [isVisible, setIsVisible] = useState({});
  const [orbPositions] = useState(
    [...Array(8)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`
    }))
  );
  

  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);
  const wordRef = useRef(null);
  const processLineRef = useRef(null);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    [featuresRef, howItWorksRef, ctaRef].forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);


    // Add new useEffect for process line animation
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              anime({
                targets: '.process-line',
                strokeDashoffset: [anime.setDashoffset, 0],
                easing: 'easeInOutSine',
                duration: 1500,
                delay: function(el, i) { return i * 250 },
              });
            }
          });
        },
        { threshold: 0.5 }
      );
  
      if (processLineRef.current) {
        observer.observe(processLineRef.current);
      }
  
      return () => observer.disconnect();
    }, []);


  useEffect(() => {
    const animate = () => {
      setIsAnimating(true);
      anime.timeline({
        easing: 'easeInOutQuad',
      })
      .add({
        targets: wordRef.current,
        opacity: 0,
        translateY: 20,
        duration: 300,
        complete: () => {
          setCurrentWord((prev) => (prev + 1) % alternateWords.length);
        }
      })
      .add({
        targets: wordRef.current,
        opacity: 1,
        translateY: 0,
        duration: 300,
        complete: () => {
          setIsAnimating(false);
        }
      });
    };

    const interval = setInterval(() => {
      if (!isAnimating) {
        animate();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  useEffect(() => {
    // Initial hero animations
    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    timeline
      .add({
        targets: '.navbar',
        translateY: [-50, 0],
        opacity: [0, 1],
        duration: 1000,
      })
      .add({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1200,
        begin: () => {
          // Ensure the animated word stays visible
          if (wordRef.current) {
            wordRef.current.style.opacity = '1';
          }
        }
      })
      .add({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 1000,
      }, '-=800')
      .add({
        targets: buttonRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
      }, '-=600');

    // Animate floating orbs
    anime({
      targets: '.floating-orb',
      translateX: function() {
        return anime.random(-30, 30);
      },
      translateY: function() {
        return anime.random(-30, 30);
      },
      scale: function() {
        return anime.random(0.8, 1.2);
      },
      opacity: function() {
        return anime.random(0.2, 0.4);
      },
      duration: function() {
        return anime.random(3000, 5000);
      },
      delay: function() {
        return anime.random(0, 1000);
      },
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });

    // Continuous button float
    anime({
      targets: buttonRef.current,
      translateY: [-3, 3],
      duration: 1500,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });
  }, []);

  return (
    <div className="min-h-screen bg-purple-950">
     {/* Updated Navbar */}
     {/* Updated Navbar */}
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
              <a href="#features" className="text-purple-100 hover:text-white transition-colors">
                Features
              </a>
              <a href="#howItWorks" className="text-purple-100 hover:text-white transition-colors">
                How It Works
              </a>
              <Link 
                to="/login"
                className="bg-purple-200 text-purple-950 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden ${isNavOpen ? 'block' : 'hidden'} py-4`}>
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-purple-100 hover:text-white transition-colors">
                Features
              </a>
              <a href="#howItWorks" className="text-purple-100 hover:text-white transition-colors">
                How It Works
              </a>
              <Link 
                to="/login"
                className="text-purple-100 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="h-screen bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 relative overflow-hidden">
        {/* Background animations remain the same */}
        <div className="absolute inset-0">
  {orbPositions.map((position, i) => (
    <div
      key={i}
      className={`floating-orb absolute rounded-full blur-3xl opacity-20
        ${i % 2 === 0 ? 'bg-purple-600' : 'bg-blue-600'}
        ${i % 3 === 0 ? 'w-96 h-96' : 'w-80 h-80'}`}
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)'
      }}
    />
  ))}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
</div>
        
        {/* Hero content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="text-center">
           <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold mb-8 text-white tracking-tight text-nowrap">
      Plan{' '}
      <span 
        ref={wordRef}
        className="inline-block min-w-[300px] opacity-100"
      >
        {alternateWords[currentWord]}
      </span>
      {', '}
      <br className="md:hidden" />
      Effortlessly
    </h1>
            <p ref={subtitleRef} className="text-2xl md:text-3xl mb-12 text-purple-100 opacity-0 max-w-3xl mx-auto">
              Stop juggling messages. Start planning gatherings that work for everyone.
            </p>
            <div ref={buttonRef} className="opacity-0">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-purple-200 text-purple-950 hover:bg-purple-100 font-semibold px-12 py-8 text-xl rounded-2xl"
              >
                Start Planning
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-10 h-10 border-2 border-purple-200 rounded-full flex items-center justify-center">
            <div className="w-1 h-5 bg-purple-200 rounded-full"></div>
          </div>
        </div>
      </div>

{/* Enhanced Features Section */}
<div id="features" ref={featuresRef} className="max-w-7xl mx-auto px-4 py-32">
        <div className={`transition-all duration-1000 transform ${isVisible.features ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-purple-100">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { 
                icon: Calendar, 
                title: "Smart Date Voting",
                desc: "Our AI-powered system suggests optimal dates based on everyone's preferences and past scheduling patterns",
                features: ["Conflict detection", "Calendar integration", "Timezone support"]
              },
              { 
                icon: MapPin, 
                title: "Location Magic",
                desc: "Find the perfect venue with integrated maps, ratings, and distance calculations for all attendees",
                features: ["Distance optimization", "Weather forecasts", "Venue recommendations"]
              },
              { 
                icon: MessageSquare, 
                title: "Enhanced Communication",
                desc: "Keep everyone in the loop with our smart notification system and group chat features",
                features: ["Real-time updates", "File sharing", "Poll creation"]
              },
              { 
                icon: Users, 
                title: "Advanced RSVP",
                desc: "Track attendance, dietary preferences, and plus-ones with our comprehensive RSVP system",
                features: ["Dietary management", "Guest list analytics", "Automated reminders"]
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-800 to-blue-900 p-1"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div className="relative h-full bg-purple-950 rounded-lg p-8 transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                  
                  <feature.icon className="w-16 h-16 mb-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                  <h3 className="text-2xl font-semibold mb-4 text-purple-100">{feature.title}</h3>
                  <p className="text-lg text-purple-200 mb-6">{feature.desc}</p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center text-purple-300">
                        <Check className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    {/* Enhanced How It Works Section */}
    <div id="howItWorks" ref={howItWorksRef} className="bg-gradient-to-br from-purple-900 to-blue-900/80 py-32">
        <div className={`max-w-7xl mx-auto px-4 transition-all duration-1000 transform ${isVisible.howItWorks ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-purple-100">
            Your Event Journey
          </h2>

          <div className="relative" ref={processLineRef}>
            {/* Animated connection lines */}
            <svg className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 hidden md:block" style={{ zIndex: 0 }}>
              <path
                d="M0 8 L1000 8"
                className="process-line"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray="5,5"
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="100%" y2="0">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
            </svg>

            <div className="grid md:grid-cols-3 gap-16 relative z-10">
              {[
                {
                  number: 1,
                  title: "Create & Invite",
                  desc: "Set up your event in minutes",
                  icon: Calendar,
                  details: [
                    "Choose event type & name",
                    "Set potential dates & times",
                    "Import contacts to invite",
                    "Customize invitation message"
                  ]
                },
                {
                  number: 2,
                  title: "Coordinate & Plan",
                  desc: "Make decisions together",
                  icon: Clock,
                  details: [
                    "Vote on dates & locations",
                    "Share preferences & constraints",
                    "Discuss in group chat",
                    "Track responses in real-time"
                  ]
                },
                {
                  number: 3,
                  title: "Finalize & Remind",
                  desc: "Lock in the perfect plan",
                  icon: Bell,
                  details: [
                    "Confirm final details",
                    "Send automated reminders",
                    "Share event updates",
                    "Manage last-minute changes"
                  ]
                }
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  className="relative bg-purple-900/40 rounded-xl p-8 border border-purple-700/50 hover:bg-purple-900/60 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-blue-400 text-purple-950 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <step.icon className="w-16 h-16 mx-auto mb-6 text-purple-300" />
                  <h3 className="text-2xl font-semibold mb-4 text-purple-100 text-center">{step.title}</h3>
                  <p className="text-lg text-purple-200 mb-6 text-center">{step.desc}</p>
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-purple-300">
                        <Check className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section - Updated button to use React Router */}
      <div id="cta" ref={ctaRef} className="bg-gradient-to-r from-purple-800 via-purple-700 to-blue-800 text-white text-center py-32">
        <div className={`max-w-4xl mx-auto px-4 transition-all duration-1000 transform ${isVisible.cta ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Make Event Planning Easier?
          </h2>
          <p className="text-2xl mb-12 text-purple-100">
            Join thousands of people who are already planning better gatherings.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-purple-200 text-purple-950 hover:bg-purple-100 font-semibold px-12 py-8 text-xl rounded-2xl hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/signup')}
          >
            Get Started Free
          </Button>
        </div>
      </div>

 {/* Updated Footer */}
 <footer className="bg-purple-900/60 text-purple-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg">&copy; 2025 Event Planner. All rights reserved.</p>
            </div>
            <div className="md:text-right space-x-8">
              <Link to="/terms" className="text-lg hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="text-lg hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;