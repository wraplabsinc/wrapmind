import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import supabase from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';
import { useRoles, ROLES } from './RolesContext.jsx';

const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const { orgId, user } = useAuth();
  const { currentRole } = useRoles();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);

  const myUserName = useMemo(() => {
    if (currentRole && ROLES[currentRole]) {
      return ROLES[currentRole].label;
    }
    return user?.email?.split('@')[0] || 'Unknown';
  }, [currentRole, user]);

  useEffect(() => {
    if (!orgId || !user) {
      // Cleanup any existing channel
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    const channel = supabase.channel(`presence-org-${orgId}`);

    // Track self on this channel
    channel.track({
      user_id: user.id,
      user_name: myUserName,
      online_at: new Date().toISOString(),
    });

    const handlePresence = () => {
      const presences = channel.presenceState();
      const users = [];
      for (const [uid, states] of Object.entries(presences)) {
        if (states && states.length > 0) {
          const state = states[states.length - 1];
          users.push({
            userId: uid,
            userName: state.user_name,
            onlineAt: state.online_at,
          });
        }
      }
      setOnlineUsers(users);
      setIsConnected(true);
    };

    // Listen to all presence changes
    channel.on('presence', { event: 'join' }, handlePresence);
    channel.on('presence', { event: 'leave' }, handlePresence);
    channel.on('presence', { event: 'update' }, handlePresence);

    channel.subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [orgId, user, myUserName]);

  const value = useMemo(() => ({
    onlineUsers,
    onlineCount: onlineUsers.length,
    isConnected,
  }), [onlineUsers, isConnected]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return ctx;
}

export default PresenceContext;
