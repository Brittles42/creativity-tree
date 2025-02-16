"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import Tree from "react-d3-tree"
import { motion } from "framer-motion"
import Image from 'next/image'

// Type definition for tree node
type TreeNode = {
  name: string;
  children?: TreeNode[];
  parent?: TreeNode | null;  // Track parent reference
  isExpanded?: boolean;  // Add this to track expansion state
}

// Add these types and functions near the top
type ModelResponse = {
  text: string;
}

const getModelResponse = async (ancestors: string[], currentName: string): Promise<string> => {
  try {
    // Create a more detailed context string
    const context = ancestors.join(" > ");
    const depth = ancestors.length;

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        currentNode: currentName,
        depth: depth // Pass the depth to the API
      }),
    });
    
    const data: ModelResponse = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error getting model response:', error);
    return "New Idea";
  }
}

// Recursively find ancestors of a given node
const findAncestors = (node: TreeNode | null): TreeNode[] => {
  const ancestors: TreeNode[] = []
  while (node?.parent) {
    ancestors.unshift(node.parent) // Keep ordering from top to bottom
    node = node.parent
  }
  return ancestors
}

const addExpandedState = (node: TreeNode, isRoot: boolean = true): TreeNode => {
  return {
    ...node,
    isExpanded: isRoot, // Root node starts expanded, others collapsed
    children: node.children?.map(child => addExpandedState(child, false))
  }
}

// Update the generateNewIdeas function
const generateNewIdeas = async (node: TreeNode): Promise<TreeNode[]> => {
  const ancestors = findAncestors(node);
  const ancestorNames = ancestors.map(n => n.name);
  
  // Include the current node's name in the context
  const fullContext = [...ancestorNames, node.name];
  
  // Generate three variations using the model with full context
  const variations = await Promise.all([
    getModelResponse(fullContext, node.name),
    getModelResponse(fullContext, node.name),
    getModelResponse(fullContext, node.name),
  ]);

  // Ensure each new node can also be expanded
  return variations.map(name => ({
    name,
    children: [],
    isExpanded: false,
    parent: node  // Ensure parent reference is set
  }));
}

const HeartNode = ({ 
  nodeDatum, 
  onClick, 
  onToggle,
  hasHiddenChildren
}: { 
  nodeDatum: TreeNode, 
  onClick: (node: TreeNode) => void,
  onToggle: (node: TreeNode) => void,
  hasHiddenChildren: boolean
}) => {
  return (
    <motion.g whileHover={{ scale: 1.1 }}>
      {/* Heart Shape */}
      <path
        d="M 0 -7 
           C 3.5 -14, 14 -14, 14 -3.5 
           C 14 3.5, 7 10, 0 17 
           C -7 10, -14 3.5, -14 -3.5 
           C -14 -14, -3.5 -14, 0 -7 Z"
        fill="#FF69B4"
        stroke="#8B008B"
        strokeWidth="2"
        onClick={() => onClick(nodeDatum)}
      />

      {/* Background for text */}
      <rect 
        x={-nodeDatum.name.length * 3.5} 
        y={20}
        width={nodeDatum.name.length * 7} 
        height={14} 
        rx={4} 
        ry={4} 
        fill="rgba(0, 0, 0, 0.7)"
      />

      {/* Text */}
      <text 
        fill="white" 
        stroke="white"
        strokeWidth="0"
        fontSize="10px" 
        fontWeight="bold"
        x="0" 
        y="30"
        textAnchor="middle" 
      >
        {nodeDatum.name}
      </text>

      {/* Always show toggle button */}
      <motion.circle
        r={4}
        cx="0"
        cy="-15"
        fill="#8B008B"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(nodeDatum);
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
      />
    </motion.g>
  )
}

// Add this type for chat messages
type Message = {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Update the Modal component to include chat functionality
const Modal = ({ node, onClose }: { node: TreeNode, onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi! Let's talk about "${node.name}". What would you like to know?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [currentImage, setCurrentImage] = useState("/miku.png");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Add temporary "typing" message
    setMessages(prev => [...prev, {
      text: "...",
      sender: 'ai',
      timestamp: new Date()
    }]);

    try {
      // Get AI text response
      const chatResponse = await fetch('/api/llamaChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          context: node.name,
          messageHistory: messages
        }),
      });

      const chatData = await chatResponse.json();
      
      // Generate new image based on AI's response
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatData.response,
          response: chatData.response,
          context: node.name
        }),
      });
      
      const imageData = await imageResponse.json();
      console.log("API Response:", imageData);
      
      if (!imageData.request_id) {
        console.error("Missing request_id in response");
        return;
      }
      
      let image_link_json;
      let retries = 0;
      const maxRetries = 10;
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      while (retries < maxRetries) {
        const image_link = await fetch(imageData.request_id, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      
        image_link_json = await image_link.json();
        console.log(`Attempt ${retries + 1}:`, image_link_json);
      
        if (image_link_json?.status !== "Pending") {
          break;
        }
      
        retries++;
        await delay(2000);
      }
      
      if (!image_link_json?.result?.sample) {
        console.error("Missing sample in result:", image_link_json);
        return;
      }
      
      setCurrentImage(image_link_json.result.sample);          

      if (imageData.request_id?.result?.sample) {
        console.log('Image responseee:', imageData.request_id.result.sample);
        setCurrentImage(imageData.request_id.result.sample);
      } else {
        console.error('No image URL in response:', imageData);
      }      

      setMessages(prev => {
        const withoutTyping = prev.slice(0, -1);
        return [...withoutTyping, {
          text: chatData.response,
          sender: 'ai',
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('Error in message handling:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md transition-opacity duration-300">
      <div className="relative bg-white/90 backdrop-blur-lg mt-16 p-6 rounded-2xl shadow-2xl w-[80em] max-w-[95%] h-[80vh] flex gap-6">
        <div className="w-1/2 bg-orange-400 rounded-xl overflow-hidden flex items-center justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-white">Generating image...</div>
            </div>
          )}
          <Image 
            src={currentImage}
            alt="AI Assistant"
            fill
            className="object-cover p-0"
            priority
            onError={(e) => {
              console.error('Image failed to load:', currentImage);
              setCurrentImage("/miku.png"); // Fallback to default image
            }}
          />
        </div>

        {/* Right Section - Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-all duration-200 text-2xl"
          >
            &times;
          </button>

          {/* Header */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{node.name}</h2>

          {/* Chat messages container */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this type definition near the top of the file
type CustomNodeDatum = TreeNode & {
  isExpanded?: boolean;
  children?: CustomNodeDatum[];
}

export default function TreeVisualization({ data }: { data: TreeNode }) {
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [treeData, setTreeData] = useState(() => addExpandedState(data))

  const attachParents = (node: TreeNode, parent: TreeNode | null = null) => {
    node.parent = parent
    node.children?.forEach(child => attachParents(child, node))
  }

  // Update the handleToggle function to ensure proper expansion at any depth
  const handleToggle = async (nodeDatum: TreeNode) => {
    const toggleNode = async (node: TreeNode): Promise<TreeNode> => {
      if (node.name === nodeDatum.name) {
        const newExpanded = !node.isExpanded;
        
        // Generate new ideas if expanding a node without children
        if (newExpanded && (!node.children || node.children.length === 0)) {
          const newChildren = await generateNewIdeas(node);
          return {
            ...node,
            isExpanded: newExpanded,
            children: newChildren
          };
        }
        
        return { 
          ...node, 
          isExpanded: newExpanded 
        };
      }
      
      if (node.children) {
        const newChildren = await Promise.all(node.children.map(toggleNode));
        return {
          ...node,
          children: newChildren
        };
      }
      
      return node;
    };
    
    const newData = await toggleNode(treeData);
    setTreeData(newData);
  }

  // Custom tree data transformer to only show expanded nodes
  const getVisibleData = (node: TreeNode): TreeNode => {
    return {
      ...node,
      children: node.isExpanded 
        ? node.children?.map(getVisibleData)
        : undefined
    }
  }

  attachParents(treeData)

  const containerRef = useCallback((containerElem: HTMLDivElement | null) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect()
      setTranslate({ x: 100, y: height / 2 })
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[800px]">
      <Tree
        data={getVisibleData(treeData)}
        translate={translate}
        orientation="horizontal"
        renderCustomNodeElement={(rd3tProps: any) => (
          <HeartNode 
            {...rd3tProps} 
            onClick={setSelectedNode}
            onToggle={handleToggle}
            hasHiddenChildren={!!(rd3tProps.nodeDatum as CustomNodeDatum).children && !(rd3tProps.nodeDatum as CustomNodeDatum).isExpanded}
          />
        )}
        separation={{ siblings: 0.5, nonSiblings: 0.5 }}
        nodeSize={{ x: 200, y: 120 }}
      />
      {selectedNode && <Modal node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  )
}