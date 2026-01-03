import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, Clock } from 'lucide-react';
import type { NeedRequest } from '@/types';
import { userStorage } from '@/lib/storage';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface NeedRequestCardProps {
  request: NeedRequest;
}

export default function NeedRequestCard({ request }: NeedRequestCardProps) {
  const navigate = useNavigate();
  const requester = userStorage.getUserById(request.userId);

  const categoryLabel = CATEGORIES.find((c) => c.value === request.category)?.label || request.category;
  const locationLabel = CAMPUS_LOCATIONS.find((l) => l.value === request.preferredLocation)?.label || request.preferredLocation;

  const expiresIn = formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true });
  const isExpiringSoon = new Date(request.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={() => navigate(`/request/${request.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className="bg-needing text-needing-foreground">
              NEEDING
            </Badge>
            <span className="text-lg font-bold text-primary whitespace-nowrap">
              Up to ₹{request.maxBudget}
            </span>
          </div>

          <div>
            <h3 className="font-semibold line-clamp-1">{request.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {request.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />
              {locationLabel}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs gap-1 ${isExpiringSoon ? 'border-warning text-warning' : ''}`}
            >
              <Clock className="h-3 w-3" />
              Expires {expiresIn}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {requester && (
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={requester.profilePhoto} />
              <AvatarFallback className="text-xs bg-needing text-needing-foreground">
                {getInitials(requester.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {requester.name}
            </span>
            {requester.trustScore > 0 && (
              <span className="text-xs flex items-center gap-0.5 ml-auto">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {requester.trustScore}
              </span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
