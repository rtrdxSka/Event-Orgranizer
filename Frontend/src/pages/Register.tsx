import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle, KeyRound } from "lucide-react";
import anime from "animejs/lib/anime.es.js";
import Navbar from "@/components/NavBar";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations/auth.schemas";
import type { z } from "zod";

type RegisterInput = z.infer<typeof registerSchema>;

type RegisterError = {
  message: string;
  status: number;
};


const Register = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [orbPositions] = useState(
    [...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }))
  );

  const formRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // Form setup with react-hook-form and zod
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: registerMutation, isPending } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setErrorMessage("");
      navigate("/", {
        replace: true,
      });
    },
    onError: (error: RegisterError) => {
      setErrorMessage(error.message);
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setErrorMessage(""); // Clear any existing error messages
      registerMutation(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setErrorMessage((error as { message: string }).message);
      } else {
        setErrorMessage('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    // Initial animations
    const timeline = anime.timeline({
      easing: "easeOutExpo",
    });

    timeline
      .add({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1200,
      })
      .add(
        {
          targets: subtitleRef.current,
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 1000,
        },
        "-=800"
      )
      .add(
        {
          targets: formRef.current,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 800,
        },
        "-=600"
      );

    // Animate floating orbs
    anime({
      targets: ".floating-orb",
      translateX: function () {
        return anime.random(-30, 30);
      },
      translateY: function () {
        return anime.random(-30, 30);
      },
      scale: function () {
        return anime.random(0.8, 1.2);
      },
      opacity: function () {
        return anime.random(0.2, 0.4);
      },
      duration: function () {
        return anime.random(3000, 5000);
      },
      delay: function () {
        return anime.random(0, 1000);
      },
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
    });
  }, []);

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background animations */}
      <div className="absolute inset-0">
        {orbPositions.map((position, i) => (
          <div
            key={i}
            className={`floating-orb absolute rounded-full blur-3xl opacity-20
              ${i % 2 === 0 ? "bg-purple-600" : "bg-blue-600"}
              ${i % 3 === 0 ? "w-96 h-96" : "w-80 h-80"}`}
            style={{
              top: position.top,
              left: position.left,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-purple-950/80" />
      </div>

      {/* Register Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md px-4 pt-16">
          <div className="text-center mb-6">
            <h1 ref={titleRef} className="text-4xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p ref={subtitleRef} className="text-lg text-purple-200">
              Join us and start planning amazing events
            </p>
          </div>

          <Card
            ref={formRef}
            className="bg-purple-900/40 border border-purple-700/50 backdrop-blur-sm"
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-purple-100">
                Sign Up
              </CardTitle>
              <CardDescription className="text-purple-200">
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {errorMessage && (
                    <Alert
                      variant="destructive"
                      className="bg-red-900/20 border-red-500/50 py-2" // Reduced vertical padding
                    >
                      <div className="flex items-center justify-center w-full gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />{" "}
                        <AlertDescription className="text-red-200 text-sm">
                          {errorMessage}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-purple-100">Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              className="pl-10 bg-purple-950/50 border-purple-700/50 text-purple-100 placeholder:text-purple-400"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-purple-100">
                          Password
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="pl-10 bg-purple-950/50 border-purple-700/50 text-purple-100 placeholder:text-purple-400"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-purple-100">
                          Confirm Password
                        </FormLabel>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              className="pl-10 bg-purple-950/50 border-purple-700/50 text-purple-100 placeholder:text-purple-400"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-purple-950 font-semibold mt-2"
                    disabled={isPending}
                  >
                    {isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </CardContent>
              </form>
            </Form>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <div className="text-purple-200">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-purple-300 hover:text-purple-100 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
