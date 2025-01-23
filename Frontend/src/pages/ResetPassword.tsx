import ResetPasswordForm from "@/components/ResetPasswordForm";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';


const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const exp = searchParams.get('exp');
  const now = Date.now();
  const linkIsValid = code && exp && Number(exp) > now;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {linkIsValid ? (
          <ResetPasswordForm code={code} />
        ) : (
          <Card className="bg-purple-950/80 border-purple-800">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold text-purple-100">
                Invalid or Expired Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">
                  This password reset link is invalid or has expired.
                </AlertDescription>
              </Alert>
              <Link to="/forgot-password">
                <Button 
                  className="w-full bg-purple-200 text-purple-950 hover:bg-purple-100"
                  size="lg"
                >
                  Request New Reset Link <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;