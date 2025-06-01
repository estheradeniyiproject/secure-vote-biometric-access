
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Vote, BarChart3, LogOut, User } from "lucide-react";
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Vote className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
                <Badge variant="destructive">Admin</Badge>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVoters.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalElections}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeElections}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
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
            <TabsTrigger value="voters">Voters</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
          </TabsList>

          <TabsContent value="elections" className="space-y-4">
            <ElectionManagement />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="voters" className="space-y-4">
            <VoterManagement />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <LiveResults />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
