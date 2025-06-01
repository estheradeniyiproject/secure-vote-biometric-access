
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Shield, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passkeyAuth } from "@/utils/passkeyAuth";
import { useAuth } from "@/hooks/useAuth";

const PasskeySetup = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkSupport = async () => {
      // Check if we're in an iframe
      const inIframe = window !== window.top;
      setIsInIframe(inIframe);
      
      const supported = await passkeyAuth.checkPasskeySupport();
      setIsSupported(supported);
      
      if (user?.id) {
        const registered = await passkeyAuth.hasPasskeyRegistered(user.id);
        setHasPasskey(registered);
      }
    };

    checkSupport();
  }, [user]);

  const handleRegisterPasskey = async () => {
    if (!user?.email || !user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);

    try {
      const result = await passkeyAuth.registerPasskey(user.email, user.id);
      
      if (result.success) {
        setHasPasskey(true);
        toast({
          title: "Passkey Registered Successfully",
          description: "Your biometric authentication is now set up and ready to use"
        });
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to register passkey",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred during passkey registration",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemovePasskey = async () => {
    if (!user?.id) return;

    setIsRemoving(true);

    try {
      await passkeyAuth.removePasskey(user.id);
      setHasPasskey(false);
      toast({
        title: "Passkey Removed",
        description: "Your passkey has been successfully removed"
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: "Failed to remove passkey",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  if (isSupported === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Checking passkey support...</div>
        </CardContent>
      </Card>
    );
  }

  if (isInIframe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-orange-500" />
            Passkey Setup
          </CardTitle>
          <CardDescription>
            Enhanced biometric authentication using passkeys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              Passkey authentication requires opening the app in a new browser tab for security reasons.
              <Button 
                variant="link" 
                onClick={openInNewTab}
                className="p-0 ml-2 text-orange-800 underline"
              >
                Open in new tab
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-500" />
            Passkey Setup
          </CardTitle>
          <CardDescription>
            Enhanced biometric authentication using passkeys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Passkey authentication is not supported on this device. Please use a device with 
              Touch ID, Face ID, Windows Hello, or other platform authenticators.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Fingerprint className="h-5 w-5 mr-2 text-blue-600" />
          Passkey Setup
        </CardTitle>
        <CardDescription>
          Set up biometric authentication using your device's secure authenticators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Biometric Authentication</h3>
              <p className="text-sm text-gray-600">
                Use Touch ID, Face ID, or Windows Hello for secure login
              </p>
            </div>
          </div>
          {hasPasskey ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline">Not Set Up</Badge>
          )}
        </div>

        {hasPasskey ? (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                Passkey authentication is active. You can now use biometric authentication for secure login.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              onClick={handleRemovePasskey}
              disabled={isRemoving}
              className="w-full"
            >
              {isRemoving ? 'Removing...' : 'Remove Passkey'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Enhanced Security:</strong> Setting up a passkey adds an extra layer of protection 
                and enables convenient biometric login.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isRegistering ? 'Setting Up Passkey...' : 'Set Up Passkey'}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Passkeys use your device's built-in security features</p>
          <p>• Your biometric data never leaves your device</p>
          <p>• Works with Touch ID, Face ID, Windows Hello, and more</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasskeySetup;
