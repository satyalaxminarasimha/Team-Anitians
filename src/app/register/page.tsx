
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
    <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)] px-4 py-8">
      <Card className="w-full max-w-sm">
        {step === 'details' && (
          // Step 1: User Details Form
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <BrainCircuit className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
              <CardDescription>
                Join Exam AI Prep to start your personalized journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={isPending}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="college">College</Label>
                <Input id="college" placeholder="University of Innovation" required value={college} onChange={(e) => setCollege(e.target.value)} disabled={isPending}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending}/>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSendOtp} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Send OTP"}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 'otp' && (
          // Step 2: OTP and Password Form
           <>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                <CardDescription>
                    An OTP has been sent to {email}. Please enter it below and set your password.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="otp">One-Time Password</Label>
                    <Input id="otp" placeholder="123456" required value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isPending}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="password">Set Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending}/>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button className="w-full" onClick={handleVerifyOtp} disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : "Verify & Register"}
                </Button>
                <Button variant="link" className="text-sm" onClick={() => setStep('details')} disabled={isPending}>
                    Change email
                </Button>
            </CardFooter>
          </>
        )}

        <p className="px-6 pb-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
