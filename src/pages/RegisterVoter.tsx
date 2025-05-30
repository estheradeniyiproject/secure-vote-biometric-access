import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Fingerprint, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const RegisterVoter = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    idNumber: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [biometricStep, setBiometricStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBiometricSetup = async () => {
    try {
      setBiometricStep(1);
      toast({
        title: "Setting up Fingerprint",
        description: "Please place your finger on the sensor",
      });

      // Simulate fingerprint setup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setBiometricStep(2);
      toast({
        title: "Fingerprint Registered ✓",
        description: "Now setting up face recognition",
      });

      // Simulate face recognition setup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setBiometricStep(3);
      toast({
        title: "Face Recognition Setup Complete ✓",
        description: "Biometric profile created successfully",
      });

      return true;
    } catch (error) {
      toast({
        title: "Biometric Setup Failed",
        description: "Please try again",
        variant: "destructive"
      });
      setBiometricStep(0);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone', 'address', 'dateOfBirth', 'gender', 'idNumber'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
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
            role: 'voter'
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
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone,
            address: formData.address,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            national_id: formData.idNumber,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      // Setup biometrics
      const biometricSuccess = await handleBiometricSetup();
      
      if (biometricSuccess) {
        toast({
          title: "Registration Successful!",
          description: "Your account has been created. Please check your email to verify your account.",
        });

        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Voter Registration</h1>
            <p className="text-gray-600">Register to participate in secure voting</p>
          </div>
        </div>

        {/* Biometric Setup Progress */}
        {isRegistering && biometricStep > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold mb-4">Setting up Biometric Security</h3>
                <div className="flex items-center justify-center space-x-6">
                  <div className={`flex flex-col items-center space-y-2 ${biometricStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                    <Fingerprint className="h-8 w-8" />
                    <span className="text-sm">Fingerprint</span>
                    {biometricStep >= 2 && <span className="text-green-600">✓</span>}
                  </div>
                  <div className="h-1 w-16 bg-gray-300 rounded">
                    <div className={`h-full bg-green-600 rounded transition-all duration-1000 ${biometricStep >= 2 ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  <div className={`flex flex-col items-center space-y-2 ${biometricStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                    <Eye className="h-8 w-8" />
                    <span className="text-sm">Face Recognition</span>
                    {biometricStep >= 3 && <span className="text-green-600">✓</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-green-100">
              All fields are required for voter registration
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

              {/* Authentication Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
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
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="idNumber">National ID Number</Label>
                  <Input
                    id="idNumber"
                    placeholder="ID Number"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Full Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    placeholder="Enter your complete address"
                    className="pl-10"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      className="pl-10"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={isRegistering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 py-3"
              >
                {isRegistering ? 'Setting up your account...' : 'Register & Setup Biometrics'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterVoter;
