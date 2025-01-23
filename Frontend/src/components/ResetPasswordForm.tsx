import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { Check, KeyIcon } from 'lucide-react';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";



const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Password must be at least 8 characters")
    .max(255, "Password can not be longer than 255 characters"),  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = ({ code }: { code: string }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  const {
    mutate: resetUserPassword,
    isPending,
    isSuccess,
    isError,
    error
  } = useMutation({
    mutationFn: resetPassword,
  });

  const onSubmit = (data: ResetPasswordSchema) => {
    console.log({ verificationCode: code, password: data.password });
    resetUserPassword({ verificationCode: code, password: data.password });
  };

  return (
    <Card className="bg-purple-950/80 border-purple-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-purple-100">
          {isSuccess ? "Password Reset Successfully" : "Reset Password"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <Alert className="bg-purple-900/50 border-purple-700">
              <AlertDescription className="text-purple-100">
                Your password has been reset successfully.
              </AlertDescription>
            </Alert>
            <Link to="/login">
              <Button 
                className="w-full bg-purple-200 text-purple-950 hover:bg-purple-100"
                size="lg"
              >
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="New password"
                    className="pl-10 bg-purple-900/50 border-purple-700 text-purple-100 placeholder:text-purple-400"
                  />
                </div>
                {errors.password && (
                  <Alert className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">
                      {errors.password.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="Confirm password"
                    className="pl-10 bg-purple-900/50 border-purple-700 text-purple-100 placeholder:text-purple-400"
                  />
                </div>
                {errors.confirmPassword && (
                  <Alert className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">
                      {errors.confirmPassword.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {isError && (
                <Alert className="bg-red-900/50 border-red-700">
                  <AlertDescription className="text-red-200">
                    {error?.message || "Failed to reset password. Please try again."}
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
              {isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};


export default ResetPasswordForm;