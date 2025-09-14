import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatWindow from './ChatWindow';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/integrations/supabase/types';

interface InternalMessagingProps {
  userProfile: UserProfile;
}

const InternalMessaging = ({ userProfile }: InternalMessagingProps) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, [userProfile.user_id]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const query = supabase.from('conversations').select(`
        id,
        application_id,
        candidate:candidate_id ( id, first_name, last_name ),
        recruiter:recruiter_id ( id, first_name, last_name, company_name ),
        job:jobs ( title )
      `);
      
      if (userProfile.role === 'candidate') {
        query.eq('candidate_id', userProfile.user_id);
      } else if (userProfile.role === 'recruiter') {
        query.eq('recruiter_id', userProfile.user_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: "Impossible de charger les conversations.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getConversationTitle = (conv) => {
      if (!conv) return "";
      if (userProfile.role === 'candidate') {
          return `${conv.recruiter.first_name} ${conv.recruiter.last_name} (${conv.recruiter.company_name}) - ${conv.job.title}`;
      }
      return `${conv.candidate.first_name} ${conv.candidate.last_name} - ${conv.job.title}`;
  }

  if (loading) {
    return <div>Chargement des conversations...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-150px)] border rounded-lg">
      <div className="w-1/3 border-r">
        <h2 className="text-xl font-bold p-4 border-b">Messagerie</h2>
        <ul className="overflow-y-auto">
          {conversations.length > 0 ? conversations.map((conv) => (
            <li
              key={conv.id}
              className={`p-4 cursor-pointer hover:bg-muted ${selectedConversation?.id === conv.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedConversation(conv)}
            >
              <p className="font-semibold">{getConversationTitle(conv)}</p>
            </li>
          )) : <p className="p-4 text-muted-foreground">Aucune conversation. La messagerie est disponible lorsque votre candidature est acceptée.</p>}
        </ul>
      </div>
      <div className="w-2/3">
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversationId={selectedConversation.id}
            userId={userProfile.user_id}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Sélectionnez une conversation pour afficher les messages.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalMessaging;
