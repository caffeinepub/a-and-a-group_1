import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bot,
  CreditCard,
  Mail,
  MessageCircle,
  Send,
  Ticket,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitProblemReport } from "../hooks/useQueries";
import type { AIChatLog, AIChatMessage } from "../utils/localData";
import { getCurrentUser, saveChatLog } from "../utils/localData";

// ─── Constants ───────────────────────────────────────────────────────────────

const ADMIN_CODE = "1649963";
const WA_NUMBER = "917380869635";
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

// ─── Language Detection ──────────────────────────────────────────────────────

function detectHindi(text: string): boolean {
  // Devanagari unicode block
  return /[\u0900-\u097F]/.test(text);
}

// ─── Multilingual Step-by-Step AI Engine ─────────────────────────────────────

interface BotResult {
  text: string;
  canResolve: boolean;
}

function getAIResponse(
  input: string,
  _userCode: string,
  userName?: string,
): BotResult {
  const isHindi = detectHindi(input);
  const q = input.toLowerCase();
  const nameGreet = userName && userName !== "Guest" ? ` **${userName}**` : "";

  // ── Order lookup ────────────────────────────────────────────────────────
  // NOTE: Order lookup in AI chat is limited to guiding users to the My Orders
  // page since orders are stored on the central backend (not localStorage).
  // Full order details can be found at the My Orders page using the Order ID.
  const orderIdMatch = input.match(/AAG-\d{7}/i);
  if (orderIdMatch) {
    return {
      text: isHindi
        ? `Order ID **${orderIdMatch[0].toUpperCase()}** के लिए:\n\n📦 **My Orders** page पर जाएं\n🔍 अपना Order ID search करें\n\nवहाँ आपको complete order details, payment status, और progress दिखेगा।`
        : `For Order ID **${orderIdMatch[0].toUpperCase()}**:\n\n📦 Go to the **My Orders** page\n🔍 Search with your Order ID\n\nYou'll see complete order details, payment status, and progress there.`,
      canResolve: true,
    };
  }

  // ── Greetings ────────────────────────────────────────────────────────────
  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey") ||
    q.includes("नमस्ते") ||
    q.includes("हेलो") ||
    q.includes("हाय") ||
    q.includes("hii") ||
    q.includes("helo") ||
    q.includes("bhai") ||
    q.includes("yaar") ||
    q.includes("kya hal") ||
    q.includes("kaise ho")
  ) {
    return {
      text: isHindi
        ? `नमस्ते${nameGreet}! 👋 मैं A AND A GROUP का AI Assistant हूँ। मैं आपकी मदद कर सकता हूँ:\n\n• **Order Place करना**\n• **Payment करना**\n• **Screenshot Upload करना**\n• **Order Track करना**\n\nआप क्या जानना चाहते हैं? 😊`
        : `Hello${nameGreet}! 👋 I'm the A AND A GROUP AI Assistant. I can help you with:\n\n• **Placing an order**\n• **Making payment**\n• **Uploading screenshots**\n• **Tracking your order**\n\nWhat would you like to know? 😊`,
      canResolve: true,
    };
  }

  // ── How to place order ────────────────────────────────────────────────────
  if (
    q.includes("order") ||
    q.includes("place order") ||
    q.includes("buy") ||
    q.includes("purchase") ||
    q.includes("order kaise") ||
    q.includes("ऑर्डर") ||
    q.includes("service leni")
  ) {
    if (
      q.includes("track") ||
      q.includes("status") ||
      q.includes("where") ||
      q.includes("kahan") ||
      q.includes("track karna")
    ) {
      return {
        text: isHindi
          ? "**Order Track करने के Steps:**\n\n1️⃣ Navigation menu में **My Orders** पर जाएं\n2️⃣ अपना **Order ID** डालें (format: AAG-XXXXXXX)\n3️⃣ **Track Order** button दबाएं\n\nआपको दिखेगा:\n• Order Received ✅\n• In Progress 🔄\n• Completed 🎉\n\nया यहाँ सीधे अपना Order ID type करें, मैं check करूँगा।"
          : "**Steps to Track Your Order:**\n\n1️⃣ Go to **My Orders** in the navigation menu\n2️⃣ Enter your **Order ID** (format: AAG-XXXXXXX)\n3️⃣ Click **Track Order**\n\nYou'll see:\n• Order Received ✅\n• In Progress 🔄\n• Completed 🎉\n\nOr just type your Order ID here and I'll look it up for you.",
        canResolve: true,
      };
    }
    return {
      text: isHindi
        ? "**Order Place करने के Steps:**\n\n1️⃣ **Contact** page पर जाएं\n2️⃣ Form भरें:\n   • अपना नाम\n   • Email address\n   • WhatsApp number\n   • Service select करें\n   • Project details लिखें\n   • Budget (₹ XYZ)\n   • Time estimate\n3️⃣ **Submit** button दबाएं\n4️⃣ आपको एक unique **Order ID** मिलेगी (AAG-XXXXXXX)\n5️⃣ Payment करें और screenshot upload करें\n\nकोई problem हो तो बताएं!"
        : "**Steps to Place an Order:**\n\n1️⃣ Go to the **Contact** page\n2️⃣ Fill the form:\n   • Your name\n   • Email address\n   • WhatsApp number\n   • Select a service\n   • Project details\n   • Budget (₹ XYZ)\n   • Time estimate\n3️⃣ Click **Submit**\n4️⃣ You'll receive a unique **Order ID** (AAG-XXXXXXX)\n5️⃣ Complete payment and upload your screenshot\n\nLet me know if you need help!",
      canResolve: true,
    };
  }

  // ── Payment ────────────────────────────────────────────────────────────────
  if (
    q.includes("payment") ||
    q.includes("pay") ||
    q.includes("upi") ||
    q.includes("qr") ||
    q.includes("bank") ||
    q.includes("paisa") ||
    q.includes("पैसा") ||
    q.includes("भुगतान") ||
    q.includes("transfer")
  ) {
    return {
      text: isHindi
        ? "**Payment करने के Options:**\n\n1️⃣ **QR Code** — UPI app से QR scan करें\n2️⃣ **UPI ID** — `aloksi@ptyes` (Copy button available)\n3️⃣ **Pay Now** — UPI button से instant payment\n4️⃣ **Bank Transfer:**\n   • Name: Niraj Singh\n   • A/C: 7380869635\n   • IFSC: AIRP0000001\n\n✅ Payment के बाद **screenshot upload** करें (Thank You page पर)\n\nPayment issue हो तो नीचे Support देखें।"
        : "**Payment Options:**\n\n1️⃣ **QR Code** — Scan with any UPI app\n2️⃣ **UPI ID** — `aloksi@ptyes` (Copy button available)\n3️⃣ **Pay Now** — Instant UPI payment button\n4️⃣ **Bank Transfer:**\n   • Name: Niraj Singh\n   • A/C: 7380869635\n   • IFSC: AIRP0000001\n\n✅ After payment, **upload your screenshot** on the Thank You page.\n\nFacing a payment issue? Use the Support options below.",
      canResolve: true,
    };
  }

  // ── Upload screenshot ──────────────────────────────────────────────────────
  if (
    q.includes("screenshot") ||
    q.includes("upload") ||
    q.includes("proof") ||
    q.includes("photo") ||
    q.includes("image") ||
    q.includes("screenshoot") ||
    q.includes("स्क्रीनशॉट") ||
    q.includes("अपलोड")
  ) {
    return {
      text: isHindi
        ? "**Payment Screenshot Upload करने के Steps:**\n\n1️⃣ Order submit करने के बाद **Thank You page** खुलेगा\n2️⃣ वहाँ **Upload Payment Screenshot** section होगा\n3️⃣ अपना screenshot drag-and-drop करें या **Choose File** करें\n4️⃣ File size max **10MB**, format: JPG/PNG/WEBP\n5️⃣ Upload होने के बाद ✅ confirmation मिलेगी\n\nअगर upload fail हो तो system automatically 3 बार retry करेगा।\n\nकोई problem? नीचे Support बटन से WhatsApp करें।"
        : "**Steps to Upload Payment Screenshot:**\n\n1️⃣ After order submission, the **Thank You page** opens\n2️⃣ Look for the **Upload Payment Screenshot** section\n3️⃣ Drag-and-drop your screenshot or click **Choose File**\n4️⃣ Max file size: **10MB**, formats: JPG/PNG/WEBP\n5️⃣ You'll see a ✅ confirmation after upload\n\nIf upload fails, the system retries automatically 3 times.\n\nStill having issues? Use the Support button below.",
      canResolve: true,
    };
  }

  // ── Services ───────────────────────────────────────────────────────────────
  if (
    q.includes("service") ||
    q.includes("video") ||
    q.includes("logo") ||
    q.includes("graphic") ||
    q.includes("web") ||
    q.includes("app") ||
    q.includes("design") ||
    q.includes("seo") ||
    q.includes("animation") ||
    q.includes("thumbnail") ||
    q.includes("social media") ||
    q.includes("reels") ||
    q.includes("gaming") ||
    q.includes("youtube") ||
    q.includes("सर्विस")
  ) {
    return {
      text: isHindi
        ? "हम ये services offer करते हैं:\n\n🎬 Video Editing & Gaming Montage\n🎨 Graphic, Logo & UI/UX Design\n🌐 Web & App Development\n📱 Social Media & Instagram Reels\n🔍 SEO Optimization\n✨ AI Image Generation\n📝 Content Writing & Brand Identity\n🎞️ Animation / Motion Graphics\n\nकोई specific service के बारे में जानना है? **Services** page visit करें।"
        : "We offer these services:\n\n🎬 Video Editing & Gaming Montage\n🎨 Graphic, Logo & UI/UX Design\n🌐 Web & App Development\n📱 Social Media & Instagram Reels\n🔍 SEO Optimization\n✨ AI Image Generation\n📝 Content Writing & Brand Identity\n🎞️ Animation / Motion Graphics\n\nVisit the **Services** page for full details and pricing.",
      canResolve: true,
    };
  }

  // ── Contact / Support ──────────────────────────────────────────────────────
  if (
    q.includes("contact") ||
    q.includes("whatsapp") ||
    q.includes("email") ||
    q.includes("reach") ||
    q.includes("call") ||
    q.includes("support") ||
    q.includes("help") ||
    q.includes("संपर्क") ||
    q.includes("मदद")
  ) {
    return {
      text: isHindi
        ? "हमसे इन तरीकों से contact करें:\n\n💬 **WhatsApp:** +91 73808 69635 (सबसे तेज़)\n📧 **Email:** workfora.agroup@zohomail.in\n\nसोमवार–शनिवार, सुबह 9 बजे – रात 9 बजे IST\nAverage response time: 1 घंटे से कम\n\nनीचे Support buttons से directly contact कर सकते हैं।"
        : "You can reach us through:\n\n💬 **WhatsApp:** +91 73808 69635 (fastest response)\n📧 **Email:** workfora.agroup@zohomail.in\n\nMon–Sat, 9AM–9PM IST. Average response: under 1 hour.\n\nUse the Support buttons below to contact directly.",
      canResolve: true,
    };
  }

  // ── Price / cost ───────────────────────────────────────────────────────────
  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("how much") ||
    q.includes("rate") ||
    q.includes("charge") ||
    q.includes("fee") ||
    q.includes("kitna") ||
    q.includes("कितना") ||
    q.includes("price kya")
  ) {
    return {
      text: isHindi
        ? "हमारी pricing project के हिसाब से flexible है। Custom quote पाने के लिए:\n\n1️⃣ **Contact** page पर जाएं\n2️⃣ Form में अपनी service और budget भरें\n3️⃣ Submit करें\n\n24 घंटे के अंदर हम custom proposal भेजेंगे। 😊"
        : "Our pricing is flexible and project-based. To get a custom quote:\n\n1️⃣ Go to the **Contact** page\n2️⃣ Fill in your service requirements and budget\n3️⃣ Submit the form\n\nWe'll reply with a custom proposal within 24 hours. 😊",
      canResolve: true,
    };
  }

  // ── Problem / glitch ──────────────────────────────────────────────────────
  if (
    q.includes("problem") ||
    q.includes("issue") ||
    q.includes("glitch") ||
    q.includes("bug") ||
    q.includes("error") ||
    q.includes("complaint") ||
    q.includes("समस्या") ||
    q.includes("दिक्कत") ||
    q.includes("nahi chal")
  ) {
    return {
      text: isHindi
        ? "समझ गया, आपको कोई problem है। मैं यहाँ help करने की कोशिश करूँगा।\n\nअगर problem solve नहीं हुई तो नीचे **Create Ticket** button से ticket submit करें — हमारी team 24 घंटे में respond करेगी।"
        : "I understand you're facing an issue. Let me try to help.\n\nIf I can't resolve it, use the **Create Ticket** button below — our team will respond within 24 hours.",
      canResolve: false,
    };
  }

  // ── Portfolio / reviews ───────────────────────────────────────────────────
  if (
    q.includes("portfolio") ||
    q.includes("work") ||
    q.includes("sample") ||
    q.includes("review") ||
    q.includes("rating") ||
    q.includes("काम") ||
    q.includes("portfolio")
  ) {
    return {
      text: isHindi
        ? "हमारा portfolio **Portfolio** page पर देख सकते हैं। Video edits, graphic designs, websites, app UIs सब कुछ है।\n\nClient reviews के लिए **Reviews** page visit करें — हमारी average rating 4.9/5 है! ⭐"
        : "View our portfolio on the **Portfolio** page — video edits, graphic designs, websites, app UIs and more.\n\nFor client reviews, visit the **Reviews** page. Our average rating is 4.9/5! ⭐",
      canResolve: true,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    text: isHindi
      ? "मुझे यह समझ नहीं आया। आप इनके बारे में पूछ सकते हैं:\n\n• **Order place करना**\n• **Payment करना**\n• **Screenshot upload करना**\n• **Order track करना**\n• **Services**\n• **Contact / Support**\n\nया नीचे **Create Ticket** button से हमारी team से directly बात करें।"
      : "I'm not sure about that. You can ask about:\n\n• **Placing an order**\n• **Payment**\n• **Uploading screenshots**\n• **Tracking your order**\n• **Services**\n• **Contact / Support**\n\nOr use **Create Ticket** below to reach our team directly.",
    canResolve: false,
  };
}

// ─── Format Message ──────────────────────────────────────────────────────────

function formatMessage(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={`line-${lineIdx}-${line.slice(0, 8)}`}>
        {parts.map((part, i) => {
          const k = `seg-${lineIdx}-${i}`;
          return i % 2 === 1 ? (
            <strong key={k} className="text-primary font-semibold">
              {part}
            </strong>
          ) : (
            <span key={k}>{part}</span>
          );
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Ticket Form Inside Chat ──────────────────────────────────────────────────

interface TicketData {
  name: string;
  email: string;
  orderId: string;
  issueType: string;
  description: string;
}

function TicketForm({
  onSubmit,
  onCancel,
  isHindi,
  defaultName,
  defaultEmail,
}: {
  onSubmit: (data: TicketData) => void;
  onCancel: () => void;
  isHindi: boolean;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [form, setForm] = useState<TicketData>({
    name: defaultName || "",
    email: defaultEmail || "",
    orderId: "",
    issueType: "",
    description: "",
  });
  const set = (k: keyof TicketData) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const lbl = isHindi
    ? {
        name: "आपका नाम *",
        email: "Email *",
        orderId: "Order ID (optional)",
        issueType: "Issue Type *",
        desc: "Problem describe करें *",
        submit: "Ticket Submit करें",
        cancel: "Cancel",
        namePh: "नाम डालें",
        emailPh: "email@example.com",
        orderPh: "AAG-XXXXXXX",
        descPh: "समस्या का विवरण लिखें...",
        types: ["Payment", "Bug", "Glitch", "Other"],
      }
    : {
        name: "Your Name *",
        email: "Email *",
        orderId: "Order ID (optional)",
        issueType: "Issue Type *",
        desc: "Describe the Problem *",
        submit: "Submit Ticket",
        cancel: "Cancel",
        namePh: "Enter your name",
        emailPh: "email@example.com",
        orderPh: "AAG-XXXXXXX",
        descPh: "Describe the issue...",
        types: ["Payment", "Bug", "Glitch", "Other"],
      };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.issueType || !form.description)
      return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 px-1">
      <div>
        <Label className="text-[10px] text-muted-foreground">{lbl.name}</Label>
        <Input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder={lbl.namePh}
          required
          className="h-7 text-xs bg-secondary border-border"
        />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">{lbl.email}</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          placeholder={lbl.emailPh}
          required
          className="h-7 text-xs bg-secondary border-border"
        />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">
          {lbl.orderId}
        </Label>
        <Input
          value={form.orderId}
          onChange={(e) => set("orderId")(e.target.value)}
          placeholder={lbl.orderPh}
          className="h-7 text-xs bg-secondary border-border"
        />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">
          {lbl.issueType}
        </Label>
        <Select value={form.issueType} onValueChange={set("issueType")}>
          <SelectTrigger
            className="h-7 text-xs bg-secondary border-border"
            data-ocid="ticket.issue_type.select"
          >
            <SelectValue
              placeholder={isHindi ? "Issue type चुनें" : "Select issue type"}
            />
          </SelectTrigger>
          <SelectContent>
            {lbl.types.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">{lbl.desc}</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder={lbl.descPh}
          required
          rows={3}
          className="text-xs bg-secondary border-border resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          data-ocid="ticket.cancel_button"
          className="flex-1 h-7 text-xs border-border"
        >
          {lbl.cancel}
        </Button>
        <Button
          type="submit"
          size="sm"
          data-ocid="ticket.submit_button"
          className="flex-1 h-7 text-xs bg-primary text-primary-foreground"
        >
          {lbl.submit}
        </Button>
      </div>
    </form>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  showTicket?: boolean;
  isTyping?: boolean;
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

function AIChatPanel({ onClose }: { onClose: () => void }) {
  const user = getCurrentUser();
  const userCode = user?.code ?? "guest";
  const userName = user?.name ?? "Guest";
  const isAdmin = userCode === ADMIN_CODE;

  const sessionId = useRef<string>(`${userCode}-${Date.now()}`);
  const logRef = useRef<AIChatLog>({
    id: sessionId.current,
    userCode,
    userName,
    sessionStart: new Date().toISOString(),
    messages: [],
  });

  const GREETING: ChatMessage = {
    id: "greeting",
    role: "bot",
    text: isAdmin
      ? `Hello Admin! 👋 I'm the AAG AI Assistant. You have full access.\n\nAsk about any order, payment, or say 'show orders summary'.`
      : userName !== "Guest"
        ? `Hello **${userName}**! 👋 Welcome to A AND A GROUP.\n\nYour User Code: \`${userCode}\`\n\nI can help you with:\n• **Order place karna**\n• **Payment karna**\n• **Screenshot upload karna**\n• **Order track karna**\n\nHindi ya English mein poochh sakte hain! 😊`
        : "Hello! 👋 I'm the A AND A GROUP AI Assistant.\n\nI can help you with:\n• **Placing an order**\n• **Payment**\n• **Uploading screenshots**\n• **Tracking your order**\n\nWhat would you like help with? (Hindi / English दोनों में पूछ सकते हैं!)",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "support">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: submitReport } = useSubmitProblemReport();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist log on unmount
  useEffect(() => {
    return () => {
      if (logRef.current.messages.length > 0) {
        saveChatLog(logRef.current);
      }
    };
  }, []);

  const appendLog = (msg: AIChatMessage) => {
    logRef.current.messages.push(msg);
    saveChatLog(logRef.current);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    };

    appendLog({ role: "user", text, timestamp: new Date().toISOString() });

    // Typing placeholder
    const typingId = `typing-${Date.now()}`;
    const typingMsg: ChatMessage = {
      id: typingId,
      role: "bot",
      text: "",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInput("");
    setShowTicketForm(false);

    // ~1 second typing animation then real response
    setTimeout(() => {
      const result = getAIResponse(text, userCode, userName);
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: result.text,
        timestamp: new Date(),
        showTicket: !result.canResolve,
      };

      appendLog({
        role: "bot",
        text: result.text,
        timestamp: new Date().toISOString(),
      });

      setMessages((prev) => prev.map((m) => (m.id === typingId ? botMsg : m)));
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickSend = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
        timestamp: new Date(),
      };
      appendLog({ role: "user", text, timestamp: new Date().toISOString() });
      const typingId = `typing-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: typingId,
          role: "bot",
          text: "",
          timestamp: new Date(),
          isTyping: true,
        },
      ]);
      setInput("");
      setTimeout(() => {
        const result = getAIResponse(text, userCode, userName);
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          role: "bot",
          text: result.text,
          timestamp: new Date(),
          showTicket: !result.canResolve,
        };
        appendLog({
          role: "bot",
          text: result.text,
          timestamp: new Date().toISOString(),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === typingId ? botMsg : m)),
        );
      }, 1000);
    }, 50);
  };

  const handleTicketSubmit = async (data: TicketData) => {
    let backendId: bigint | null = null;

    // Try to save to backend — waitForActor inside mutation handles initialization
    try {
      const result = await submitReport({
        name: data.name,
        email: data.email,
        orderId: data.orderId || null,
        description: `[${data.issueType}] ${data.description}`,
      });
      backendId = result ?? BigInt(0);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Ticket] Submit failed:", errMsg);
      toast.error(
        "Failed to submit ticket. Please check your connection and try again.",
      );
      return;
    }

    if (backendId === null) {
      toast.error(
        "Failed to submit ticket. Please check your connection and try again.",
      );
      return;
    }

    const ticketRef = `TKT-${backendId.toString().padStart(6, "0")}`;

    const confirmMsg: ChatMessage = {
      id: `b-confirm-${Date.now()}`,
      role: "bot",
      text: detectHindi(data.description)
        ? `✅ **Ticket Submit हो गई!**\n\nआपकी ticket हमारी team को मिल गई है। 24 घंटे में respond किया जाएगा।\n\nTicket Reference: **${ticketRef}**`
        : `✅ **Ticket Submitted!**\n\nYour ticket has been received by our team. We'll respond within 24 hours.\n\nTicket Reference: **${ticketRef}**`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMsg]);
    setShowTicketForm(false);
    toast.success("Ticket submitted! Our team will respond within 24 hours.");
  };

  const quickSuggestions = [
    { label: "Track Order", text: "How do I track my order?" },
    { label: "Payment", text: "How to make payment?" },
    { label: "Upload Screenshot", text: "How to upload payment screenshot?" },
    { label: "Place Order", text: "How to place an order?" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass border border-primary/30 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] w-80 flex flex-col overflow-hidden"
      style={{
        boxShadow:
          "0 0 0 1px oklch(0.75 0.18 210 / 0.15), 0 8px 40px rgba(0,0,0,0.6)",
        maxHeight: "min(520px, calc(100vh - 120px))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-display font-bold text-foreground leading-tight">
              AAG Assistant
            </p>
            <p className="text-[10px] text-emerald-400 font-body flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Online • Hindi / English
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {(["chat", "support"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`chat.${tab}.tab`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[11px] font-display font-semibold transition-colors ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "chat" ? "AI Chat" : "Support"}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-body leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary border border-border text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.isTyping ? (
                      <TypingDots />
                    ) : msg.role === "bot" ? (
                      formatMessage(msg.text)
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>

                {/* Create Ticket button after bot message */}
                {msg.showTicket && !showTicketForm && (
                  <div className="flex justify-start mt-1 ml-8">
                    <button
                      type="button"
                      data-ocid="chat.create_ticket.button"
                      onClick={() => setShowTicketForm(true)}
                      className="flex items-center gap-1.5 text-[10px] font-body px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Ticket className="w-3 h-3" />
                      Create Ticket
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Inline ticket form */}
            {showTicketForm && (
              <div className="bg-secondary border border-border rounded-xl p-3 mt-2">
                <p className="text-[11px] font-display font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Ticket className="w-3 h-3 text-primary" />
                  Submit a Support Ticket
                </p>
                <TicketForm
                  onSubmit={handleTicketSubmit}
                  onCancel={() => setShowTicketForm(false)}
                  isHindi={messages.some(
                    (m) => m.role === "user" && detectHindi(m.text),
                  )}
                  defaultName={userName !== "Guest" ? userName : undefined}
                  defaultEmail={undefined}
                />
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
            {quickSuggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleQuickSend(s.text)}
                className="text-[10px] font-body px-2 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3 flex-shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask in Hindi or English..."
              data-ocid="chat.message.input"
              className="flex-1 h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
            <Button
              type="button"
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim()}
              data-ocid="chat.send.button"
              className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:shadow-neon-blue-sm flex-shrink-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* Support Tab */}
      {activeTab === "support" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          <p className="text-[11px] text-muted-foreground font-body mb-3">
            Contact us directly or report an issue.
          </p>

          {/* WhatsApp */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="support.whatsapp.button"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
            </div>
            <div>
              <div className="text-xs font-display font-semibold text-foreground">
                WhatsApp Support
              </div>
              <div className="text-[10px] text-muted-foreground">
                Fast response
              </div>
            </div>
          </a>

          {/* Email */}
          <a
            href="mailto:workfora.agroup@zohomail.in"
            data-ocid="support.email.button"
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-display font-semibold text-foreground">
                Email Support
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                workfora.agroup@zohomail.in
              </div>
            </div>
          </a>

          {/* Payment Issue */}
          <button
            type="button"
            data-ocid="support.payment.button"
            onClick={() => {
              const msg = encodeURIComponent(
                "Hello A AND A GROUP\nI am facing an issue with my payment.\n\nPlease help me.\n\nOrder ID: ",
              );
              window.open(`${WA_LINK}?text=${msg}`, "_blank");
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-xs font-display font-semibold text-foreground">
                Payment Issue
              </div>
              <div className="text-[10px] text-muted-foreground">
                Payment problems
              </div>
            </div>
          </button>

          {/* Report Problem → opens ticket in chat */}
          <button
            type="button"
            data-ocid="support.report.button"
            onClick={() => {
              setActiveTab("chat");
              setShowTicketForm(true);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:border-destructive/50 hover:bg-destructive/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-left">
              <div className="text-xs font-display font-semibold text-foreground">
                Report a Problem
              </div>
              <div className="text-[10px] text-muted-foreground">
                Submit a support ticket
              </div>
            </div>
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FloatingWidgets() {
  const [chatOpen, setChatOpen] = useState(false);

  // Listen for custom event from Navbar "Support" link
  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("aag-open-support", handler);
    return () => window.removeEventListener("aag-open-support", handler);
  }, []);

  return (
    <>
      {/* Single bottom-right AI chat button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* AI Chat Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AIChatPanel onClose={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main AI Chat Toggle Button */}
        <motion.button
          data-ocid="chat.widget.button"
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative ${
            chatOpen
              ? "bg-secondary border border-border text-foreground"
              : "bg-primary text-primary-foreground shadow-neon-blue hover:shadow-neon-blue hover:scale-110"
          }`}
          whileTap={{ scale: 0.95 }}
          aria-label="AI Chat"
        >
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Bot className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Pulse ring */}
          {!chatOpen && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}
        </motion.button>
      </div>
    </>
  );
}
