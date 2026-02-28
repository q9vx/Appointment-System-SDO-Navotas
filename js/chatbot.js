(function() {
    'use strict';

    const chatbotResponses = {
        greeting_en: [
            "Hello! 👋 I'm here to help you with your appointments. Ask me about creating, tracking, or managing your appointments!",
            "Hi there! 😊 Need help with your appointment? Just ask me!",
            "Welcome! 🎉 I can help you with: creating appointments, checking status, rescheduling, and more!"
        ],
        
        greeting_fil: [
            "Kumusta! 👋 Nandito ako para tulungan ka sa appointments mo. Tanungin mo ako about creating, tracking, o managing ng appointments mo!",
            "Kamusta! 😊 Need mo ng tulong sa appointment mo? Tanong lang ako!",
            "Welcome! 🎉 Matutulungan kita sa: paggawa ng appointments, checking status, rescheduling, at marami pa!"
        ],
        
        create_en: [
            "To create an appointment:\n1. Sign up for an account\n2. Log in\n3. Click 'Create Appointment'\n4. Fill in the required details\n5. Submit your request\n\nYou'll receive confirmation via email!",
            "Creating an appointment is easy! First, create an account or log in, then go to 'Create Appointment', fill in your purpose, date, and time, and submit. That's it! ✅"
        ],
        
        create_fil: [
            "Para gumawa ng appointment:\n1. Mag-sign up para sa account\n2. Mag-login\n3. I-click ang 'Create Appointment'\n4. Punan ang mga detalye\n5. Isumite ang iyong request\n\nMakakakuha kayo ng confirmation sa email!",
            "Madali lang gumawa ng appointment! Una, gumawa ng account o mag-login, then pumunta sa 'Create Appointment', punan ang purpose, date, at time, then isumite. Yan lang! ✅"
        ],
        
        status_en: [
            "To track your appointment status:\n1. Log in to your account\n2. Go to 'My Appointments'\n3. View your appointments with status: Pending, Confirmed, Completed, or Cancelled 📋"
        ],
        
        status_fil: [
            "Para masubaybayan ang status ng appointment:\n1. Mag-login sa account mo\n2. Pumunta sa 'My Appointments'\n3. Tingnan ang appointments mo na may status: Pending, Confirmed, Completed, o Cancelled 📋"
        ],
        
        track_en: [
            "You can track your appointment in 'My Appointments' section. Statuses include:\n🟡 Pending - awaiting confirmation\n🟢 Confirmed - approved\n✅ Completed - done\n🔴 Cancelled - denied"
        ],
        
        track_fil: [
            "Maaari mong subaybayan ang appointment mo sa 'My Appointments' section. Mga status:\n🟡 Pending - naghihintay ng confirmation\n🟢 Confirmed - na-approve\n✅ Completed - tapos na\n🔴 Cancelled - tinanggihan"
        ],
        
        login_en: [
            "To log in:\n1. Click 'Login' on the menu\n2. Enter your email and password\n3. Click 'Login'\n\nIf you don't have an account, click 'Sign Up' to register!"
        ],
        
        login_fil: [
            "Para mag-login:\n1. I-click ang 'Login' sa menu\n2. Ilagay ang email at password mo\n3. I-click ang 'Login'\n\nKung wala kang account, i-click ang 'Sign Up' para mag-register!"
        ],
        
        register_en: [
            "To register:\n1. Click 'Sign Up'\n2. Fill in your details (name, email, password)\n3. Verify your email\n4. Start creating appointments! 📝"
        ],
        
        register_fil: [
            "Para mag-register:\n1. I-click ang 'Sign Up'\n2. Punan ang mga detalye mo (name, email, password)\n3. Verify ang email mo\n4. Simulan ang paggawa ng appointments! 📝"
        ],
        
        password_en: [
            "Forgot your password?\n1. Go to Login page\n2. Click 'Forgot Password'\n3. Enter your email\n4. Check your inbox for reset link\n5. Create a new password 🔐"
        ],
        
        password_fil: [
            "Nakalimutan ang password mo?\n1. Pumunta sa Login page\n2. I-click ang 'Forgot Password'\n3. Ilagay ang email mo\n4. Check ang inbox mo para sa reset link\n5. Gumawa ng bagong password 🔐"
        ],
        
        reschedule_en: [
            "To reschedule or cancel:\n1. Go to 'My Appointments'\n2. Find your appointment\n3. Click on it\n4. Choose 'Reschedule' or 'Cancel'\n\nNote: Changes are subject to office availability. 📅"
        ],
        
        reschedule_fil: [
            "Para mag-reschedule o mag-cancel:\n1. Pumunta sa 'My Appointments'\n2. Hanapin ang appointment mo\n3. I-click ito\n4. Pumili ng 'Reschedule' o 'Cancel'\n\nNota: Mga pagbabago ay naka-depende sa availability ng opisina. 📅"
        ],
        
        cancel_en: [
            "To cancel an appointment:\n1. Log in to your account\n2. Go to 'My Appointments'\n3. Select the appointment\n4. Click 'Cancel'\n\nPlease cancel at least 24 hours before your scheduled time if possible."
        ],
        
        cancel_fil: [
            "Para mag-cancel ng appointment:\n1. Mag-login sa account mo\n2. Pumunta sa 'My Appointments'\n3. Piliin ang appointment\n4. I-click ang 'Cancel'\n\nMaaaring mag-cancel ng hindi bababa sa 24 hours bago ang schedule kung maaari."
        ],
        
        documents_en: [
            "Required documents may include:\n• Valid ID\n• School ID (for students)\n• PSA Birth Certificate\n• Other documents related to your appointment purpose\n\nSpecific requirements will be shown when creating your appointment. 📄"
        ],
        
        documents_fil: [
            "Mga kailangang dokumento:\n• Valid ID\n• School ID (para sa students)\n• PSA Birth Certificate\n• Iba pang dokumento na may kinalaman sa purpose ng appointment\n\nAng specific requirements ay lalabas kapag gumagawa ng appointment. 📄"
        ],
        
        confirmation_en: [
            "Appointment confirmation typically takes 1-2 business days. You'll receive an email notification once confirmed. For urgent matters, please contact the office directly. ⏰"
        ],
        
        confirmation_fil: [
            "Ang confirmation ng appointment ay karaniwang tumatagal ng 1-2 business days. Makakakuha kayo ng email notification kapag confirmed na. Para sa mga urgent na matters, paki-contact ang opisina direktamente. ⏰"
        ],
        
        'multiple appointments_en': [
            "Yes, you can have multiple pending appointments, but only ONE can be confirmed for the same date/time. Please schedule different dates to avoid conflicts. 📆"
        ],
        
        'multiple appointments_fil': [
            "Oo, maaari kang magkaroon ng maraming pending appointments, pero isa lang ang maaaring ma-confirm para sa parehong date/time. Paki-schedule ng ibang dates para maiwasan ang conflict. 📆"
        ],
        
        missed_en: [
            "If you miss your appointment:\n1. Create a new appointment\n2. Contact the office if it's urgent\n\n⚠️ Repeated missed appointments may affect your ability to book future appointments."
        ],
        
        missed_fil: [
            "Kung missed mo ang appointment mo:\n1. Gumawa ng bagong appointment\n2. Kontakin ang opisina kung urgent\n\n⚠️ Ang paulit-ulit na missed appointments ay maaaring makaapekto sa ability mo na mag-book ng future appointments."
        ],
        
        privacy_en: [
            "Your data is protected under the Data Privacy Act of 2012. Only authorized SDO personnel can access your information. We take your privacy seriously! 🔒"
        ],
        
        privacy_fil: [
            "Ang data mo ay protektado sa ilalim ng Data Privacy Act of 2012. Tanging authorized SDO personnel lang ang maaaring maka-access sa information mo. Seryosohin namin ang privacy mo! 🔒"
        ],
        
        contact_en: [
            "Contact SDO Navotas:\n📍 Bagumbayan ES Compound, M. Naval St., Sipac-Almasen, Navotas City\n📞 (02) 8351-5797 / 832-7764 / 8332-7985\n✉️ navotas.city@deped.gov.ph\n\nOffice Hours: Mon-Fri, 8AM-5PM 📅"
        ],
        
        contact_fil: [
            "Kontakin ang SDO Navotas:\n📍 Bagumbayan ES Compound, M. Naval St., Sipac-Almasen, Navotas City\n📞 (02) 8351-5797 / 832-7764 / 8332-7985\n✉️ navotas.city@deped.gov.ph\n\nOffice Hours: Mon-Fri, 8AM-5PM 📅"
        ],
        
        help_en: [
            "I can help you with:\n• Creating appointments\n• Login/Register issues\n• Tracking appointment status\n• Rescheduling/Cancelling\n• And more!\n\nJust ask! 😊"
        ],
        
        help_fil: [
            "Matutulungan kita sa:\n• Paggawa ng appointments\n• Login/Register issues\n• Pagsubaybay ng appointment status\n• Rescheduling/Cancelling\n• At marami pa!\n\nTanong lang! 😊"
        ],
        
        thanks_en: [
            "You're welcome! 😊 Happy to help!",
            "No problem! Let me know if you have other questions. 👍",
            "Glad I could help! Feel free to ask more questions! ✨"
        ],
        
        thanks_fil: [
            "Walang anuman! 😊 Happy ako na tumulong!",
            "Walang problema! Let me know kung may other questions ka. 👍",
            "Salamat! Feel free na magtanong ng more questions! ✨"
        ],
        
        bye_en: [
            "Goodbye! Have a great day! 👋",
            "Take care! See you soon! 🌟",
            "Bye! Don't hesitate to return if you need more help! 😊"
        ],
        
        bye_fil: [
            "Paalam! Have a great day! 👋",
            "Ingat ka! See you soon! 🌟",
            "Bye! Huwag mag-atubiling bumalik kung kailangan mo ng tulong! 😊"
        ],
        
        default_en: [
            "I'm not sure I understand. 😅 Could you rephrase your question?\n\nI can help with: creating appointments, login, status, documents, contact info, and more!",
            "Hmm, let me think... 🤔 Try asking about:\n• Creating appointments\n• Login/Register\n• Tracking status\n• Contact information"
        ],
        
        default_fil: [
            "Hindi sigurado kung naiintindihan ko. 😅 Pwede mo bang i-rephrase ang tanong mo?\n\nMatutulungan kita sa: paggawa ng appointments, login, status, documents, contact info, and more!",
            "Hmm, hintay... 🤔 Subukang magtanong about:\n• Paggawa ng appointments\n• Login/Register\n• Pagsubaybay ng status\n• Contact information"
        ]
    };

    const keywordMapEn = {
        status: ['check my appointment', 'check appointment', 'how to check', 'check status', 'check the status', 'view status', 'appointment status', 'status ng appointment', 'check ko', 'paano checheck', 'paano i-check', 'i-check'],
        track: ['track', 'tracking', 'how to track', 'track my', 'where is my appointment', 'subaybayan', 'saan na'],
        login: ['login', 'log in', 'signin', 'log-in', 'mag-login', 'pumasok'],
        register: ['sign up', 'registration', 'create account', 'mag-register', 'mag-sign up', 'magba-bag'],
        password: ['forgot password', 'nakalimutan', 'nakalimutan ang password'],
        reset: ['reset password', 'change password', 'baguhin ang password'],
        reschedule: ['reschedule', 'change date', 'change time', 'magbabago', 'ibang petsa', 'baguhin'],
        cancel: ['cancel', 'kanselahin', 'tanggalin', 'remove'],
        documents: ['documents', 'documents needed', 'need to bring', 'what to bring', 'id', 'dokumento', 'kailangan'],
        confirmation: ['how long', 'when confirmed', 'waiting', 'confirm', 'ilan ang aantayin'],
        'multiple appointments': ['multiple', 'more than one', 'several', 'marami', 'maraming appointment'],
        missed: ['missed', 'absent', 'did not go', 'late', 'late na', 'hindi pumunta'],
        privacy: ['privacy', 'data protection', 'personal info', 'privacy policy'],
        contact: ['contact', 'phone', 'email', 'address', 'location', 'reach', 'kontak', 'tawag'],
        help: ['help', 'help me', 'what can you do', 'assist', 'tulong', 'tulungan', 'paumanhin'],
        thanks: ['thank', 'thanks', 'appreciate', 'thx', 'salamat', 'maraming salamat'],
        bye: ['bye', 'goodbye', 'see you', 'later', 'paalam', 'sige'],
        greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'kamusta', 'kumusta', 'hey you'],
        create: ['create appointment', 'make appointment', 'book appointment', 'new appointment', 'schedule', 'gumawa', 'mag-appointment']
    };

    function detectLanguage(message) {
        const filipinoOnly = ['kamusta', 'kumusta', 'po', 'ako', 'ka', 'ang', 'ng', 'sa', 'gumawa', 'mag', 'lang', 'ba', 'pwede',
            'paano', 'saan', 'gano', 'kailan', 'bakit', 'salamat', 'paalam', 'oo', 'hindi', 'naman',
            'mag-login', 'mag-register', 'kontak', 'tulungan', 'problema', 'appointment', 'cancel', 
            'reschedule', 'missed', 'password', 'account', 'nakalimutan', 'pumasok', 'check ko',
            'i-check', 'paano', 'subaybayan', 'saan', 'kailangan', 'tawag', 'marami', 'baguhin',
            'kanselahin', 'tanggalin', 'dokumento', 'naka', 'late', 'tingnan'];
        
        const lowerMessage = message.toLowerCase();
        
        for (const keyword of filipinoOnly) {
            if (lowerMessage === keyword || lowerMessage.startsWith(keyword + ' ') || lowerMessage.endsWith(' ' + keyword) || lowerMessage.includes(' ' + keyword + ' ')) {
                return 'fil';
            }
        }
        
        return 'en';
    }

    function findResponse(userMessage) {
        const message = userMessage.toLowerCase().trim();
        const lang = detectLanguage(message);
        const langSuffix = '_' + lang;
        
        if (message.includes('appointment') || message.includes('check') || message.includes('track') || message.includes('status')) {
            if (message.includes('check') || message.includes('status') || message.includes('track') || message.includes('view')) {
                if (lang === 'fil') {
                    return chatbotResponses['status_fil'][0];
                }
                return chatbotResponses['status_en'][0];
            }
        }
        
        if (message.includes('create') || message.includes('make') || message.includes('book') || message.includes('new') || message.includes('schedule')) {
            if (message.includes('appointment')) {
                if (lang === 'fil') {
                    return chatbotResponses['create_fil'][0];
                }
                return chatbotResponses['create_en'][0];
            }
        }
        
        if (message.includes('login') || message.includes('log in') || message.includes('signin') || message.includes('pumasok')) {
            if (lang === 'fil') {
                return chatbotResponses['login_fil'][0];
            }
            return chatbotResponses['login_en'][0];
        }
        
        if (message.includes('sign up') || message.includes('register') || message.includes('mag-register') || message.includes('mag-sign') || message.includes('make an account') || message.includes('create account') || message.includes('account')) {
            if (lang === 'fil') {
                return chatbotResponses['register_fil'][0];
            }
            return chatbotResponses['register_en'][0];
        }
        
        if (message.includes('password') || message.includes('nakalimutan')) {
            if (lang === 'fil') {
                return chatbotResponses['password_fil'][0];
            }
            return chatbotResponses['password_en'][0];
        }
        
        if (message.includes('cancel') || message.includes('kanselahin') || message.includes('tanggalin')) {
            if (lang === 'fil') {
                return chatbotResponses['cancel_fil'][0];
            }
            return chatbotResponses['cancel_en'][0];
        }
        
        if (message.includes('document') || message.includes('dokumento') || message.includes('need') || message.includes('bring') || message.includes('kailangan')) {
            if (lang === 'fil') {
                return chatbotResponses['documents_fil'][0];
            }
            return chatbotResponses['documents_en'][0];
        }
        
        if (message.includes('contact') || message.includes('phone') || message.includes('email') || message.includes('address') || message.includes('kontak') || message.includes('tawag')) {
            if (lang === 'fil') {
                return chatbotResponses['contact_fil'][0];
            }
            return chatbotResponses['contact_en'][0];
        }
        
        if (message.includes('thank') || message.includes('salamat') || message.includes('thanks')) {
            if (lang === 'fil') {
                return chatbotResponses['thanks_fil'][Math.floor(Math.random() * chatbotResponses['thanks_fil'].length)];
            }
            return chatbotResponses['thanks_en'][Math.floor(Math.random() * chatbotResponses['thanks_en'].length)];
        }
        
        if (message.includes('bye') || message.includes('paalam') || message.includes('goodbye')) {
            if (lang === 'fil') {
                return chatbotResponses['bye_fil'][Math.floor(Math.random() * chatbotResponses['bye_fil'].length)];
            }
            return chatbotResponses['bye_en'][Math.floor(Math.random() * chatbotResponses['bye_en'].length)];
        }
        
        if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('kamusta') || message.includes('kumusta')) {
            if (lang === 'fil') {
                return chatbotResponses['greeting_fil'][Math.floor(Math.random() * chatbotResponses['greeting_fil'].length)];
            }
            return chatbotResponses['greeting_en'][Math.floor(Math.random() * chatbotResponses['greeting_en'].length)];
        }
        
        if (lang === 'fil') {
            return chatbotResponses['default_fil'][Math.floor(Math.random() * chatbotResponses['default_fil'].length)];
        }
        return chatbotResponses['default_en'][Math.floor(Math.random() * chatbotResponses['default_en'].length)];
    }

    function createChatbot() {
        if (document.getElementById('chatbot-container')) {
            return;
        }

        const chatbotBtn = document.createElement('button');
        chatbotBtn.id = 'chatbot-toggle';
        chatbotBtn.className = 'chatbot-toggle';
        chatbotBtn.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';
        chatbotBtn.setAttribute('aria-label', 'Open Chatbot');
        document.body.appendChild(chatbotBtn);

        const chatbotContainer = document.createElement('div');
        chatbotContainer.id = 'chatbot-container';
        chatbotContainer.className = 'chatbot-container';
        chatbotContainer.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <i class="bi bi-headset"></i>
                    <span>SDO Navotas Assistant</span>
                </div>
                <button id="chatbot-close" class="chatbot-close" aria-label="Close Chatbot">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div id="chatbot-messages" class="chatbot-messages">
                <div class="chatbot-message bot-message">
                    <div class="message-content">
                        Hello! 👋 I'm here to help you with your appointments.<br><br>
                        <small><em>Maaari kang magtanong sa English o Filipino!</em></small>
                    </div>
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type your question here...">
                <button id="chatbot-send" class="chatbot-send" aria-label="Send Message">
                    <i class="bi bi-send"></i>
                </button>
            </div>
        `;
        document.body.appendChild(chatbotContainer);

        const messagesContainer = document.getElementById('chatbot-messages');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        const closeBtn = document.getElementById('chatbot-close');

        chatbotBtn.addEventListener('click', () => {
            chatbotContainer.classList.add('active');
            chatbotBtn.style.display = 'none';
            input.focus();
        });

        closeBtn.addEventListener('click', () => {
            chatbotContainer.classList.remove('active');
            chatbotBtn.style.display = 'flex';
        });

        function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            input.value = '';

            setTimeout(() => {
                const response = findResponse(message);
                addMessage(response, 'bot');
            }, 500);
        }

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = text.replace(/\n/g, '<br>');
            
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        sendBtn.addEventListener('click', sendMessage);

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function addChatbotStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-toggle {
                position: fixed;
                bottom: 160px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #40916c, #52b788);
                color: #fff;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                background: linear-gradient(135deg, #52b788, #74c69d);
            }

            .chatbot-toggle:active {
                transform: scale(0.95);
            }

            .chatbot-container {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                max-width: calc(100vw - 40px);
                height: 500px;
                max-height: calc(100vh - 100px);
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                z-index: 1001;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px) scale(0.95);
                transition: all 0.3s ease;
            }

            .chatbot-container.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .chatbot-header {
                background: linear-gradient(135deg, #1b4332, #2d6a4f);
                color: #fff;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chatbot-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 1rem;
            }

            .chatbot-title i {
                font-size: 1.3rem;
            }

            .chatbot-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: background 0.3s ease;
            }

            .chatbot-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: #f8f9fa;
            }

            .chatbot-message {
                display: flex;
                max-width: 85%;
            }

            .chatbot-message.user-message {
                align-self: flex-end;
            }

            .chatbot-message.bot-message {
                align-self: flex-start;
            }

            .message-content {
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 0.9rem;
                line-height: 1.5;
                word-wrap: break-word;
            }

            .user-message .message-content {
                background: linear-gradient(135deg, #1b4332, #2d6a4f);
                color: #fff;
                border-bottom-right-radius: 4px;
            }

            .bot-message .message-content {
                background: #fff;
                color: #333;
                border: 1px solid #e0e0e0;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .message-content small {
                display: block;
                margin-top: 8px;
                opacity: 0.8;
            }

            .chatbot-input-container {
                padding: 15px;
                background: #fff;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
            }

            .chatbot-input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 24px;
                font-size: 0.9rem;
                outline: none;
                transition: border-color 0.3s ease;
            }

            .chatbot-input:focus {
                border-color: #2d6a4f;
            }

            .chatbot-send {
                width: 46px;
                height: 46px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1b4332, #2d6a4f);
                color: #fff;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .chatbot-send:hover {
                transform: scale(1.1);
                background: linear-gradient(135deg, #2d6a4f, #40916c);
            }

            [data-theme="dark"] .chatbot-container {
                background: #1e293b;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            }

            [data-theme="dark"] .chatbot-messages {
                background: #0f172a;
            }

            [data-theme="dark"] .bot-message .message-content {
                background: #1e293b;
                color: #e0e0e0;
                border-color: #334155;
            }

            [data-theme="dark"] .chatbot-input {
                background: #1e293b;
                border-color: #334155;
                color: #e0e0e0;
            }

            [data-theme="dark"] .chatbot-input-container {
                background: #1e293b;
                border-color: #334155;
            }

            [data-theme="dark"] .chatbot-toggle {
                background: linear-gradient(135deg, #1b4332, #2d6a4f);
            }

            [data-theme="dark"] .chatbot-toggle:hover {
                background: linear-gradient(135deg, #2d6a4f, #40916c);
            }

            @media (max-width: 768px) {
                .chatbot-toggle {
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                    bottom: 145px;
                    right: 15px;
                }

                .chatbot-container {
                    bottom: 80px;
                    right: 10px;
                    left: 10px;
                    width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        addChatbotStyles();
        createChatbot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
