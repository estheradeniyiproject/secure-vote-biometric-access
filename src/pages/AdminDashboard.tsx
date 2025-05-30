
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  Users, 
  Vote, 
  Plus, 
  Edit, 
  Trash2, 
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

// Mock data
const initialCandidates = [
  {
    id: 1,
    name: "Sarah Johnson",
    party: "Progressive Alliance",
    image: "/api/placeholder/100/100",
    votes: 1247,
    status: "active"
  },
  {
    id: 2,
    name: "Michael Chen",
    party: "Unity Coalition", 
    image: "/api/placeholder/100/100",
    votes: 1089,
    status: "active"
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    party: "New Horizons",
    image: "/api/placeholder/100/100",
    votes: 945,
    status: "active"
  }
];

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [votingStatus, setVotingStatus] = useState<'stopped' | 'active' | 'paused'>('active');
  const [totalVoters] = useState(15423);
  const [activeVoters] = useState(3281);
  const [systemStatus] = useState('operational');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Real-time vote updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (votingStatus === 'active') {
        setCandidates(prev => prev.map(candidate => ({
          ...candidate,
          votes: candidate.votes + Math.floor(Math.random() * 3)
        })));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [votingStatus]);

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  const handleVotingControl = (action: 'start' | 'pause' | 'stop') => {
    setVotingStatus(action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped');
    
    const messages = {
      start: "Voting session has been started",
      pause: "Voting session has been paused", 
      stop: "Voting session has been stopped"
    };

    toast({
      title: "Voting Control",
      description: messages[action],
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "Admin session ended securely",
    });
    navigate('/');
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
                  <p className="text-2xl font-bold">{totalVoters.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{activeVoters.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
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
        <Tabs defaultValue="candidates" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Candidates Management */}
          <TabsContent value="candidates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Candidate Management</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </div>
            
            <div className="grid gap-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={candidate.image} alt={candidate.name} />
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{candidate.name}</h3>
                          <p className="text-gray-600">{candidate.party}</p>
                          <Badge variant={candidate.status === 'active' ? 'default' : 'secondary'}>
                            {candidate.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Current Votes</p>
                          <p className="text-xl font-bold">{candidate.votes.toLocaleString()}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Live Results */}
          <TabsContent value="results" className="space-y-4">
            <h2 className="text-xl font-semibold">Live Election Results</h2>
            
            <div className="grid gap-4">
              {candidates.map((candidate) => {
                const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
                
                return (
                  <Card key={candidate.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={candidate.image} alt={candidate.name} />
                            <AvatarFallback>
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{candidate.name}</h3>
                            <p className="text-sm text-gray-600">{candidate.party}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{candidate.votes.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-4">
            <h2 className="text-xl font-semibold">Live Monitoring</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Live Camera Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-white text-center">
                      <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Camera Feed Active</p>
                      <p className="text-sm opacity-75">Monitoring voting area</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Real-time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Voter Turnout</span>
                        <span className="font-bold">{((totalVotes / totalVoters) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(totalVotes / totalVoters) * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">System Load</span>
                        <span className="font-bold">23%</span>
                      </div>
                      <Progress value={23} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Network Status</span>
                        <span className="font-bold">98%</span>
                      </div>
                      <Progress value={98} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="logs" className="space-y-4">
            <h2 className="text-xl font-semibold">Activity Logs</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[
                    { time: "14:23:45", action: "Vote cast", user: "Voter #12847", status: "success" },
                    { time: "14:23:12", action: "Biometric auth", user: "Voter #12846", status: "success" },
                    { time: "14:22:58", action: "Login attempt", user: "Voter #12845", status: "success" },
                    { time: "14:22:31", action: "Vote cast", user: "Voter #12844", status: "success" },
                    { time: "14:22:15", action: "Auth failed", user: "Unknown", status: "failed" },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 font-mono">{log.time}</span>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-gray-600">{log.user}</span>
                      </div>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
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
