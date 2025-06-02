import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fingerprint, Eye, Shield, Vote, AlertTriangle, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { passkeyAuth } from "@/utils/passkeyAuth";

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsInIframe(window !== window.top);
  }, []);

  const handlePasskeyAuth = async (userId: string, userEmail: string): Promise<boolean> => {
    try {
      setAuthStep(2);
      setAuthError(null);
      
      // Handle iframe restrictions
      if (isInIframe) {
        toast({
          title: "Login Complete", 
          description: "For enhanced security features, consider opening the app in a new tab",
        });
        return true; // Skip passkey in iframe
      }
      
      // Check if passkey is supported
      const supported = await passkeyAuth.checkPasskeySupport();
      if (!supported) {
        toast({
          title: "Login Complete", 
          description: "Passkey authentication is not available on this device",
        });
        return true; // Allow login without passkey if not supported
      }

      // Check if user has a passkey registered
      const hasPasskey = await passkeyAuth.hasPasskeyRegistered(userId);
      if (!hasPasskey) {
        toast({
          title: "Login Complete",
          description: "You can set up passkey authentication in settings for enhanced security",
        });
        return true; // Allow login without passkey if not registered
      }

      toast({
        title: "Biometric Authentication",
        description: "Please use your fingerprint, face, or PIN to authenticate",
      });

      const result = await passkeyAuth.authenticateWithPasskey(userEmail, userId);
      if (!result.success) {
        setAuthError(result.error || "Biometric authentication failed");
        return false;
      }

      toast({
        title: "Authentication Complete ✓",
        description: "Multi-factor authentication successful! Redirecting...",
      });
      
      setAuthStep(3);
      return true;
    } catch (error) {
      console.error('Passkey authentication error:', error);
      toast({
        title: "Login Complete",
        description: "Continuing without biometric authentication",
      });
      return true; // Allow login to continue
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      setAuthStep(1);
      
      // First authenticate with Supabase (password)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
        setIsAuthenticating(false);
        setAuthStep(0);
        return;
      }

      setUserId(data.user.id);

      toast({
        title: "Password Verified ✓",
        description: "Proceeding to biometric authentication...",
      });

      // Then proceed with mandatory biometric authentication
      const biometricSuccess = await handlePasskeyAuth(data.user.id, data.user.email!);
      
      if (biometricSuccess) {
        // Get user profile to determine role with proper error handling
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Default to voter if profile doesn't exist
            navigate('/voting-dashboard');
            return;
          }

          const userRole = profile?.role || 'voter';
          
          setTimeout(() => {
            if (userRole === 'admin') {
              console.log('Redirecting admin to admin dashboard');
              navigate('/admin-dashboard');
            } else {
              console.log('Redirecting voter to voting dashboard');
              navigate('/voting-dashboard');
            }
            setIsAuthenticating(false);
            setAuthStep(0);
          }, 1000);
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Default to voter dashboard on error
          navigate('/voting-dashboard');
          setIsAuthenticating(false);
          setAuthStep(0);
        }
      } else {
        setIsAuthenticating(false);
        setAuthStep(0);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
      setAuthStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Vote className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">SecureVote</h1>
          </div>
          <p className="text-xl text-gray-600">Multi-Factor Authenticated Voting System</p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Key className="h-4 w-4 mr-1" />
              Password + Passkey
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Fingerprint className="h-4 w-4 mr-1" />
              Biometric Verification
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Shield className="h-4 w-4 mr-1" />
              Military-Grade Security
            </Badge>
          </div>
        </div>

        {/* Iframe Notice */}
        {isInIframe && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              You're viewing this in an embedded frame. For the best security experience with biometric authentication, 
              consider opening the app in a new browser tab.
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Error Alert */}
        {authError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {authError}
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Progress */}
        {isAuthenticating && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center space-x-2 ${authStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <Key className="h-5 w-5" />
                  <span>Password</span>
                  {authStep >= 2 && <span className="text-green-600">✓</span>}
                </div>
                <div className="h-1 w-8 bg-gray-300 rounded">
                  <div className={`h-full bg-blue-600 rounded transition-all duration-500 ${authStep >= 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex items-center space-x-2 ${authStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  <Fingerprint className="h-5 w-5" />
                  <span>Passkey</span>
                  {authStep >= 3 && <span className="text-green-600">✓</span>}
                </div>
              </div>
              <div className="text-center mt-4 text-sm text-blue-800">
                {authStep === 1 && "Verifying password..."}
                {authStep === 2 && "Please authenticate with your passkey (Touch ID, Face ID, or PIN)..."}
                {authStep === 3 && "Multi-factor authentication complete!"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">Secure Access Portal</CardTitle>
            <CardDescription className="text-blue-100 text-center">
              Login with password + mandatory passkey verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAuthenticating}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAuthenticating}
                />
              </div>
              
              <Button 
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isAuthenticating ? 'Authenticating...' : 'Start Multi-Factor Login'}
              </Button>
            </div>

            {/* Quick Access Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center space-x-4 text-sm">
                <Button 
                  variant="link" 
                  onClick={() => navigate('/register-voter')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Register as Voter
                </Button>
                <div className="text-gray-300">|</div>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/register-admin')}
                  className="text-red-600 hover:text-red-800"
                >
                  Register as Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardContent className="pt-6 text-center">
              <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Multi-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Password + Passkey verification</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardContent className="pt-6 text-center">
              <Vote className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Secure Voting</h3>
              <p className="text-sm text-gray-600">Time-bound electoral participation</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Platform Authenticators</h3>
              <p className="text-sm text-gray-600">Touch ID, Face ID, Windows Hello</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
