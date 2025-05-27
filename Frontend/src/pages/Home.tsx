import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/NavBar';
import { Button } from "@/components/ui/button";
import { Calendar, Users, MessageSquare, MapPin, Check, Clock, Bell } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import { Link, useNavigate  } from 'react-router-dom';

interface VisibilityState {
  features?: boolean;
  howItWorks?: boolean;
  cta?: boolean;
  [key: string]: boolean | undefined; // This allows for dynamic keys
}

const Home = () => {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false)
  const alternateWords = ['Hangouts', 'Meetings', 'Reunions', 'Events', 'Meetups', 'Celebrations'];
  const [isVisible, setIsVisible] = useState<VisibilityState>({});
  const [orbPositions] = useState(
    [...Array(8)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`
    }))
  );
  

  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const processLineRef = useRef<HTMLDivElement>(null);

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
    <Navbar />

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
                onClick={() => navigate('/event/create')}
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
    title: "Date & Time Voting",
    desc: "Let participants vote on multiple date and time options. Set voting limits and allow attendees to suggest new dates if needed",
    features: ["Multiple date options", "Time preference voting", "Suggest new dates", "Vote limits per person"]
  },
  { 
    icon: MapPin, 
    title: "Location Selection", 
    desc: "Collect votes for event locations with the ability to suggest new venues. Perfect for finding the most convenient spot for everyone",
    features: ["Location voting", "Venue suggestions"]
  },
  { 
    icon: MessageSquare, 
    title: "Custom Response Forms",
    desc: "Create tailored forms with text fields, multiple choice, checkboxes, and lists to gather exactly the information you need",
    features: ["Text responses", "Multiple choice questions", "Checkbox selections", "Custom lists"]
  },
  { 
    icon: Users, 
    title: "Response Management",
    desc: "Track all responses in real-time with detailed analytics. See who voted for what and manage participant preferences easily",
    features: ["Real-time tracking", "Response analytics",]
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
    title: "Create & Configure",
    desc: "Set up your event with custom fields",
    icon: Calendar,
    details: [
      "Add event name & description",
      "Set multiple date/time options", 
      "Add location choices",
      "Create custom response fields"
    ]
  },
  {
    number: 2,
    title: "Share & Collect",
    desc: "Gather responses from participants",
    icon: Clock,
    details: [
      "Share unique event link",
      "Participants vote on preferences",
      "Collect custom field responses",
      "Allow new suggestions if enabled"
    ]
  },
  {
    number: 3,
    title: "Analyze & Finalize",
    desc: "Review results and confirm details",
    icon: Bell,
    details: [
      "View voting results & analytics",
      "See all participant responses",
      "Select final date & location",
      "Add to Google Calendar integration"
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