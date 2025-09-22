import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAssistantProps {
  className?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ className }) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const processAudio = async (audioBlob: Blob) => {
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

        if (!userText) {
          setIsProcessing(false);
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

        console.log('AI Response received:', aiResponse);

        // Convert response to speech with ElevenLabs
        console.log('Calling voice-speak function...');
        
        // Add timeout to prevent hanging on slow TTS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for ultra fast response
        
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
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    setIsSpeaking(true);
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
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio play() called successfully');
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  return (
    <div className={className}>
      <Card className="p-8 bg-gradient-to-br from-background via-background/95 to-primary/5 border-primary/20 backdrop-blur-sm">
        <div className="text-center space-y-6">
          {/* Status Indicator */}
          <div className="relative mx-auto w-24 h-24">
            <div 
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                isListening 
                  ? 'border-red-500 bg-red-500/10 animate-pulse' 
                  : isSpeaking
                  ? 'border-blue-500 bg-blue-500/10 animate-pulse'
                  : isProcessing
                  ? 'border-yellow-500 bg-yellow-500/10 animate-spin'
                  : 'border-primary/30 bg-primary/5'
              }`}
            />
            <div className="absolute inset-2 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
              {isListening ? (
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
              {isListening 
                ? 'Listening...' 
                : isSpeaking 
                ? 'Speaking...' 
                : isProcessing 
                ? 'Processing...' 
                : 'Ready to help'}
            </p>
          </div>

          {/* Transcript and Response */}
          {(transcript || response) && (
            <div className="space-y-4 text-left">
              {transcript && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
              {response && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Assistant:</p>
                  <p className="text-sm">{response}</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isListening ? (
              <Button 
                onClick={startListening} 
                disabled={isProcessing || isSpeaking}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </Button>
            ) : (
              <Button 
                onClick={stopListening}
                variant="destructive"
                className="px-8 py-3"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Listening
              </Button>
            )}

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