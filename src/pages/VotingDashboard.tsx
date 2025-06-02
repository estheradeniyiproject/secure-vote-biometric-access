
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vote, Clock, Users, LogOut, Settings, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VotingInterface from "@/components/voter/VotingInterface";

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'closed';
  has_voted: boolean;
}

const VotingDashboard = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_eligible_elections', { voter_uuid: user.id });

      if (error) {
        console.error('Error fetching elections:', error);
        toast({
          title: "Error",
          description: "Failed to load elections",
          variant: "destructive"
        });
      } else {
        const electionsData = data || [];
        setElections(electionsData);
        
        // Auto-select the first active election
        const activeElection = electionsData.find((e: Election) => e.status === 'active');
        if (activeElection) {
          setSelectedElection(activeElection);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string, hasVoted: boolean) => {
    if (status === 'active') {
      return hasVoted ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    }
    if (status === 'closed') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const handleVoteSuccess = () => {
    fetchElections();
    if (selectedElection) {
      setSelectedElection({ ...selectedElection, has_voted: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Vote className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Voter Portal</h1>
                <p className="text-gray-600">Welcome, {user?.email}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>Loading elections...</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Election List Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Elections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {elections.length > 0 ? (
                    elections.map((election) => (
                      <div
                        key={election.id}
                        onClick={() => setSelectedElection(election)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedElection?.id === election.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-sm mb-2">{election.title}</h3>
                        <div className="space-y-1">
                          <Badge 
                            className={getStatusColor(election.status, election.has_voted)}
                            variant="secondary"
                          >
                            {election.status === 'active' && election.has_voted ? 'Voted' : election.status}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatDate(election.start_date)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        No elections available at the moment.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Voting Interface */}
            <div className="lg:col-span-3">
              {selectedElection ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <VotingInterface
                      election={selectedElection}
                      hasVoted={selectedElection.has_voted}
                      onVoteSuccess={handleVoteSuccess}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Vote className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select an Election
                    </h3>
                    <p className="text-gray-600">
                      Choose an election from the sidebar to view candidates and cast your vote.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingDashboard;
