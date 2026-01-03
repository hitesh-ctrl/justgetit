import { useAuth } from '@/contexts/AuthContext';
import { matchStorage, listingStorage, needRequestStorage, userStorage } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CAMPUS_LOCATIONS } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const myMatches = matchStorage.getByUserId(user.id);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'chatting':
      case 'meeting-scheduled':
        return 'bg-primary text-primary-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'chatting':
        return 'Chatting';
      case 'meeting-scheduled':
        return 'Meeting Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">My Matches</h1>
          <p className="text-muted-foreground">
            Connect with students interested in your items
          </p>
        </div>

        {myMatches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No matches yet</p>
              <p className="text-sm mt-1">
                When someone is interested in your listing or has what you need, it'll show up here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myMatches.map((match) => {
              const listing = match.listingId
                ? listingStorage.getById(match.listingId)
                : null;
              const request = match.needRequestId
                ? needRequestStorage.getById(match.needRequestId)
                : null;
              const otherUserId =
                match.sellerId === user.id ? match.buyerId : match.sellerId;
              const otherUser = userStorage.getUserById(otherUserId);
              const locationLabel =
                CAMPUS_LOCATIONS.find((l) => l.value === match.suggestedLocation)
                  ?.label || match.suggestedLocation;

              return (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser?.profilePhoto} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {otherUser ? getInitials(otherUser.name) : '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Match Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {otherUser?.name || 'Unknown User'}
                          </span>
                          {otherUser && otherUser.trustScore > 0 && (
                            <span className="text-xs flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {otherUser.trustScore}
                            </span>
                          )}
                          <Badge className={getStatusColor(match.status)}>
                            {getStatusLabel(match.status)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {listing
                            ? `Interested in: ${listing.title}`
                            : request
                            ? `Looking for: ${request.title}`
                            : 'Match'}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {locationLabel}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(match.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      {match.status !== 'cancelled' &&
                        match.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/chat/${match.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
