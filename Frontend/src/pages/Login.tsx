import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';

const Login = () => {
  const navigate = useNavigate();
  const [orbPositions] = useState(
    [...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`
    }))
  );

  const formRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your login logic here
    console.log('Login attempt with:', { email, password });
  };

  useEffect(() => {
    // Initial animations
    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    timeline
      .add({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1200,
      })
      .add({
        targets: subtitleRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 1000,
      }, '-=800')
      .add({
        targets: formRef.current,
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
  }, []);

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center relative overflow-hidden">
      {/* Background animations */}
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

      {/* Back to Home Button */}
      <Button
        variant="ghost"
        className="absolute top-8 left-8 text-purple-100 hover:text-white hover:bg-purple-900/50"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Login Content */}
      <div className="relative w-full max-w-md px-4">
        <div className="text-center mb-6">
          <h1 ref={titleRef} className="text-4xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p ref={subtitleRef} className="text-lg text-purple-200">
            Sign in to continue planning amazing events
          </p>
        </div>

        <Card
          ref={formRef}
          className="bg-purple-900/40 border border-purple-700/50 backdrop-blur-sm"
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-purple-100">Sign In</CardTitle>
            <CardDescription className="text-purple-200">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-purple-100" htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 bg-purple-950/50 border-purple-700/50 text-purple-100 placeholder:text-purple-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-purple-100" htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 bg-purple-950/50 border-purple-700/50 text-purple-100 placeholder:text-purple-400"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-purple-950 font-semibold mt-2"
              >
                Sign In
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Link 
              to="/forgot-password" 
              className="text-sm text-purple-200 hover:text-purple-100 transition-colors"
            >
              Forgot your password?
            </Link>
            <div className="text-purple-200">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-purple-300 hover:text-purple-100 transition-colors font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;