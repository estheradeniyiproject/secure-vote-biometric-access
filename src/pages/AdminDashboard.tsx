
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, Vote, BarChart3, LogOut, User, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ElectionManagement from "@/components/admin/ElectionManagement";
import VoterManagement from "@/components/admin/VoterManagement";
import CandidateManagement from "@/components/admin/CandidateManagement";
import LiveResults from "@/components/admin/LiveResults";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalElections: 0,
    activeElections: 0,
    totalVotes: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      verifyAdminAccess();
      fetchStats();
    }
  }, [user]);

  const verifyAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsAdmin(false);
        return;
      }

      if (profile?.role !== 'admin') {
        console.log('User is not an admin, redirecting to voter dashboard');
        setIsAdmin(false);
        navigate('/voting-dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error verifying admin access:', error);
      setIsAdmin(false);
      navigate('/voting-dashboard');
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch voters count
      const { count: votersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'voter');

      // Fetch elections count
      const { count: electionsCount } = await supabase
        .from('elections')
        .select('*', { count: 'exact', head: true });

      // Fetch active elections count
      const { count: activeElectionsCount } = await supabase
        .from('elections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total votes count
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalVoters: votersCount || 0,
        totalElections: electionsCount || 0,
        activeElections: activeElectionsCount || 0,
        totalVotes: votesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading while verifying admin access
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Verifying admin access...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Access denied. Admin privileges required.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/voting-dashboard')} 
              className="w-full mt-4"
            >
              Go to Voter Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Election Admin Panel</h1>
                  <p className="text-red-100">System Administration & Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
                <Badge variant="destructive" className="bg-red-500/80">
                  Admin
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVoters.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalElections}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeElections}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVotes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Votes cast</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="elections" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="voters">Voters</TabsTrigger>
          </TabsList>

          <TabsContent value="elections" className="space-y-4">
            <ElectionManagement />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <LiveResults />
          </TabsContent>

          <TabsContent value="voters" className="space-y-4">
            <VoterManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
