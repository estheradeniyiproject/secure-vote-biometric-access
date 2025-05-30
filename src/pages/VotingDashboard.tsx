
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Vote, Users, Eye, Fingerprint, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock candidate data
const candidates = [
  {
    id: 1,
    name: "Sarah Johnson",
    party: "Progressive Alliance",
    image: "/api/placeholder/100/100",
    votes: 1247,
    manifesto: "Building a sustainable future with green energy, affordable healthcare, and quality education for all.",
    promises: ["Green Energy Initiative", "Universal Healthcare", "Education Reform", "Economic Growth"]
  },
  {
    id: 2,
    name: "Michael Chen",
    party: "Unity Coalition",
    image: "/api/placeholder/100/100",
    votes: 1089,
    manifesto: "Bringing communities together through innovation, infrastructure development, and social justice.",
    promises: ["Infrastructure Modernization", "Social Justice Reform", "Innovation Hubs", "Community Development"]
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    party: "New Horizons",
    image: "/api/placeholder/100/100",
    votes: 945,
    manifesto: "Creating opportunities for the next generation with technology, entrepreneurship, and inclusive policies.",
    promises: ["Tech Innovation", "Youth Programs", "Small Business Support", "Inclusive Policies"]
  }
];

const VotingDashboard = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votingStatus, setVotingStatus] = useState('open'); // open, closed, pending
  const [voteCount, setVoteCount] = useState(candidates);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const { toast } = useToast();
  const navigate = useNavigate();

  // Simulate real-time vote updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVoteCount(prev => prev.map(candidate => ({
        ...candidate,
        votes: candidate.votes + Math.floor(Math.random() * 3)
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          setVotingStatus('closed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalVotes = voteCount.reduce((sum, candidate) => sum + candidate.votes, 0);

  const handleVote = async () => {
    if (!selectedCandidate) {
      toast({
        title: "No candidate selected",
        description: "Please select a candidate before voting",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);

    try {
      toast({
        title: "Biometric Verification Required",
        description: "Please verify your identity to cast your vote",
      });

      // Simulate fingerprint verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Fingerprint Verified ✓",
        description: "Now verifying face recognition",
      });

      // Simulate face verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Face Recognition Complete ✓",
        description: "Casting your vote...",
      });

      // Cast vote
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setHasVoted(true);
      setVoteCount(prev => prev.map(candidate => 
        candidate.id === selectedCandidate 
          ? { ...candidate, votes: candidate.votes + 1 }
          : candidate
      ));

      toast({
        title: "Vote Cast Successfully! 🗳️",
        description: "Your vote has been recorded securely",
      });

    } catch (error) {
      toast({
        title: "Voting Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }

    setIsVoting(false);
  };

  const handleSecureExit = async () => {
    toast({
      title: "Secure Exit Required",
      description: "Please verify your identity to exit voting session",
    });

    // Simulate biometric verification for exit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Identity Verified",
      description: "Exiting secure voting session...",
    });

    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Secure Voting Dashboard</h1>
            <p className="text-gray-600">Cast your vote securely and transparently</p>
          </div>
          <Button 
            onClick={handleSecureExit}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Secure Exit</span>
          </Button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className="text-lg font-bold">{formatTime(timeRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Votes</p>
                  <p className="text-lg font-bold">{totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Vote className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Your Status</p>
                  <Badge variant={hasVoted ? "default" : "secondary"}>
                    {hasVoted ? "Voted" : "Not Voted"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Election Status</p>
                  <Badge variant={votingStatus === 'open' ? "default" : "destructive"}>
                    {votingStatus === 'open' ? "Active" : "Closed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voting Status Alert */}
        {votingStatus === 'closed' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Voting is now closed.</strong> No more votes can be cast. Results will be announced shortly.
            </AlertDescription>
          </Alert>
        )}

        {hasVoted && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Your vote has been recorded.</strong> Thank you for participating in the democratic process.
            </AlertDescription>
          </Alert>
        )}

        {/* Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {voteCount.map((candidate) => {
            const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
            const isSelected = selectedCandidate === candidate.id;
            
            return (
              <Card 
                key={candidate.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
                } ${hasVoted || votingStatus === 'closed' ? 'cursor-not-allowed opacity-75' : ''}`}
                onClick={() => {
                  if (!hasVoted && votingStatus === 'open') {
                    setSelectedCandidate(candidate.id);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={candidate.image} alt={candidate.name} />
                      <AvatarFallback className="text-lg">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{candidate.name}</CardTitle>
                      <CardDescription className="text-sm font-medium text-blue-600">
                        {candidate.party}
                      </CardDescription>
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Live Votes</span>
                          <span className="text-sm font-bold">{candidate.votes.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{candidate.manifesto}</p>
                  <div>
                    <p className="font-semibold text-sm mb-2">Key Promises:</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.promises.map((promise, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {promise}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Voting Action */}
        {!hasVoted && votingStatus === 'open' && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Cast Your Vote?</h3>
                <p className="mb-4 text-blue-100">
                  {selectedCandidate 
                    ? `You have selected ${voteCount.find(c => c.id === selectedCandidate)?.name}` 
                    : "Please select a candidate above"
                  }
                </p>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2 text-blue-100">
                    <Fingerprint className="h-4 w-4" />
                    <span className="text-sm">Fingerprint Required</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-100">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Face Recognition Required</span>
                  </div>
                </div>
                <Button 
                  onClick={handleVote}
                  disabled={!selectedCandidate || isVoting}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
                >
                  {isVoting ? 'Verifying & Casting Vote...' : 'Cast Your Vote Securely'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VotingDashboard;
