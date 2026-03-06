import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type AIChatLog,
  deleteChatLog,
  getChatLogs,
} from "../../utils/localData";

// ─── Chat Log Row ─────────────────────────────────────────────────────────────

function ChatLogRow({
  log,
  index,
  onDelete,
}: {
  log: AIChatLog;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    deleteChatLog(log.id);
    onDelete(log.id);
    toast.success("Chat log deleted.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`admin.ai_logs.row.${index + 1}`}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm text-foreground">
              {log.userName}
            </span>
            <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {log.userCode}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-body mt-0.5">
            {new Date(log.sessionStart).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="text-[10px] bg-secondary border-border text-muted-foreground font-body">
            {log.messages.length} msg{log.messages.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            data-ocid={`admin.ai_logs.delete_button.${index + 1}`}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            data-ocid={`admin.ai_logs.expand_button.${index + 1}`}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded messages */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-secondary/20 p-4">
              <ScrollArea className="max-h-72">
                <div className="space-y-3 pr-2">
                  {log.messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-body italic">
                      No messages in this session.
                    </p>
                  ) : (
                    log.messages.map((msg, i) => (
                      <div
                        key={`${log.id}-msg-${i}`}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "bot" && (
                          <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-2.5 h-2.5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs font-body leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary/15 text-foreground rounded-tr-sm"
                              : "bg-secondary border border-border text-foreground/80 rounded-tl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <p className="text-[9px] text-muted-foreground/50 mt-1 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-2.5 h-2.5 text-accent" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function AdminAIChatLogsTab() {
  const [logs, setLogs] = useState<AIChatLog[]>(() =>
    getChatLogs().sort(
      (a, b) =>
        new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime(),
    ),
  );
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.userCode.includes(search),
  );

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const totalMessages = logs.reduce((sum, l) => sum + l.messages.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            AI Chat Logs
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            {logs.length} session{logs.length !== 1 ? "s" : ""} •{" "}
            {totalMessages} total messages
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-body text-sm px-3 py-1">
          {logs.length} sessions
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <Input
          data-ocid="admin.ai_logs.search_input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user name or code..."
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          data-ocid="admin.ai_logs.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {search ? "No logs match your search." : "No AI chat sessions yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log, i) => (
            <ChatLogRow
              key={log.id}
              log={log}
              index={i}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
