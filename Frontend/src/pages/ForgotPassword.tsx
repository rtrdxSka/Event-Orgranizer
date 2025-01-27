import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address format"),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const {
    mutate: sendPasswordReset,
    isPending,
    isSuccess,
    isError,
    error
  } = useMutation({
    mutationFn: sendPasswordResetEmail,
  });

  const onSubmit = (data: ForgotPasswordSchema) => {
    sendPasswordReset(data.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-purple-950/80 border-purple-800">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-purple-100">
              Reset Password
            </CardTitle>
            {!isSuccess && (
              <p className="text-purple-200">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <Alert className="bg-purple-900/50 border-purple-700">
                  <AlertDescription className="text-purple-100">
                    Check your email for password reset instructions.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4 mt-6">
                  <Link to="/login">
                    <Button 
                      className="w-full bg-purple-200 text-purple-950 hover:bg-purple-100"
                      size="lg"
                    >
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="Email address"
                        className="pl-10 bg-purple-900/50 border-purple-700 text-purple-100 placeholder:text-purple-400"
                      />
                    </div>
                    {errors.email && (
                      <Alert className="bg-red-900/50 border-red-700">
                        <AlertDescription className="text-red-200">
                          {errors.email.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    {isError && (
                      <Alert className="bg-red-900/50 border-red-700">
                        <AlertDescription className="text-red-200">
                          {error?.message || "Failed to send reset email. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-purple-200 text-purple-950 hover:bg-purple-100"
                    size="lg"
                    disabled={isPending}
                  >
                    {isPending ? "Sending..." : "Send Reset Instructions"}
                  </Button>
                </form>
                <div className="mt-6 flex items-center justify-between">
                  <Link 
                    to="/login"
                    className="text-purple-300 hover:text-purple-200 flex items-center gap-2"
                  >
                    Back to Login
                  </Link>
                  <Link 
                    to="/register"
                    className="text-purple-300 hover:text-purple-200 flex items-center gap-2"
                  >
                    Create Account <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;