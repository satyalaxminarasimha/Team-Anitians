/**
 * @fileOverview This file defines the Contact Us page.
 * It provides a clean layout with a title and imports the main `ContactForm` component.
 */

import { ContactForm } from "@/components/contact-form";

/**
 * @component ContactPage
 * @description The main page component for the contact section.
 * @returns {React.ReactElement} The rendered contact page.
 */
export default function ContactPage() {
    return (
        <div className="container mx-auto max-w-3xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
                    Contact Us
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
                    Have questions or feedback? We'd love to hear from you.
                </p>
            </div>
            <ContactForm />
        </div>
    );
}
