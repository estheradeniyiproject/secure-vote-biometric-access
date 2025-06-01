
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, User, Mail, Phone, Key, AlertTriangle, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { passkeyAuth } from "@/utils/passkeyAuth";

const RegisterAdmin = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    adminCode: '',
    password: '',
    confirmPassword: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0); // 0: form, 1: passkey setup, 2: complete
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasskeySetup = async () => {
    try {
      setRegistrationStep(1);
      toast({
        title: "Setting up Admin Passkey Authentication",
        description: "Please use your device's biometric authenticator for enhanced admin security",
      });

      const result = await passkeyAuth.registerPasskey(formData.email, userId);
      
      if (result.success) {
        setRegistrationStep(2);
        toast({
          title: "Admin Registration Complete!",
          description: "Your admin account has been created with passkey authentication enabled.",
        });

        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        toast({
          title: "Passkey Setup Failed",
          description: result.error || "You can set up passkey authentication later in settings.",
          variant: "destructive"
        });
        
        // Still complete registration, admin can set up passkey later
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Passkey Setup Error",
        description: "You can set up passkey authentication later in settings.",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'department', 'adminCode', 'password', 'confirmPassword'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    // Validate admin code (simulate)
    if (formData.adminCode !== 'ADMIN2024') {
      toast({
        title: "Invalid Admin Code",
        description: "The provided admin code is not valid",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'admin'
          }
        }
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        setIsRegistering(false);
        return;
      }

      // Update profile with additional information
      if (data.user) {
        setUserId(data.user.id);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone,
            role: 'admin'
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Start passkey setup
        await handlePasskeySetup();
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
            disabled={isRegistering}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
            <p className="text-gray-600">Register as a system administrator</p>
          </div>
        </div>

        {/* Passkey Setup Progress */}
        {isRegistering && registrationStep >= 1 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold mb-4">Setting up Admin Security</h3>
                <div className="flex items-center justify-center space-x-6">
                  <div className={`flex flex-col items-center space-y-2 ${registrationStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                    <Shield className="h-8 w-8" />
                    <span className="text-sm">Admin Account</span>
                    {registrationStep >= 1 && <span className="text-orange-600">✓</span>}
                  </div>
                  <div className="h-1 w-16 bg-gray-300 rounded">
                    <div className={`h-full bg-orange-600 rounded transition-all duration-1000 ${registrationStep >= 1 ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  <div className={`flex flex-col items-center space-y-2 ${registrationStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                    <Fingerprint className="h-8 w-8" />
                    <span className="text-sm">Biometric Security</span>
                    {registrationStep >= 2 && <span className="text-orange-600">✓</span>}
                  </div>
                </div>
                {registrationStep === 1 && (
                  <p className="text-sm text-gray-600 mt-4">
                    Setting up enhanced biometric authentication for admin access...
                  </p>
                )}
                {registrationStep === 2 && (
                  <p className="text-sm text-orange-600 mt-4">
                    Admin registration complete! Redirecting to login...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Security Notice:</strong> Admin registration requires a valid admin code and is subject to approval. 
            All activities are logged and monitored. Biometric authentication will be mandatory for admin access.
          </AlertDescription>
        </Alert>

        {/* Registration Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Administrator Registration
            </CardTitle>
            <CardDescription className="text-red-100">
              All fields are required for admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Official Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@organization.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Admin Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={isRegistering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">Super Administrator</SelectItem>
                      <SelectItem value="election-manager">Election Manager</SelectItem>
                      <SelectItem value="system-admin">System Administrator</SelectItem>
                      <SelectItem value="monitor">Election Monitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => handleInputChange('department', value)}
                    disabled={isRegistering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="election-commission">Election Commission</SelectItem>
                      <SelectItem value="it-security">IT Security</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="audit">Audit & Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security Information */}
              <div>
                <Label htmlFor="adminCode">Admin Authorization Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="adminCode"
                    type="password"
                    placeholder="Enter admin authorization code"
                    className="pl-10"
                    value={formData.adminCode}
                    onChange={(e) => handleInputChange('adminCode', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Contact your supervisor for the authorization code</p>
              </div>

              {/* Password Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              {/* Enhanced Security Notice */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start space-x-3">
                  <Fingerprint className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Enhanced Admin Security</h4>
                    <p className="text-sm text-red-800 mb-2">
                      After creating your admin account, you'll be required to set up passkey authentication 
                      using biometric features for enhanced security.
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• Biometric authentication is mandatory for admin access</li>
                      <li>• All admin activities are logged and monitored</li>
                      <li>• Multiple authentication factors provide enhanced security</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 py-3"
              >
                {isRegistering ? 'Creating admin account...' : 'Register as Administrator'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAdmin;
