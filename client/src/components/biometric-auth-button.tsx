import React from 'react';
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BiometricAuthButtonProps {
    onSuccess?: () => void;
    className?: string;
}

export function BiometricAuthButton({ onSuccess, className }: BiometricAuthButtonProps) {
    const { toast } = useToast();

    const handleAuth = async () => {
        // 1. Check if available
        if (!window.PublicKeyCredential) {
            toast({
                title: "Not Supported",
                description: "Biometric authentication is not supported on this device.",
                variant: "destructive"
            });
            return;
        }

        try {
            // 2. Mock Flow (Requires Backend Challenge)
            // In production: const options = await fetch('/api/auth/webauthn/start');
            // const credential = await navigator.credentials.get({ publicKey: ... });
            // await fetch('/api/auth/webauthn/finish', { body: credential });

            // Simulator
            toast({
                title: "Scanning...",
                description: "Please verify your identity with TouchID / FaceID."
            });

            setTimeout(() => {
                toast({
                    title: "Success",
                    description: "Biometric authentication successful."
                });
                onSuccess?.();
            }, 1000);

        } catch (error) {
            console.error("Biometric Error", error);
            toast({
                title: "Authentication Failed",
                description: "Could not verify identity.",
                variant: "destructive"
            });
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleAuth}
            className={`gap-2 ${className || ''}`}
        >
            <Fingerprint className="h-4 w-4" />
            Login with Touch ID
        </Button>
    );
}
