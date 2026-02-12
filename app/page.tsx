'use client'

import { useState, useRef, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { ingestFiles } from '@/lib/ragKnowledgeBase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { FiSend, FiRefreshCw, FiChevronDown, FiChevronUp, FiUpload, FiShoppingCart, FiPackage, FiDollarSign, FiTag } from 'react-icons/fi'

// Agent and RAG configuration
const AGENT_ID = '698e12e883ad001445fb4f9a'
const RAG_ID = '698e12c19cd132f4b7b4d67e'

// TypeScript interfaces
interface Product {
  productName: string
  price: string
  description: string
  features: string[]
  imageUrl: string
  category: string
  pros: string[]
  cons: string[]
}

interface AgentResponse {
  message: string
  recommendations: Product[]
  suggestions: string[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  agentData?: AgentResponse
  timestamp: number
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

// Product Card Component
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const imageUrl = product?.imageUrl || `https://placehold.co/400x225/10b981/ffffff?text=${encodeURIComponent(product?.productName || 'Product')}`

  return (
    <Card className="w-full max-w-[280px] bg-white/75 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative w-full aspect-video overflow-hidden rounded-t-[0.875rem]">
          <img
            src={imageUrl}
            alt={product?.productName || 'Product'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://placehold.co/400x225/10b981/ffffff?text=${encodeURIComponent(product?.productName || 'Product')}`
            }}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-2 flex-1" title={product?.productName}>
              {product?.productName || 'Product Name'}
            </h3>
            <Badge className="bg-accent text-accent-foreground shrink-0 flex items-center gap-1">
              <FiDollarSign className="w-3 h-3" />
              {product?.price || 'N/A'}
            </Badge>
          </div>

          {product?.category && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FiTag className="w-3 h-3" />
              <span>{product.category}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2">
            {product?.description || 'No description available'}
          </p>

          {Array.isArray(product?.features) && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 4).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-secondary/80">
                  {feature}
                </Badge>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs flex items-center justify-center gap-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <FiChevronUp className="w-3 h-3" />
                Hide Details
              </>
            ) : (
              <>
                <FiChevronDown className="w-3 h-3" />
                View Details
              </>
            )}
          </Button>

          {expanded && (
            <div className="space-y-2 pt-2 border-t border-border">
              {Array.isArray(product?.pros) && product.pros.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary mb-1">Pros:</h4>
                  <ul className="space-y-1">
                    {product.pros.map((pro, idx) => (
                      <li key={idx} className="text-xs text-foreground ml-3 list-disc">
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(product?.cons) && product.cons.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-destructive mb-1">Cons:</h4>
                  <ul className="space-y-1">
                    {product.cons.map((con, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground ml-3 list-disc">
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Chat Message Component
function ChatMessage({ message, onSuggestionClick }: { message: Message; onSuggestionClick: (suggestion: string) => void }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-[0.875rem] p-4 shadow-md ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-card/75 backdrop-blur-md border border-white/20 text-card-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {!isUser && message.agentData && (
          <div className="mt-4 space-y-4">
            {Array.isArray(message.agentData.recommendations) && message.agentData.recommendations.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {message.agentData.recommendations.map((product, idx) => (
                  <ProductCard key={idx} product={product} index={idx} />
                ))}
              </div>
            )}

            {Array.isArray(message.agentData.suggestions) && message.agentData.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.agentData.suggestions.map((suggestion, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer bg-secondary/80 hover:bg-secondary transition-colors text-xs"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Upload Section Component
function UploadSection() {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadStatus('Uploading and processing files...')

    try {
      const fileArray = Array.from(files)
      await ingestFiles(RAG_ID, fileArray)
      setUploadStatus(`Successfully uploaded ${files.length} file(s) to product catalog`)
      setTimeout(() => setUploadStatus(''), 5000)
    } catch (error) {
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card className="bg-card/75 backdrop-blur-md border border-white/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FiUpload className="w-4 h-4" />
          Upload Products to Catalog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Upload PDF or text files containing product information to expand the product catalog.
        </p>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="text-xs"
          />
          {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
        {uploadStatus && (
          <p className={`text-xs ${uploadStatus.includes('failed') ? 'text-destructive' : 'text-primary'}`}>
            {uploadStatus}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Main Component
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [showSampleData, setShowSampleData] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const categorySuggestions = ['Electronics', 'Home & Garden', 'Budget-friendly options', 'Premium products']

  // Sample data
  const sampleMessages: Message[] = [
    {
      role: 'user',
      content: 'I need a laptop for graphic design work',
      timestamp: Date.now() - 60000
    },
    {
      role: 'assistant',
      content: 'I found some excellent laptops perfect for graphic design work. These models offer powerful processors, dedicated graphics cards, and high-resolution displays ideal for creative professionals.',
      agentData: {
        message: 'I found some excellent laptops perfect for graphic design work.',
        recommendations: [
          {
            productName: 'MacBook Pro 16" M3 Max',
            price: '$3,499',
            description: 'Professional-grade laptop with M3 Max chip, 36GB RAM, and stunning Liquid Retina XDR display',
            features: ['M3 Max chip', '36GB unified memory', '16.2" Liquid Retina XDR', '1TB SSD'],
            imageUrl: 'https://placehold.co/400x225/10b981/ffffff?text=MacBook+Pro',
            category: 'Laptops',
            pros: ['Exceptional performance', 'Best-in-class display', 'Long battery life', 'Premium build quality'],
            cons: ['Expensive', 'Limited ports', 'No touchscreen']
          },
          {
            productName: 'Dell XPS 15 OLED',
            price: '$2,299',
            description: 'High-performance Windows laptop with Intel i9, NVIDIA RTX 4070, and stunning 4K OLED display',
            features: ['Intel Core i9-13900H', 'NVIDIA RTX 4070', '15.6" 4K OLED', '32GB RAM'],
            imageUrl: 'https://placehold.co/400x225/10b981/ffffff?text=Dell+XPS+15',
            category: 'Laptops',
            pros: ['Gorgeous OLED display', 'Powerful GPU', 'Windows compatibility', 'Expandable storage'],
            cons: ['Battery life moderate', 'Runs hot under load', 'Webcam placement']
          },
          {
            productName: 'ASUS ProArt Studiobook',
            price: '$1,899',
            description: 'Creator-focused laptop with color-accurate display, RTX graphics, and professional tools',
            features: ['AMD Ryzen 9', 'NVIDIA RTX 4060', '16" OLED 4K', 'Pantone validated'],
            imageUrl: 'https://placehold.co/400x225/10b981/ffffff?text=ASUS+ProArt',
            category: 'Laptops',
            pros: ['Color-accurate display', 'Great value', 'Dial control', 'Portable'],
            cons: ['Plastic build', 'Average speakers', 'Shorter battery life']
          }
        ],
        suggestions: ['Show me budget options under $1,500', 'What about tablets for design?', 'Compare these models']
      },
      timestamp: Date.now() - 30000
    }
  ]

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Initialize sample data
  useEffect(() => {
    if (showSampleData && messages.length === 0) {
      setMessages(sampleMessages)
    }
  }, [showSampleData])

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    const updatedHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: textToSend }
    ]

    try {
      const result = await callAIAgent(AGENT_ID, textToSend, updatedHistory)

      const agentData: AgentResponse = {
        message: result?.response?.result?.message ?? '',
        recommendations: Array.isArray(result?.response?.result?.recommendations)
          ? result.response.result.recommendations
          : [],
        suggestions: Array.isArray(result?.response?.result?.suggestions)
          ? result.response.result.suggestions
          : []
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: agentData.message || 'I found some recommendations for you.',
        agentData,
        timestamp: Date.now()
      }

      setMessages((prev) => [...prev, assistantMessage])
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: agentData.message }
      ])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setConversationHistory([])
    setInputValue('')
    setShowSampleData(false)
  }

  const handleCategoryClick = (category: string) => {
    setInputValue(`Show me ${category}`)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(160,40%,94%)] via-[hsl(180,35%,93%)] via-30% to-[hsl(140,40%,94%)] to-60%">
      <div className="h-screen flex flex-col max-w-6xl mx-auto p-4 gap-4">
        {/* Header */}
        <header className="flex items-center justify-between bg-card/75 backdrop-blur-md border border-white/20 rounded-[0.875rem] px-6 py-4 shadow-md">
          <div className="flex items-center gap-3">
            <FiShoppingCart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground font-sans">Product Recommendation Assistant</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showSampleData}
                onChange={(e) => {
                  setShowSampleData(e.target.checked)
                  if (e.target.checked && messages.length === 0) {
                    setMessages(sampleMessages)
                  } else if (!e.target.checked) {
                    handleNewChat()
                  }
                }}
                className="w-4 h-4 accent-primary"
              />
              Sample Data
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex items-center gap-2 border-border hover:bg-secondary/50"
            >
              <FiRefreshCw className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col bg-card/60 backdrop-blur-md border border-white/20 rounded-[0.875rem] shadow-lg overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
                  <FiPackage className="w-16 h-16 text-primary/40" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground font-sans">Welcome to Product Recommendations</h2>
                    <p className="text-muted-foreground max-w-md">
                      Tell me what you're looking for, and I'll help you find the perfect products from our catalog.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {categorySuggestions.map((category, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer bg-secondary/80 hover:bg-secondary transition-all hover:scale-105"
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} onSuggestionClick={handleSuggestionClick} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">Finding recommendations...</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Bar */}
            <div className="border-t border-border bg-background/50 p-4 space-y-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.slice(0, 200))}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you're looking for..."
                  className="flex-1 resize-none rounded-[0.875rem] border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] max-h-[120px]"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem]"
                >
                  <FiSend className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{inputValue.length}/200 characters</span>
                <span className="text-xs">Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <UploadSection />

            <Card className="bg-card/75 backdrop-blur-md border border-white/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-accent animate-pulse' : 'bg-primary'}`} />
                  <span className="text-muted-foreground">Product Agent</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Searching catalog...' : 'Ready to help'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/75 backdrop-blur-md border border-white/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categorySuggestions.map((category, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs border-border hover:bg-secondary/50"
                    onClick={() => handleCategoryClick(category)}
                    disabled={isLoading}
                  >
                    {category}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
