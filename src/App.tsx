import { useEffect, useState } from "react";
import { Modal, FloatButton, Flex, type GetProp } from "antd";
import { CommentOutlined, UserOutlined } from "@ant-design/icons";
import { Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import "./App.css";

const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    placement: "start",
    avatar: { icon: <UserOutlined />, style: { background: "#fde3cf" } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
    },
  },
  local: {
    placement: "end",
    avatar: { icon: <UserOutlined />, style: { background: "#87d068" } },
  },
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const [agent] = useXAgent<
    string,
    { message: string; history: string[] },
    string
  >({
    request: async (
      { message, history }: { message: string; history: string[] },
      {
        onSuccess,
        onError,
      }: {
        onSuccess: (result: string[]) => void;
        onError: (error: Error) => void;
      }
    ) => {
      try {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        });

        const data = await response.json();
        const result = data.response || "No response.";
        onSuccess([result]);
      } catch (error) {
        console.error("API error:", error);
        onError(error instanceof Error ? error : new Error("Unknown error"));
      }
    },
  });

  const { onRequest, messages } = useXChat({
    agent,
    requestPlaceholder: "Waiting...",
    requestFallback: "Request failed. Please try again later.",
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (
      last &&
      last.status !== "local" &&
      !history.includes(`AI: ${last.message}`)
    ) {
      setHistory((prev) => [...prev, `AI: ${last.message}`]);
    }
  }, [messages]);

  return (
    <div>
      <Modal
        title="SmartPOS: Chat with your AI Assistant"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        maskClosable={false}
        width={400}
        style={{
          position: "fixed",
          right: 24,
          margin: 0,
          paddingBottom: 0,
        }}
      >
        <Flex
          vertical
          gap="middle"
          style={{
            height: 720,
            overflowY: "auto",
            justifyContent: "flex-end",
          }}
        >
          <Bubble.List
            roles={roles}
            items={messages.map(
              (msg: {
                id: string | number;
                message: string;
                status: string;
              }) => ({
                key: msg.id,
                loading: msg.status === "loading",
                role: msg.status === "local" ? "local" : "ai",
                content: msg.message,
              })
            )}
          />
          <Sender
            loading={agent.isRequesting()}
            value={content}
            onChange={setContent}
            allowSpeech={true}
            onSubmit={(
              nextContent:
                | string
                | number
                | boolean
                | object
                | { message: string }
                // Removed XRequestParams as it is not defined
                | {
                    message:
                      | "Waiting..."
                      | "Mock failed return. Please try again later.";
                  }
            ) => {
              const userMessage =
                typeof nextContent === "string"
                  ? nextContent
                  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (nextContent as any).message;
              const updatedHistory = [...history, `You: ${userMessage}`];
              setHistory(updatedHistory);
              onRequest({ message: userMessage, history: updatedHistory });
              setContent("");
            }}
          />
        </Flex>
      </Modal>
      <FloatButton
        icon={<CommentOutlined />}
        type="primary"
        onClick={() => setIsModalOpen(true)}
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </div>
  );
}

export default App;
