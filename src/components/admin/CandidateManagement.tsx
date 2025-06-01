
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<'candidates'>;
type Election = Tables<'elections'>;

interface CandidateWithElection extends Candidate {
  election_title?: string;
}

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState<CandidateWithElection[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    bio: '',
    manifesto: '',
    photo_url: '',
    election_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          election:elections(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const candidatesWithElection = data?.map(candidate => ({
        ...candidate,
        election_title: candidate.election?.title
      })) || [];

      setCandidates(candidatesWithElection);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      party: '',
      bio: '',
      manifesto: '',
      photo_url: '',
      election_id: ''
    });
  };

  const handleAddCandidate = async () => {
    if (!formData.name || !formData.election_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .insert({
          name: formData.name,
          party: formData.party,
          bio: formData.bio,
          manifesto: formData.manifesto,
          photo_url: formData.photo_url,
          election_id: formData.election_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate added successfully"
      });

      fetchCandidates();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCandidate = async () => {
    if (!selectedCandidate || !formData.name || !formData.election_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          name: formData.name,
          party: formData.party,
          bio: formData.bio,
          manifesto: formData.manifesto,
          photo_url: formData.photo_url,
          election_id: formData.election_id
        })
        .eq('id', selectedCandidate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate updated successfully"
      });

      fetchCandidates();
      setShowEditDialog(false);
      setSelectedCandidate(null);
      resetForm();
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Error",
        description: "Failed to update candidate",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate deleted successfully"
      });

      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      name: candidate.name,
      party: candidate.party || '',
      bio: candidate.bio || '',
      manifesto: candidate.manifesto || '',
      photo_url: candidate.photo_url || '',
      election_id: candidate.election_id || ''
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading candidates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Candidate Management
        </h2>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
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
                    <AvatarImage src={candidate.photo_url || undefined} alt={candidate.name} />
                    <AvatarFallback>
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <p className="text-gray-600">{candidate.party}</p>
                    <p className="text-sm text-blue-600">{candidate.election_title}</p>
                    {candidate.bio && (
                      <p className="text-sm text-gray-500 mt-1">{candidate.bio.substring(0, 100)}...</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(candidate)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteCandidate(candidate.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Candidate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
            <DialogDescription>
              Enter the candidate's information and select the election
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="election">Election *</Label>
              <Select value={formData.election_id} onValueChange={(value) => setFormData({...formData, election_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter candidate's full name"
                />
              </div>
              <div>
                <Label htmlFor="party">Political Party</Label>
                <Input
                  id="party"
                  value={formData.party}
                  onChange={(e) => setFormData({...formData, party: e.target.value})}
                  placeholder="Enter political party"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                placeholder="Enter photo URL"
              />
            </div>
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Enter candidate's biography"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="manifesto">Manifesto</Label>
              <Textarea
                id="manifesto"
                value={formData.manifesto}
                onChange={(e) => setFormData({...formData, manifesto: e.target.value})}
                placeholder="Enter candidate's manifesto"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCandidate}>
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update the candidate's information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-election">Election *</Label>
              <Select value={formData.election_id} onValueChange={(value) => setFormData({...formData, election_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter candidate's full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-party">Political Party</Label>
                <Input
                  id="edit-party"
                  value={formData.party}
                  onChange={(e) => setFormData({...formData, party: e.target.value})}
                  placeholder="Enter political party"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-photo_url">Photo URL</Label>
              <Input
                id="edit-photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                placeholder="Enter photo URL"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Biography</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Enter candidate's biography"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-manifesto">Manifesto</Label>
              <Textarea
                id="edit-manifesto"
                value={formData.manifesto}
                onChange={(e) => setFormData({...formData, manifesto: e.target.value})}
                placeholder="Enter candidate's manifesto"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCandidate}>
              Update Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateManagement;
