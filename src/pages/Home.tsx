import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, CAMPUS_LOCATIONS, type Category, type CampusLocation } from '@/types';
import ListingCard from '@/components/ListingCard';
import NeedRequestCard from '@/components/NeedRequestCard';
import { listingStorage, needRequestStorage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get all listings and requests
  const allListings = listingStorage.getAll().filter((l) => l.status === 'available');
  const allRequests = needRequestStorage.getAll().filter((r) => r.status === 'open');

  // Apply filters
  const filteredListings = allListings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || listing.location === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const filteredRequests = allRequests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || request.preferredLocation === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Find what you need or sell what you don't
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary text-primary-foreground' : ''}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 animate-fade-in">
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as Category | 'all')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={locationFilter}
              onValueChange={(v) => setLocationFilter(v as CampusLocation | 'all')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {CAMPUS_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(categoryFilter !== 'all' || locationFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setLocationFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="selling" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selling" className="gap-2">
            <span className="w-2 h-2 rounded-full bg-selling" />
            Selling ({filteredListings.length})
          </TabsTrigger>
          <TabsTrigger value="needing" className="gap-2">
            <span className="w-2 h-2 rounded-full bg-needing" />
            Needing ({filteredRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selling" className="mt-6">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No items for sale yet</p>
              <p className="text-sm mt-1">Be the first to list something!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needing" className="mt-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No requests yet</p>
              <p className="text-sm mt-1">Post what you're looking for!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <NeedRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
