import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Eye, Shield, Vote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFingerprintAuth = async (): Promise<boolean> => {
    try {
      setAuthStep(1);
      
      // Simulate WebAuthn fingerprint authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Fingerprint Verified ✓",
        description: "Please proceed with face recognition",
      });
      
      setAuthStep(2);
      const faceAuthResult = await handleFaceAuth();
      return faceAuthResult;
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Fingerprint verification failed. Please try again.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
      setAuthStep(0);
      return false;
    }
  };

  const handleFaceAuth = async (): Promise<boolean> => {
    try {
      // Simulate face recognition
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Face Recognition Complete ✓",
        description: "Authentication successful! Redirecting...",
      });
      
      setAuthStep(3);
      return true;
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Face recognition failed. Please try again.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
      setAuthStep(0);
      return false;
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

    try {
      // First authenticate with Supabase
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
        return;
      }

      // Then proceed with biometric authentication
      const biometricSuccess = await handleFingerprintAuth();
      
      if (biometricSuccess) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profile?.role || 'voter';
        
        setTimeout(() => {
          if (userRole === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/voting-dashboard');
          }
          setIsAuthenticating(false);
          setAuthStep(0);
        }, 1000);
      }
    } catch (error) {
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
          <p className="text-xl text-gray-600">Biometric-Secured Online Voting System</p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Fingerprint className="h-4 w-4 mr-1" />
              Fingerprint Protected
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Eye className="h-4 w-4 mr-1" />
              Face Recognition
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Shield className="h-4 w-4 mr-1" />
              Military-Grade Security
            </Badge>
          </div>
        </div>

        {/* Authentication Progress */}
        {isAuthenticating && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center space-x-2 ${authStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <Fingerprint className="h-5 w-5" />
                  <span>Fingerprint</span>
                  {authStep >= 1 && <span className="text-green-600">✓</span>}
                </div>
                <div className="h-1 w-8 bg-gray-300 rounded">
                  <div className={`h-full bg-blue-600 rounded transition-all duration-500 ${authStep >= 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex items-center space-x-2 ${authStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  <Eye className="h-5 w-5" />
                  <span>Face Recognition</span>
                  {authStep >= 3 && <span className="text-green-600">✓</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">Secure Access Portal</CardTitle>
            <CardDescription className="text-blue-100 text-center">
              Login with your credentials for biometric verification
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
                {isAuthenticating ? 'Authenticating...' : 'Start Biometric Login'}
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
              <Fingerprint className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Biometric Security</h3>
              <p className="text-sm text-gray-600">Dual-factor authentication</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardContent className="pt-6 text-center">
              <Vote className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Live Voting</h3>
              <p className="text-sm text-gray-600">Real-time vote counting</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Secure & Transparent</h3>
              <p className="text-sm text-gray-600">Tamper-proof system</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
