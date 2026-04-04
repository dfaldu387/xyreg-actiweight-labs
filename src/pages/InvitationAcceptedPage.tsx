import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    Mail,
    Clock,
    Sparkles,
    Star,
    RefreshCw,
    ExternalLink,
    Bell,
    LogIn
} from "lucide-react";

export default function InvitationAcceptedPage() {
    const navigate = useNavigate();
    const [showConfetti, setShowConfetti] = useState(true);
    const [countdown, setCountdown] = useState(60);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        // Simulate email sending process
        const emailTimer = setTimeout(() => {
            setEmailSent(true);
        }, 2000);

        // Confetti effect
        const confettiTimer = setTimeout(() => {
            setShowConfetti(false);
        }, 4000);

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(emailTimer);
            clearTimeout(confettiTimer);
            clearInterval(countdownInterval);
        };
    }, []);

    // const handleCheckEmail = () => {
    //     // Open email client (you can customize this based on your needs)
    //     window.open('mailto:', '_blank');
    // };

    const handleResendEmail = () => {
        // Implement resend email functionality
        setEmailSent(false);
        setTimeout(() => setEmailSent(true), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-muted rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse delay-500"></div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(60)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 3}s`
                            }}
                        >
                            {Math.random() > 0.6 ? (
                                <Star className="text-primary h-4 w-4 fill-current" />
                            ) : Math.random() > 0.3 ? (
                                <Sparkles className="text-primary h-4 w-4" />
                            ) : (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="max-w-4xl w-full space-y-8">

                    {/* Main Success Card */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border p-8 md:p-12 text-center">

                        {/* Success Header */}
                        <div className="space-y-6 mb-12">
                            <div className="relative">
                                <div className="mx-auto w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
                                    <CheckCircle className="text-primary-foreground" size={64} />
                                </div>

                                {/* Floating elements around success icon */}
                                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce">
                                    <Star className="text-primary-foreground h-4 w-4 fill-current" />
                                </div>
                                <div className="absolute -bottom-2 -left-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                                    <Sparkles className="text-primary-foreground h-3 w-3" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                                    Welcome Aboard! 🎉
                                </h1>
                                <div className="max-w-2xl mx-auto space-y-3">
                                    <p className="text-xl text-foreground font-medium">
                                        Congratulations! You've successfully accepted the company invitation.
                                    </p>
                                    <p className="text-lg text-muted-foreground">
                                        We're excited to have you join our team and can't wait to see what amazing things we'll accomplish together!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email Notification Section */}
                        <div className="bg-muted/50 rounded-2xl p-8 mb-8 border border-border">
                            <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
                                <div className="flex-1 text-left space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                            <Mail className="text-primary-foreground h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">Check Your Email!</h3>
                                            <p className="text-primary font-medium">Login details are on the way</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {!emailSent ? (
                                            <div className="flex items-center space-x-3 text-muted-foreground">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span>Preparing your login credentials...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-3 text-primary">
                                                <CheckCircle className="h-5 w-5" />
                                                <span className="font-medium">Email sent successfully!</span>
                                            </div>
                                        )}

                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            We've sent a separate email containing your login username, temporary password, and step-by-step instructions to get started. Please check your inbox (and spam folder just in case).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-3">
                                    {/* <Button
                                        onClick={handleCheckEmail}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Mail className="mr-2 h-4 w-4" />
                                        Open Email App
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button> */}

                                    {emailSent && (
                                        <Button
                                            onClick={handleResendEmail}
                                            variant="outline"
                                            className="border-2 border-border hover:border-border/80 text-foreground hover:bg-muted font-medium px-6 py-2 rounded-xl transition-all duration-300"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Resend Email
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* Action Button */}
                        <div className="flex justify-center mt-6">
                            <Button
                                onClick={() => navigate("/")}
                                className="font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                                size="lg"
                            >
                                <LogIn className="mr-2 h-5 w-5" />
                                Go to Login
                            </Button>
                        </div>

                        {/* Email Timer */}
                        {countdown > 0 && (
                            <div className="mt-8 p-4 bg-muted/50 border border-border rounded-xl">
                                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Email delivery in progress... ({countdown}s)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help Section */}
                    <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-lg border border-border p-6 text-center">
                        <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                                <Bell className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Need Help?</h3>
                            </div>
                            <p className="text-muted-foreground">
                                If you don't receive the email within 10 minutes, please check your spam folder or{" "}
                                <a href="mailto:support@xyreg.com" className="text-primary hover:text-primary/80 font-medium underline">
                                    contact our support team
                                </a>
                                {" "}for assistance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}