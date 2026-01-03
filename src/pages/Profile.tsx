import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Package, Heart, CheckCircle2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ListingCard from '@/components/ListingCard';
import NeedRequestCard from '@/components/NeedRequestCard';
import { listingStorage, needRequestStorage, ratingStorage } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const myListings = listingStorage.getByUserId(user.id);
  const myRequests = needRequestStorage.getByUserId(user.id);
  const myRatings = ratingStorage.getByUserId(user.id);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'top':
        return 'bg-warning text-warning-foreground';
      case 'trusted':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getBadgeLabel = (badge: string) => {
    switch (badge) {
      case 'top':
        return '⭐ Top Seller';
      case 'trusted':
        return '✓ Trusted';
      default:
        return 'New Member';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePhoto} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge className={getBadgeStyle(user.badge)}>
                    {getBadgeLabel(user.badge)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  {user.trustScore > 0 ? (
                    <>
                      <Star className="h-5 w-5 fill-warning text-warning" />
                      {user.trustScore}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.totalRatings}</div>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.totalExchanges}</div>
                <p className="text-sm text-muted-foreground">Exchanges</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myListings.length + myRequests.length}</div>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {myRatings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myRatings.slice(0, 3).map((rating) => (
                <div key={rating.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rating.overallRating
                                ? 'fill-warning text-warning'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {rating.review && (
                      <p className="text-sm mt-1">{rating.review}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Posts */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listings" className="gap-2">
              <Package className="h-4 w-4" />
              My Listings ({myListings.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Heart className="h-4 w-4" />
              My Requests ({myRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {myListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't listed anything yet</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/create-listing')}
                >
                  Create Listing
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't posted any requests yet</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/create-request')}
                >
                  Post Request
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myRequests.map((request) => (
                  <NeedRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
