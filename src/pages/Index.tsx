import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { MemberCard } from "@/components/MemberCard";
import { DirectorySearch } from "@/components/DirectorySearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sampleMembers, filterOptions, type MemberData } from "@/data/sampleMembers";
import { Users, Building, GraduationCap, Globe } from "lucide-react";

interface ActiveFilters {
  program?: string;
  orgType?: string;
  graduationYear?: string;
  location?: string;
  experienceLevel?: string;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [currentUser] = useState({
    name: "John Doe",
    role: "member" as const,
    profileComplete: true
  });

  const filteredMembers = useMemo(() => {
    let filtered = sampleMembers.filter(member => member.status === 'approved');

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.firstName.toLowerCase().includes(query) ||
        member.lastName.toLowerCase().includes(query) ||
        member.currentOrg.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.interests.some(interest => interest.toLowerCase().includes(query)) ||
        member.city.toLowerCase().includes(query) ||
        member.country.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (activeFilters.program) {
      filtered = filtered.filter(member => member.program === activeFilters.program);
    }
    if (activeFilters.orgType) {
      filtered = filtered.filter(member => member.orgType === activeFilters.orgType);
    }
    if (activeFilters.graduationYear) {
      filtered = filtered.filter(member => member.graduationYear.toString() === activeFilters.graduationYear);
    }
    if (activeFilters.location) {
      filtered = filtered.filter(member => `${member.city}, ${member.country}` === activeFilters.location);
    }
    if (activeFilters.experienceLevel) {
      const [min, max] = activeFilters.experienceLevel.includes('+') 
        ? [parseInt(activeFilters.experienceLevel), Infinity]
        : activeFilters.experienceLevel.split('-').map(n => parseInt(n));
      filtered = filtered.filter(member => 
        member.yearsExperience >= min && (max === Infinity || member.yearsExperience <= max)
      );
    }

    return filtered;
  }, [searchQuery, activeFilters]);

  const stats = useMemo(() => {
    const approvedMembers = sampleMembers.filter(m => m.status === 'approved');
    return {
      totalMembers: approvedMembers.length,
      programs: new Set(approvedMembers.map(m => m.program)).size,
      organizations: new Set(approvedMembers.map(m => m.currentOrg)).size,
      countries: new Set(approvedMembers.map(m => m.country)).size
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-healthcare-surface to-background">
      <Header currentUser={currentUser} />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              IIMA Healthcare SIG Alumni Directory
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with fellow alumni shaping the future of healthcare across the globe. 
              Discover expertise, build networks, and collaborate on transformative healthcare initiatives.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                <p className="text-sm text-muted-foreground">Members</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="pt-6 text-center">
                <GraduationCap className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.programs}</div>
                <p className="text-sm text-muted-foreground">Programs</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <Building className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.organizations}</div>
                <p className="text-sm text-muted-foreground">Organizations</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="pt-6 text-center">
                <Globe className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.countries}</div>
                <p className="text-sm text-muted-foreground">Countries</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DirectorySearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              filterOptions={filterOptions}
              resultsCount={filteredMembers.length}
            />
          </CardContent>
        </Card>

        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                showContactInfo={true}
                onViewProfile={(id) => console.log('View profile:', id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find more members.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilters({});
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        {!currentUser && (
          <Card className="mt-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Join the IIMA Healthcare SIG Alumni Network</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Connect with healthcare professionals from IIM Ahmedabad and expand your network 
                in the healthcare industry. Apply to join our exclusive community today.
              </p>
              <Button size="lg">
                Apply to Join SIG
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
