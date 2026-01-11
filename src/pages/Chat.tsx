import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch, useUpdateMatch } from '@/hooks/useMatches';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useListings } from '@/hooks/useListings';
import { useNeedRequests } from '@/hooks/useNeedRequests';
import { useProfiles } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, CheckCircle2, Calendar, Loader2, MessageCircle, DollarSign, Handshake } from 'lucide-react';
import { CAMPUS_LOCATIONS } from '@/types';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Pre-defined message templates
const GENERAL_MESSAGES = [
  "Hi! I'm interested in your item.",
  "Is this still available?",
  "Can we meet today?",
  "What time works for you?",
  "I'll be at the location in 10 mins.",
  "Thanks! See you soon.",
  "Sorry, I need to reschedule.",
  "Deal confirmed! 🤝",
];

const NEGOTIATION_MESSAGES = [
  "Can you do ₹50 less?",
  "What's your best price?",
  "I can offer ₹{price}",
  "That's a bit high for me.",
  "How about we meet in the middle?",
  "Final offer: ₹{price}",
  "Deal! Let's meet.",
  "Sorry, that's too low for me.",
  "I can add ₹50 more.",
  "Let me think about it.",
];

const MEETING_MESSAGES = [
  "I'll be at Library entrance.",
  "Waiting near the Canteen.",
  "I'm at Main Gate now.",
  "Can we meet at Hostel?",
  "Department building works?",
  "Running 5 mins late.",
  "I'm here, wearing blue shirt.",
  "Where exactly are you?",
];

type ChatMode = 'general' | 'negotiation' | 'meeting';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('general');
  const [customPrice, setCustomPrice] = useState('');

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(matchId);
  const { data: listings = [] } = useListings();
  const { data: requests = [] } = useNeedRequests();
  const { data: profiles = [] } = useProfiles();
  const sendMessage = useSendMessage();
  const updateMatch = useUpdateMatch();

  const otherUserId = match
    ? match.sellerId === user?.id
      ? match.buyerId
      : match.sellerId
    : null;
  const otherUser = otherUserId ? profiles.find(p => p.id === otherUserId) : null;
  const listing = match?.listingId ? listings.find(l => l.id === match.listingId) : null;
  const request = match?.requestId ? requests.find(r => r.id === match.requestId) : null;
  const locationLabel = match?.suggestedLocation
    ? CAMPUS_LOCATIONS.find((l) => l.value === match.suggestedLocation)?.label || match.suggestedLocation
    : 'TBD';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (matchLoading || messagesLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!match || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chat not found</p>
          <Button className="mt-4" onClick={() => navigate('/matches')}>
            View Matches
          </Button>
        </div>
      </Layout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendPresetMessage = (content: string) => {
    // Replace price placeholder if present
    let finalContent = content;
    if (content.includes('{price}') && customPrice) {
      finalContent = content.replace('{price}', customPrice);
    } else if (content.includes('{price}')) {
      toast({
        title: 'Enter a price',
        description: 'Please enter a price amount first.',
        variant: 'destructive',
      });
      return;
    }

    sendMessage.mutate(
      { matchId: match.id, content: finalContent },
      {
        onError: () => {
          toast({
            title: 'Failed to send',
            description: 'Could not send message. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleScheduleMeeting = () => {
    const systemContent = `📍 Suggested meeting point: ${locationLabel}\n\n${user.name} wants to schedule a meeting. Please confirm a date and time.`;

    sendMessage.mutate(
      { matchId: match.id, content: systemContent, isSystemMessage: true },
      {
        onSuccess: () => {
          updateMatch.mutate({ id: match.id, status: 'meeting-scheduled' });
          toast({
            title: 'Meeting suggested',
            description: 'Coordinate with the other person for the exact time.',
          });
        },
      }
    );
  };

  const handleCompleteExchange = () => {
    updateMatch.mutate(
      { id: match.id, status: 'completed' },
      {
        onSuccess: () => {
          sendMessage.mutate({
            matchId: match.id,
            content: '✅ Exchange marked as completed! Don\'t forget to rate each other.',
            isSystemMessage: true,
          });
          toast({
            title: 'Exchange completed!',
            description: 'You can now rate each other.',
          });
          navigate(`/rate/${match.id}`);
        },
      }
    );
  };

  const getCurrentMessages = () => {
    switch (chatMode) {
      case 'negotiation':
        return NEGOTIATION_MESSAGES;
      case 'meeting':
        return MEETING_MESSAGES;
      default:
        return GENERAL_MESSAGES;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherUser ? getInitials(otherUser.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{otherUser?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {listing?.title || request?.title || 'Exchange'}
            </p>
          </div>
          <Badge
            className={
              match.status === 'completed'
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground'
            }
          >
            {match.status === 'completed'
              ? 'Completed'
              : match.status === 'meeting-scheduled'
              ? 'Meeting Set'
              : 'Active'}
          </Badge>
        </div>

        {/* Exchange Info Card */}
        <Card className="mt-4">
          <CardContent className="p-3 flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Suggested meeting: <strong>{locationLabel}</strong></span>
            {listing && (
              <span className="ml-auto font-semibold text-primary">₹{listing.price}</span>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet</p>
              <p className="text-sm">Tap a message below to start the conversation!</p>
            </div>
          )}
          {messages.map((message) => {
            const isOwn = message.senderId === user.id;
            const isSystem = message.isSystemMessage;

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-secondary px-4 py-2 rounded-lg text-sm text-center max-w-[80%] whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary rounded-bl-md'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {match.status !== 'completed' && (
          <div className="flex gap-2 pb-4">
            {match.status !== 'meeting-scheduled' && (
              <Button variant="outline" size="sm" onClick={handleScheduleMeeting}>
                <Calendar className="h-4 w-4 mr-1" />
                Schedule Meeting
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCompleteExchange}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete Exchange
            </Button>
          </div>
        )}

        {/* Chat Mode Selector */}
        {match.status !== 'completed' && (
          <div className="space-y-3 pb-4">
            {/* Mode Tabs */}
            <div className="flex gap-2">
              <Button
                variant={chatMode === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatMode('general')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                General
              </Button>
              <Button
                variant={chatMode === 'negotiation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatMode('negotiation')}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Negotiate
              </Button>
              <Button
                variant={chatMode === 'meeting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatMode('meeting')}
                className="flex-1"
              >
                <Handshake className="h-4 w-4 mr-1" />
                Meeting
              </Button>
            </div>

            {/* Price Input for Negotiation Mode */}
            {chatMode === 'negotiation' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your price:</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
            )}

            {/* Pre-defined Messages */}
            <div className="flex flex-wrap gap-2">
              {getCurrentMessages().map((msg, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendPresetMessage(msg)}
                  disabled={sendMessage.isPending}
                  className={cn(
                    "text-xs",
                    msg.includes('{price}') && !customPrice && "opacity-50"
                  )}
                >
                  {msg.replace('{price}', customPrice || '___')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {match.status === 'completed' && (
          <Button className="w-full" onClick={() => navigate(`/rate/${match.id}`)}>
            Rate This Exchange
          </Button>
        )}
      </div>
    </Layout>
  );
}
