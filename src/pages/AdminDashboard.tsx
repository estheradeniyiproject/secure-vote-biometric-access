
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Users, 
  Vote, 
  Play, 
  Pause, 
  StopCircle, 
  Monitor,
  BarChart3,
  Settings,
  Eye,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VoterManagement from "@/components/admin/VoterManagement";
import CandidateManagement from "@/components/admin/CandidateManagement";
import LiveResults from "@/components/admin/LiveResults";

const AdminDashboard = () => {
  const [votingStatus, setVotingStatus] = useState<'stopped' | 'active' | 'paused'>('active');
  const [stats, setStats] = useState({
    totalVoters: 0,
    activeVoters: 0,
    totalVotes: 0,
    totalCandidates: 0
  });
  const [systemStatus] = useState('operational');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update stats every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Get total voters
      const { count: voterCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'voter');

      // Get active (verified) voters
      const { count: activeVoterCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'voter')
        .eq('is_verified', true);

      // Get total votes
      const { count: voteCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      // Get total candidates
      const { count: candidateCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalVoters: voterCount || 0,
        activeVoters: activeVoterCount || 0,
        totalVotes: voteCount || 0,
        totalCandidates: candidateCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVotingControl = async (action: 'start' | 'pause' | 'stop') => {
    try {
      // Get the current active election
      const { data: elections } = await supabase
        .from('elections')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      if (elections && elections.length > 0) {
        const newStatus = action === 'start' ? 'active' : action === 'pause' ? 'active' : 'closed';
        
        await supabase
          .from('elections')
          .update({ status: newStatus })
          .eq('id', elections[0].id);
      }

      setVotingStatus(action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped');
      
      const messages = {
        start: "Voting session has been started",
        pause: "Voting session has been paused", 
        stop: "Voting session has been stopped"
      };

      // Log audit event
      await supabase.rpc('log_audit_event', {
        action_text: `VOTING_${action.toUpperCase()}`,
        details_json: { action, timestamp: new Date().toISOString() }
      });

      toast({
        title: "Voting Control",
        description: messages[action],
      });
    } catch (error) {
      console.error('Error controlling voting:', error);
      toast({
        title: "Error",
        description: "Failed to update voting status",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "Admin session ended securely",
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage elections and monitor voting activity</p>
          </div>
          <Button onClick={handleLogout} variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Voters</p>
                  <p className="text-2xl font-bold">{stats.totalVoters.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Voters</p>
                  <p className="text-2xl font-bold">{stats.activeVoters.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Vote className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">System Status</p>
                  <Badge variant={systemStatus === 'operational' ? 'default' : 'destructive'}>
                    {systemStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voting Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Voting Session Control
            </CardTitle>
            <CardDescription>
              Current Status: <Badge variant={votingStatus === 'active' ? 'default' : votingStatus === 'paused' ? 'secondary' : 'destructive'}>
                {votingStatus.toUpperCase()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button 
                onClick={() => handleVotingControl('start')}
                disabled={votingStatus === 'active'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Voting
              </Button>
              <Button 
                onClick={() => handleVotingControl('pause')}
                disabled={votingStatus !== 'active'}
                variant="secondary"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Voting
              </Button>
              <Button 
                onClick={() => handleVotingControl('stop')}
                disabled={votingStatus === 'stopped'}
                variant="destructive"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Voting
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="voters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="voters">Voters</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Voter Management */}
          <TabsContent value="voters" className="space-y-4">
            <VoterManagement />
          </TabsContent>

          {/* Candidate Management */}
          <TabsContent value="candidates" className="space-y-4">
            <CandidateManagement />
          </TabsContent>

          {/* Live Results */}
          <TabsContent value="results" className="space-y-4">
            <LiveResults />
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="logs" className="space-y-4">
            <h2 className="text-xl font-semibold">Activity Logs</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center text-gray-500">
                    Activity logs will be populated from the database.
                    <br />
                    This feature can be enhanced to show real audit trail data.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
