import { verifyEmail } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import anime from 'animejs/lib/anime.es.js';
import { useEffect } from "react";

const VerifyEmail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { isPending, isSuccess, isError, error } = useQuery({
    queryKey: ['emailVerification', code],
    queryFn: () => verifyEmail(code ?? ""),
  });

  useEffect(() => {
    anime({
      targets: '.content',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
      easing: 'easeOutExpo'
    });

    if (isSuccess) {
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [isPending, isError, isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />
      
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md px-4 pt-16 text-center content">
          {isPending && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-100 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-purple-200">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-100 mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-purple-200 mb-8">
                Your email has been verified. Redirecting you to login...
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-purple-200 text-purple-950 hover:bg-purple-100"
              >
                Go to Login
              </Button>
            </div>
          )}

          {isError && (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-purple-100 mb-2">
                Verification Failed
              </h2>
              <p className="text-red-300 mb-8">
                {(error as any)?.message || 'An error occurred during verification'}
              </p>
              <Button
                onClick={() => navigate('/password/reset')}
                className="bg-purple-200 text-purple-950 hover:bg-purple-100"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;