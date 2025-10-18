
"use client";
/**
 * @fileOverview This file contains the ContactForm component, which allows
 * users to send a message to the site administrator.
 */

import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { submitContactForm } from "@/app/contact/actions";

// Zod schema for form validation.
const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormInputs = z.infer<typeof contactSchema>;

/**
 * @component ContactForm
 * @description A form component for user inquiries. It uses `react-hook-form`
 * for state management and validation, and calls a server action to send the email.
 */
export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ContactFormInputs>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  /**
   * Handles the form submission.
   * @param {ContactFormInputs} data - The validated form data.
   */
  const onSubmit: SubmitHandler<ContactFormInputs> = (data) => {
    startTransition(async () => {
      const result = await submitContactForm(data);
      if (result.success) {
        toast({
          title: "Message Sent!",
          description: result.message,
        });
        form.reset(); // Clear the form on successful submission.
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  return (
    <Card className="shadow-lg">
       <CardHeader>
        <CardTitle className="font-headline">Send us a message</CardTitle>
        <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {form.formState.isSubmitSuccessful ? (
                 // Display a "Thank You" message after successful submission.
                 <div className="flex flex-col items-center justify-center text-center py-10 bg-secondary/50 rounded-md">
                    <h3 className="text-xl font-semibold text-primary">Thank You!</h3>
                    <p className="text-muted-foreground mt-2">Your message has been sent successfully.</p>
                </div>
            ) : (
                // Display the form fields.
                <>
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Your message..." {...field} rows={6}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
            )}
          </CardContent>
          {!form.formState.isSubmitSuccessful && (
            <CardFooter>
                <Button type="submit" disabled={isPending}>
                {isPending ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                    </>
                ) : (
                    <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                    </>
                )}
                </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
