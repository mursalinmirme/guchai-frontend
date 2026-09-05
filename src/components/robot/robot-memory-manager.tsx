import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, BrainCircuit, XCircle } from "lucide-react";
import { robotApi, RobotMemory } from "@/api/robot.api";

interface RobotMemoryManagerProps {
  onClose: () => void;
}

export function RobotMemoryManager({ onClose }: RobotMemoryManagerProps) {
  const [memories, setMemories] = useState<RobotMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const data = await robotApi.getMemories();
      setMemories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setMemories((prev) => prev.filter((m) => m._id !== id)); // Optimistic UI
      await robotApi.deleteMemory(id);
    } catch (e) {
      console.error(e);
      fetchMemories(); // Revert on fail
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to forget all memories?")) return;
    try {
      setClearing(true);
      await robotApi.clearMemories();
      setMemories([]);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary relative">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-bg-secondary/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-5 text-brand" />
          <h2 className="font-semibold text-text-main">Robot Memory</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-text-dim hover:text-text-main transition-colors rounded-full hover:bg-surface"
        >
          <XCircle className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-text-dim text-sm animate-pulse">Loading memories...</span>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-text-dim">
            <BrainCircuit className="size-10 mb-3 opacity-20" />
            <p className="text-sm">No memories saved yet.</p>
            <p className="text-xs mt-1 max-w-[200px]">
              Ask Robot to "remember that I prefer to work in the mornings".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {memories.map((mem) => (
                <motion.div
                  key={mem._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-surface border border-border p-3 rounded-xl flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold tracking-wider text-brand mb-1 block uppercase">
                      {mem.type.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm text-text-main leading-snug break-words">
                      {mem.content}
                    </p>
                    <span className="text-[10px] text-text-dim mt-2 block">
                      Saved {new Date(mem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(mem._id)}
                    className="p-1.5 text-text-dim hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Memory"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {memories.length > 0 && (
        <div className="p-4 border-t border-border bg-bg-secondary">
          <button
            onClick={handleClear}
            disabled={clearing}
            className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {clearing ? "Forgetting..." : "Clear All Memories"}
          </button>
        </div>
      )}
    </div>
  );
}
