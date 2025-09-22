import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAssistantProps {
  className?: string;
  onVoiceInteraction?: (userText: string, assistantResponse: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ className, onVoiceInteraction }) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    if (!isActive || isProcessing || isSpeaking) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      
      // Auto-stop after 10 seconds to process
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [isActive, isProcessing, isSpeaking]);

  const processAudio = async (audioBlob: Blob) => {
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Transcribe audio
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('voice-transcribe', {
          body: { audio: base64Audio }
        });

        if (transcribeError) {
          throw new Error('Transcription failed');
        }

        const userText = transcribeData.text.trim();
        setTranscript(userText);

        if (!userText || userText.length < 3) {
          setIsProcessing(false);
          // Restart listening if no meaningful input
          setTimeout(() => startListening(), 1000);
          return;
        }

        // Get AI response with voice-optimized instructions
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-copilot', {
          body: { 
            messages: [
              {
                role: 'system',
                content: 'Voice mode: Reply in 15 words max. Be brief, direct, friendly. No explanations. Just answer what they asked.'
              },
              {
                role: 'user',
                content: userText
              }
            ],
            conversationId: 'voice-session-fast'
          }
        });

        if (aiError) {
          throw new Error('AI response failed');
        }

        const aiResponse = aiData.message;
        setResponse(aiResponse);

        // Log interaction to main chat
        onVoiceInteraction?.(userText, aiResponse);

        console.log('AI Response received:', aiResponse);

        // Convert response to speech with ElevenLabs
        console.log('Calling voice-speak function...');
        
        // Add timeout to prevent hanging on slow TTS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data: speechData, error: speechError } = await supabase.functions.invoke('voice-speak', {
          body: { 
            text: aiResponse,
            voice_id: "9BWtsMINqrJLrRacOk9x" // Aria voice - fast and clear
          }
        });
        
        clearTimeout(timeoutId);

        console.log('Voice-speak response:', { speechData, speechError });

        if (speechError) {
          console.error('Speech error:', speechError);
          throw new Error('Text-to-speech failed: ' + speechError.message);
        }

        if (!speechData || !speechData.audioContent) {
          console.error('No audio content received');
          throw new Error('No audio content received from speech service');
        }

        console.log('Playing audio...');
        // Play audio response
        await playAudio(speechData.audioContent);
      };
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Unable to process your voice input. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      // Restart listening after error
      setTimeout(() => startListening(), 2000);
    }
  };

  const playAudio = async (base64Audio: string) => {
    setIsSpeaking(true);
    setIsProcessing(false);
    console.log('PlayAudio called with audio length:', base64Audio?.length);
    
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      console.log('Audio blob created, size:', audioBlob.size);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log('Audio playback ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Restart listening after speaking
        setTimeout(() => startListening(), 1000);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Restart listening after error
        setTimeout(() => startListening(), 1000);
      };

      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio play() called successfully');
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      // Restart listening after error
      setTimeout(() => startListening(), 1000);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      // Restart listening after stopping speech
      setTimeout(() => startListening(), 500);
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Reactivate and start listening
      setTimeout(() => startListening(), 500);
    } else {
      // Deactivate and stop everything
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        setIsSpeaking(false);
      }
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  // Auto-start listening when component mounts or becomes active
  useEffect(() => {
    if (isActive && !isListening && !isSpeaking && !isProcessing) {
      const timer = setTimeout(() => startListening(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isListening, isSpeaking, isProcessing, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className={className}>
      <Card className="p-8 bg-gradient-to-br from-background via-background/95 to-primary/5 border-primary/20 backdrop-blur-sm">
        <div className="text-center space-y-6">
          {/* Status Indicator */}
          <div className="relative mx-auto w-24 h-24">
            <div 
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                !isActive
                  ? 'border-gray-400 bg-gray-400/10'
                  : isListening 
                  ? 'border-red-500 bg-red-500/10 animate-pulse' 
                  : isSpeaking
                  ? 'border-blue-500 bg-blue-500/10 animate-pulse'
                  : isProcessing
                  ? 'border-yellow-500 bg-yellow-500/10 animate-spin'
                  : 'border-primary/30 bg-primary/5'
              }`}
            />
            <div className="absolute inset-2 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
              {!isActive ? (
                <Mic className="w-8 h-8 text-gray-400" />
              ) : isListening ? (
                <Mic className="w-8 h-8 text-red-500" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 text-blue-500" />
              ) : (
                <Mic className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Voice Assistant
            </h3>
            <p className="text-sm text-muted-foreground">
              {!isActive
                ? 'Paused - Click to activate'
                : isListening 
                ? 'Listening...' 
                : isSpeaking 
                ? 'Speaking...' 
                : isProcessing 
                ? 'Processing...' 
                : 'Ready to help'}
            </p>
          </div>


          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={toggleActive}
              variant={isActive ? "destructive" : "default"}
              className="px-8 py-3"
            >
              <Mic className="w-4 h-4 mr-2" />
              {isActive ? 'Pause' : 'Activate'}
            </Button>

            {isSpeaking && (
              <Button 
                onClick={stopSpeaking}
                variant="outline"
                className="px-6 py-3"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Stop Speaking
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceAssistant;