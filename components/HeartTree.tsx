"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import TreeVisualization from "./TreeVisualization"

export default function HeartTree() {
  const [prompt, setPrompt] = useState("")
  const [treeData, setTreeData] = useState(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here we would normally call an API to generate the tree data
    // For now, we'll use a placeholder function
    const generatedTree = generateTreeData(prompt)
    setTreeData(generatedTree)
  }

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-center border-b border-purple-500 py-2">
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Enter your creative prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <motion.button
            className="flex-shrink-0 bg-purple-500 hover:bg-purple-700 border-purple-500 hover:border-purple-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Generate Tree
          </motion.button>
        </div>
      </form>
      {treeData && <TreeVisualization data={treeData} />}
    </div>
  )
}

// Placeholder function to generate tree data
function generateTreeData(prompt: string) {
  // This is a simplified example. In a real application, this would be more complex
  // and would likely involve calling an API
  return {
    name: prompt,
    children: [
      {
        name: "Branch 1",
        children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
      },
      {
        name: "Branch 2",
        children: [{ name: "Leaf 2.1" }, { name: "Leaf 2.2" }],
      },
    ],
  }
}

