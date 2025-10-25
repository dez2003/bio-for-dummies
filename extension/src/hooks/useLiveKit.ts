import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import type { AgentStatus, CaptionMessage, AnswerMessage, UserPreferences, PageContext } from '@bio-agent/types';

const SERVER_URL = 'http://localhost:8787';

export function useLiveKit() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [captions, setCaptions] = useState<CaptionMessage[]>([]);
  const [answer, setAnswer] = useState<AnswerMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const preferencesRef = useRef<UserPreferences>({
    mode: 'ELI5',
    detail: 'summary+sources'
  });

  // Initialize audio element
  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.autoplay = true;
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const fetchToken = async (roomName: string, identity: string): Promise<string> => {
    const response = await fetch(`${SERVER_URL}/token?room=${roomName}&identity=${identity}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }
    
    const data = await response.json();
    return data.token;
  };

  const connect = useCallback(async (roomName: string) => {
    try {
      setStatus('connecting');
      setError(null);

      const identity = `user:${Math.random().toString(36).substr(2, 9)}`;
      const token = await fetchToken(roomName, identity);

      const room = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setStatus('idle');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setStatus('idle');
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        
        if (track.kind === Track.Kind.Audio && participant.identity.startsWith('agent:')) {
          console.log('Playing agent audio');
          track.attach(audioElementRef.current!);
          setStatus('speaking');
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach();
          setStatus('idle');
        }
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          console.log('Data received:', message.type);

          if (message.type === 'partial' || message.type === 'final') {
            setCaptions(prev => [...prev, message as CaptionMessage]);
            if (message.type === 'final') {
              setStatus('thinking');
            }
          } else if (message.type === 'answer') {
            setAnswer(message as AnswerMessage);
          }
        } catch (error) {
          console.error('Error parsing data:', error);
        }
      });

      // Connect to LiveKit
      const livekitUrl = 'wss://bio-for-dummies-hqvtqf92.livekit.cloud';
      await room.connect(livekitUrl, token);

      roomRef.current = room;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('idle');
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setStatus('idle');
    setCaptions([]);
    setAnswer(null);
  }, []);

  const startRecording = useCallback(async () => {
    if (!roomRef.current || status === 'recording') return;

    try {
      setStatus('recording');
      setError(null);
      setCaptions([]);
      setAnswer(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio track
      const audioTrack = stream.getAudioTracks()[0];
      await roomRef.current.localParticipant.publishTrack(audioTrack);

      // Send preferences
      sendPreferences(preferencesRef.current);

      // Get and send page context
      const context = await getPageContext();
      if (context) {
        sendPageContext(context);
      }

      console.log('Recording started');
    } catch (err) {
      console.error('Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStatus('idle');
    }
  }, [status]);

  const stopRecording = useCallback(async () => {
    if (!roomRef.current || status !== 'recording') return;

    try {
      // Unpublish audio tracks
      const tracks = Array.from(roomRef.current.localParticipant.trackPublications.values());
      for (const publication of tracks) {
        if (publication.track?.kind === Track.Kind.Audio) {
          await roomRef.current.localParticipant.unpublishTrack(publication.track);
          publication.track.stop();
        }
      }

      console.log('Recording stopped');
      setStatus('thinking');
    } catch (err) {
      console.error('Stop recording error:', err);
      setStatus('idle');
    }
  }, [status]);

  const updatePreferences = useCallback((prefs: UserPreferences) => {
    preferencesRef.current = prefs;
    sendPreferences(prefs);
  }, []);

  const sendPreferences = (prefs: UserPreferences) => {
    if (!roomRef.current) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: 'preferences', preferences: prefs }));
    roomRef.current.localParticipant.publishData(data, { reliable: true });
  };

  const sendPageContext = (context: PageContext) => {
    if (!roomRef.current) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: 'context', context }));
    roomRef.current.localParticipant.publishData(data, { reliable: true });
  };

  const getPageContext = async (): Promise<PageContext | null> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' }, (response) => {
        resolve(response?.context || null);
      });
    });
  };

  return {
    status,
    captions,
    answer,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    updatePreferences
  };
}

