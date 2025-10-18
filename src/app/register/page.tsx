
"use client";
/**
 * @fileOverview This file contains the RegisterPage component, which handles the
 * multi-step user registration process.
 *
 * The process consists of two steps:
 * 1. User enters their details (name, college, email).
 * 2. User verifies their email with an OTP and sets a password.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerUserAction, verifyOtpAction } from "../auth/actions";

/**
 * @component RegisterPage
 * @description A page component that manages the state for the two-step registration flow.
 */
export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "otp">("details");

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  /**
   * Handles the first step of registration: sending the OTP.
   */
  const handleSendOtp = () => {
    startTransition(async () => {
      const result = await registerUserAction({ name, college, email });
      if (result.success) {
        toast({
          title: "OTP Sent",
          description: result.message,
        });
        setStep("otp"); // Move to the next step on success.
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.message || "An unexpected error occurred.",
        });
      }
    });
  };

  /**
   * Handles the second step: verifying the OTP and completing registration.
   */
  const handleVerifyOtp = () => {
    // Basic client-side validation before calling the server action.
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Password must be at least 6 characters.",
        });
        return;
    }
     if (otp.length !== 6) {
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "OTP must be 6 digits.",
        });
        return;
    }

    startTransition(async () => {
        const result = await verifyOtpAction({ email, otp, password });
        if (result.success) {
            toast({
                title: "Registration Successful",
                description: "You can now log in with your credentials.",
            });
            router.push("/login"); // Redirect to login page on success.
        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: result.message || "An unexpected error occurred.",
            });
        }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-custom-xl border-0 bg-card/80 backdrop-blur-sm animate-scale-in">
          {step === 'details' && (
            // Step 1: User Details Form
            <>
              <CardHeader className="text-center space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <BrainCircuit className="h-16 w-16 text-primary animate-pulse-slow" />
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-lg opacity-50"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-headline bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                    Create an Account
                  </CardTitle>
                  <CardDescription className="text-base">
                    Join Exam AI Prep to start your personalized journey.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 px-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    disabled={isPending}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="college" className="text-sm font-medium">College</Label>
                  <Input 
                    id="college" 
                    placeholder="University of Innovation" 
                    required 
                    value={college} 
                    onChange={(e) => setCollege(e.target.value)} 
                    disabled={isPending}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={isPending}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 hover:scale-[1.02]" 
                  onClick={handleSendOtp} 
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Sending OTP...
                    </div>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 'otp' && (
            // Step 2: OTP and Password Form
             <>
              <CardHeader className="text-center space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <BrainCircuit className="h-16 w-16 text-primary animate-pulse-slow" />
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-lg opacity-50"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-headline bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                    Verify Your Email
                  </CardTitle>
                  <CardDescription className="text-base">
                    An OTP has been sent to <span className="font-medium text-primary">{email}</span>. Please enter it below and set your password.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 px-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp" className="text-sm font-medium">One-Time Password</Label>
                  <Input 
                    id="otp" 
                    placeholder="123456" 
                    required 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    disabled={isPending}
                    className="h-12 border-2 focus:border-primary transition-colors text-center text-lg tracking-widest"
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">Set Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={isPending}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 px-6 pb-6">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 hover:scale-[1.02]" 
                  onClick={handleVerifyOtp} 
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Register"
                  )}
                </Button>
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  onClick={() => setStep('details')} 
                  disabled={isPending}
                >
                  Change email
                </Button>
              </CardFooter>
            </>
          )}

          <div className="px-6 pb-6">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
