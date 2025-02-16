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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTreeData(null);

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
    <div className="h-screen w-screen flex flex-col">
      {/* Fixed header bar at top */}
      <div className="w-full p-6 bg-white/80 backdrop-blur-sm fixed top-0 left-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Logo/Title */}
          <h1 className="text-purple-600 text-xl font-bold whitespace-nowrap">
            Nodethis
          </h1>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="flex items-center border-2 border-purple-500 rounded-lg py-2 px-4 bg-white">
              <input
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                type="text"
                placeholder="Enter your creative prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <motion.button
                className="flex-shrink-0 bg-purple-500 hover:bg-purple-700 border-purple-500 hover:border-purple-700 text-sm border-4 text-white py-1 px-4 rounded-lg"
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Generate Tree"}
              </motion.button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Tree visualization container with fixed height */}
      <div className="flex-1"> {/* Reduced top margin */}
        <div className="h-[calc(100vh-4rem)] w-full overflow-auto border-t border-purple-100">
          {treeData && <TreeVisualization data={treeData} />}
        </div>
      </div>
    </div>
  );
}
