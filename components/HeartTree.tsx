"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import TreeVisualization from "./TreeVisualization";

type TreeNode = {
  name: string;
  children: TreeNode[];
};

export default function HeartTree() {
  const [prompt, setPrompt] = useState("");
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTreeData = async (retryCount = 5) => {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch("/api/getTree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`Attempt ${attempt}: Failed to fetch tree data`);
        }

        const generatedTree = await response.json();
        return generatedTree;
      } catch (error) {
        console.error(error);
        if (attempt === retryCount) {
          throw new Error("Max retry attempts reached");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTreeData(null);
    setPrompt("");

    try {
      const generatedTree = await fetchTreeData();
      const structuredTree = {
        name: prompt || "Wedding Planning",
        children: generatedTree,
      };

      console.log(structuredTree);
      setTreeData(structuredTree);
    } catch (error) {
      console.error("Error fetching tree data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-center border-b border-purple-500 py-2 hover:bg-neutral-500 hover:bg-opacity-[.1] transition-all duration-200">
          <input
            className="appearance-none bg-transparent hover:text-lg border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none transition-all duration-800"
            type="text"
            placeholder="Enter your creative prompt..."
            value={prompt}
            onKeyDown={handleEnter}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <motion.button
            className="flex-shrink-0 bg-purple-500 hover:bg-purple-700 border-purple-500 hover:border-purple-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Generate Tree"}
          </motion.button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {treeData && <TreeVisualization data={treeData} />}
    </div>
  );
}
