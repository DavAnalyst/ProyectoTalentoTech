class ChatBot {
    constructor() {
        this.isOpen = false;
        this.initializeElements();
        this.bindEvents();
        this.addTypingIndicator();
    }

    initializeElements() {
        this.container = document.getElementById('chatbot-container');
        this.toggle = document.getElementById('chatbot-toggle');
        this.widget = document.getElementById('chatbot-widget');
        this.closeBtn = document.getElementById('chatbot-close');
        this.messages = document.getElementById('chatbot-messages');
        this.userInput = document.getElementById('user-message');
        this.sendBtn = document.getElementById('send-message');
    }

    bindEvents() {
        // Toggle chatbot
        this.toggle.addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Close chatbot
        this.closeBtn.addEventListener('click', () => {
            this.closeChatbot();
        });

        // Send message on button click
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter key
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.userInput.addEventListener('input', () => {
            this.adjustInputHeight();
        });
    }

    toggleChatbot() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.widget.classList.add('open');
            this.toggle.style.display = 'none';
            this.userInput.focus();
        } else {
            this.closeChatbot();
        }
    }

    closeChatbot() {
        this.isOpen = false;
        this.widget.classList.remove('open');
        this.toggle.style.display = 'flex';
        this.userInput.blur();
    }

    adjustInputHeight() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 100) + 'px';
    }

    addMessage(content, isUser = false, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isTyping) {
            messageContent.innerHTML = `
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(messageContent);
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    addTypingIndicator() {
        const style = document.createElement('style');
        style.textContent = `
            .typing-indicator {
                display: flex;
                align-items: center;
                padding: 5px 0;
            }
            
            .typing-indicator span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: var(--primary);
                margin: 0 2px;
                animation: typing 1.5s infinite;
            }
            
            .typing-indicator span:nth-child(2) {
                animation-delay: 0.3s;
            }
            
            .typing-indicator span:nth-child(3) {
                animation-delay: 0.6s;
            }
            
            @keyframes typing {
                0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, true);
        this.userInput.value = '';
        this.adjustInputHeight();

        // Show typing indicator
        const typingMessage = this.addMessage('', false, true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            
            // Remove typing indicator
            typingMessage.remove();
            
            if (data.status === 'success') {
                // Add bot response
                this.addMessage(data.response);
            } else {
                this.addMessage(data.response || 'Disculpa, tengo problemas técnicos momentáneos. Contáctanos directamente.');
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            typingMessage.remove();
            this.addMessage('Error de conexión. Por favor intenta nuevamente o contáctanos al +57 320 273 8391');
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure all elements are loaded
    setTimeout(() => {
        new ChatBot();
    }, 100);
});