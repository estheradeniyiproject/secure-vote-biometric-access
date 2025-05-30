
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Eye, Shield, Vote, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [voterId, setVoterId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFingerprintAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthStep(1);
      
      // Simulate WebAuthn fingerprint authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Fingerprint Verified ✓",
        description: "Please proceed with face recognition",
      });
      
      setAuthStep(2);
      await handleFaceAuth();
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Fingerprint verification failed. Please try again.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
      setAuthStep(0);
    }
  };

  const handleFaceAuth = async () => {
    try {
      // Simulate face recognition
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Face Recognition Complete ✓",
        description: "Authentication successful! Redirecting...",
      });
      
      setAuthStep(3);
      setTimeout(() => {
        navigate('/voting-dashboard');
        setIsAuthenticating(false);
        setAuthStep(0);
      }, 1000);
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Face recognition failed. Please try again.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
      setAuthStep(0);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your admin ID",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    
    // Simulate admin authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Admin Login Successful",
      description: "Welcome to the admin dashboard",
    });
    
    navigate('/admin-dashboard');
    setIsAuthenticating(false);
  };

  const handleVoterLogin = async () => {
    if (!voterId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your voter ID",
        variant: "destructive"
      });
      return;
    }

    await handleFingerprintAuth();
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

        {/* Login Tabs */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">Secure Access Portal</CardTitle>
            <CardDescription className="text-blue-100 text-center">
              Choose your access level below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="voter" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="voter" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Voter Access</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Admin Access</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voter" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Voter Authentication</h3>
                  <p className="text-sm text-gray-600">Requires biometric verification</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voterId">Voter ID</Label>
                    <Input
                      id="voterId"
                      placeholder="Enter your voter ID"
                      value={voterId}
                      onChange={(e) => setVoterId(e.target.value)}
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleVoterLogin}
                    disabled={isAuthenticating}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isAuthenticating ? 'Authenticating...' : 'Start Biometric Login'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Administrator Access</h3>
                  <p className="text-sm text-gray-600">Secure admin portal</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adminId">Admin ID</Label>
                    <Input
                      id="adminId"
                      placeholder="Enter your admin ID"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAdminLogin}
                    disabled={isAuthenticating}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    {isAuthenticating ? 'Authenticating...' : 'Admin Login'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

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
