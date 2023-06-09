'use client';

import { useState, useRef, useEffect } from 'react';
import { MantineProvider, Text, Container, Card, Flex, Textarea, ScrollArea, ActionIcon, Notification, LoadingOverlay, Loader } from '@mantine/core';
import { useFocusTrap } from '@mantine/hooks';
import { IconSend, IconMoodSmile, IconRobot, IconMicrophone } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useWhisper } from '@chengsokdara/use-whisper';

export default function App() {
  const bottomRef = useRef(null);

  const focusTrapRef = useFocusTrap();

  const [isLoading, setIsLoading] = useState(false);
  const [promptInput, setPromptInput] = useState('');

  const [messageState, setMessageState] = useState<{
    messages: {
      type: 'USER' | 'BOT',
      message: string,
      loading?: boolean
    }[]
  }>({
    messages: []
  });

  const {
    recording,
    speaking,
    transcribing,
    transcript,
    pauseRecording,
    startRecording,
    stopRecording
  } = useWhisper({
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    timeSlice: 500, // 500ms intervals
    removeSilence: true, // remove silence
    nonStop: true, // keep recording as long as user is speaking
    stopTimeout: 3000, // auto stop after 3 seconds
    whisperConfig: {
      language: 'en'
    }
  });

  const turnOnMicrophone = () => {
    setPromptInput('');
    startRecording();
  }

  useEffect(() => {
    if (transcript.text) {
      setPromptInput(transcript.text || '');
    }
  }, [transcript.text]);

  const { messages } = messageState;

  const handlePromptInputSubmit = async (e: any) => {
    e.preventDefault();

    stopRecording();

    if (!promptInput) {
      return;
    }

    if (isLoading) {
      return;
    }

    const prompt = promptInput.trim();

    setIsLoading(true);
    setPromptInput('');

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'USER',
          message: prompt
        },
        {
          type: 'BOT',
          message: '',
          loading: true,
        }
      ]
    }));

    //
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
        })
      });

      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        throw new Error(data.error);
      }

      setMessageState((state) => {
        const m = state.messages.slice();

        m[m.length - 1] = {
          type: 'BOT',
          message: data.text,
          loading: false
        };

        return {
          ...state,
          messages: [
            ...m
          ]
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to send message');
    }
  };

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && promptInput) {
      handlePromptInputSubmit(e);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  useEffect(() => {
    // @ts-ignore
    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messageState]);

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        loader: 'dots',
        colorScheme: 'light',
        primaryColor: 'royalBlue',
        colors: {
          royalBlue: [
            '#e5f5ff',
            '#b3e2ff',
            '#80ceff',
            '#4dbaff',
            '#1aa7ff',
            '#008de6',
            '#006eb3',
            '#004e80',
            '#002f4d',
            '#00101a'
          ]
        }
      }}
    >
      <Container size="md" py="xl" className="app-container">
        {/* <div>
          <p>Recording: {recording}</p>
          <p>Speaking: {speaking}</p>
          <p>Transcribing: {transcribing}</p>
          <p>Transcribed Text: {transcript.text}</p>
          <button onClick={turnOnMicrophone}>Start</button>
          <button onClick={() => pauseRecording()}>Pause</button>
          <button onClick={() => stopRecording()}>Stop</button>
        </div> */}
        <Card shadow="md" radius="md" p="0" className="app-card" withBorder>
          <Flex direction="column" className="chat-container">
            <ScrollArea className="chat-content" px="xl">
              {messages.map((message, index) => {
                if (message.type === 'USER') {
                  return (
                    <Notification
                      key={index}
                      className="chat-bubble chat-prompt"
                      withCloseButton={false}
                      p="lg"
                      mt="sm"
                      icon={<IconMoodSmile />}
                      title="Just Human"
                    >
                      <Text size="md" pt="xs">{message.message}</Text>
                    </Notification>
                  );
                } else {
                  return (
                    <Notification
                      className="chat-bubble chat-response"
                      key={index}
                      withCloseButton={false}
                      icon={<IconRobot />}
                      withBorder
                      p="lg"
                      pb="sm"
                      title="Superbot"
                      mb="lg"
                      color="orange"
                    >
                      <LoadingOverlay visible={message.loading || false} overlayBlur={2} />
                      {
                        !message.loading &&
                        <Text c="black" size="md">
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </Text>
                      }
                    </Notification>
                  );
                }
              })}
              <div ref={bottomRef} />
            </ScrollArea>

            <Flex ref={focusTrapRef} p="md" className="chat-input" align="center">
              <Textarea
                className="chat-input-textarea"
                autosize
                data-autofocus
                size="lg"
                maxRows={8}
                placeholder={(recording) ? "Listening..." : "Enter your prompt here..."}
                rightSection={
                  <ActionIcon variant="subtle" size="md" onClick={turnOnMicrophone}>
                    <IconMicrophone />
                  </ActionIcon>
                }
                value={promptInput}
                onChange={(e) => setPromptInput(e.currentTarget.value)}
                onKeyDown={handleEnter}
              />
              <div className="chat-input-submit">
                {
                  (isLoading)
                  ? <Loader />
                  : <ActionIcon variant="subtle" size="md" onClick={handlePromptInputSubmit}>
                      <IconSend />
                    </ActionIcon>
                }
              </div>
            </Flex>
          </Flex>
        </Card>
      </Container>
    </MantineProvider>
  );
}